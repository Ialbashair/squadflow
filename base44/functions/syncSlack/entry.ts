import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CONNECTOR_ID = "69bc1bbdaebca403c4460985";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channel_id, channel_name, limit = 30, board_id } = await req.json();
    if (!channel_id) return Response.json({ error: 'channel_id is required' }, { status: 400 });
    if (!board_id) return Response.json({ error: 'board_id is required' }, { status: 400 });

    // Only board admins can sync
    const members = await base44.entities.BoardMember.filter({ board_id, user_id: user.id, status: 'active' });
    const membership = members[0];
    if (!membership || membership.role !== 'admin') {
      return Response.json({ error: 'Only board admins can sync Slack' }, { status: 403 });
    }

    // Get the board's connected admin token
    const boards = await base44.asServiceRole.entities.Board.filter({ id: board_id });
    const board = boards[0];
    if (!board?.slack_admin_user_id) {
      return Response.json({ error: 'Slack is not connected to this board. An admin must connect Slack first.' }, { status: 400 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAppUserAccessToken(CONNECTOR_ID, board.slack_admin_user_id);

    // Fetch channel history
    const historyRes = await fetch(
      `https://slack.com/api/conversations.history?channel=${channel_id}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const historyData = await historyRes.json();

    if (!historyData.ok) {
      return Response.json({ error: historyData.error }, { status: 400 });
    }

    const messages = historyData.messages || [];

    // Fetch user info for avatars
    const userCache = {};
    const getUserInfo = async (userId) => {
      if (!userId || userCache[userId]) return userCache[userId];
      const res = await fetch(`https://slack.com/api/users.info?user=${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.ok) {
        userCache[userId] = {
          name: data.user.real_name || data.user.name,
          avatar: data.user.profile?.image_72 || ''
        };
      }
      return userCache[userId];
    };

    // Filter meaningful messages
    const meaningfulMessages = messages.filter(m => m.type === 'message' && !m.subtype && m.text && m.text.length > 10);

    if (meaningfulMessages.length === 0) {
      return Response.json({ success: true, processed: 0, created: 0 });
    }

    // Batch all messages into a single LLM call
    const messagesJson = meaningfulMessages.map((m, i) => `[${i}] ${m.text}`).join('\n\n');

    const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze these Slack messages and identify which ones are actionable (tasks, bugs, feature requests, ideas). For each actionable message, extract a task.

Messages:
${messagesJson}

Return a JSON object with a "tasks" array. Only include actionable messages — skip casual conversation.
Each task object:
{
  "index": <message index number>,
  "title": "short action-oriented title (max 10 words)",
  "type": "task" | "bug" | "idea" | "feature",
  "priority": "low" | "medium" | "high" | "urgent"
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                title: { type: 'string' },
                type: { type: 'string' },
                priority: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const extractedTasks = aiResult?.tasks || [];

    // Get first column of the board
    const columns = await base44.asServiceRole.entities.Column.filter({ board_id });
    const sorted = columns.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const firstColumnId = sorted[0]?.id || null;

    // Fetch author info and create tasks
    let createdCount = 0;
    for (const task of extractedTasks) {
      const msg = meaningfulMessages[task.index];
      if (!msg) continue;

      const authorInfo = msg.user ? await getUserInfo(msg.user) : null;

      await base44.asServiceRole.entities.Task.create({
        board_id,
        column_id: firstColumnId || null,
        title: task.title,
        description: msg.text,
        type: task.type || 'task',
        priority: task.priority || 'medium',
        status: 'backlog',
        slack_channel: channel_name || channel_id,
        slack_channel_id: channel_id,
        slack_author: authorInfo?.name || msg.username || 'Unknown',
        slack_avatar: authorInfo?.avatar || '',
        slack_message_ts: msg.ts || '',
        position: 0,
        order: 0
      });
      createdCount++;
    }

    return Response.json({ success: true, processed: meaningfulMessages.length, created: createdCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});