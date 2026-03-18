import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channel_id, limit = 50 } = await req.json();
    if (!channel_id) return Response.json({ error: 'channel_id is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slack');

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

    // Use AI to categorize messages into tasks
    const meaningfulMessages = messages.filter(m => m.type === 'message' && !m.subtype && m.text && m.text.length > 10);

    let createdCount = 0;
    for (const msg of meaningfulMessages) {
      const authorInfo = msg.user ? await getUserInfo(msg.user) : null;

      const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze this Slack message and extract a task from it. Return a JSON object.
Message: "${msg.text}"

Return:
{
  "title": "short action-oriented task title (max 10 words)",
  "type": "task" | "bug" | "idea" | "feature",
  "priority": "low" | "medium" | "high" | "urgent",
  "is_actionable": true | false
}

Only mark is_actionable=true if the message clearly describes something that needs to be done, a bug, or a feature request. Casual conversation should be false.`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: { type: 'string' },
            priority: { type: 'string' },
            is_actionable: { type: 'boolean' }
          }
        }
      });

      if (!aiResult.is_actionable) continue;

      await base44.asServiceRole.entities.Task.create({
        title: aiResult.title,
        description: msg.text,
        type: aiResult.type || 'task',
        priority: aiResult.priority || 'medium',
        status: 'backlog',
        slack_channel: channel_id,
        slack_author: authorInfo?.name || msg.username || 'Unknown',
        slack_avatar: authorInfo?.avatar || '',
        order: 0
      });
      createdCount++;
    }

    return Response.json({ success: true, processed: meaningfulMessages.length, created: createdCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});