import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CONNECTOR_ID = "69bc1bbdaebca403c4460985";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { board_id } = await req.json().catch(() => ({}));

    let accessToken;

    if (board_id) {
      // Use the board's connected admin token
      const boards = await base44.asServiceRole.entities.Board.filter({ id: board_id });
      const board = boards[0];
      if (!board?.slack_admin_user_id) {
        return Response.json({ error: 'not_connected' }, { status: 400 });
      }
      accessToken = await base44.asServiceRole.connectors.getAppUserAccessToken(CONNECTOR_ID, board.slack_admin_user_id);
    } else {
      // Fallback: use the current user's own token (for the connect flow)
      accessToken = await base44.connectors.getCurrentAppUserAccessToken(CONNECTOR_ID);
    }

    const res = await fetch(
      'https://slack.com/api/conversations.list?types=public_channel&exclude_archived=true&limit=200',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (!data.ok) return Response.json({ error: data.error }, { status: 400 });

    const channels = (data.channels || []).map(ch => ({
      id: ch.id,
      name: ch.name,
      num_members: ch.num_members
    }));

    return Response.json({ channels });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});