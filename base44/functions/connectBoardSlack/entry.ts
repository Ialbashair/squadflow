import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const CONNECTOR_ID = "69bd8b784da42b12ff3f7786";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { board_id } = await req.json();
    if (!board_id) return Response.json({ error: 'board_id is required' }, { status: 400 });

    // Only board admins can connect Slack
    const members = await base44.entities.BoardMember.filter({ board_id, user_id: user.id, status: 'active' });
    const membership = members[0];
    if (!membership || membership.role !== 'admin') {
      return Response.json({ error: 'Only board admins can connect Slack' }, { status: 403 });
    }

    // Verify the user actually has a Slack token connected
    let accessToken;
    try {
      accessToken = await base44.connectors.getCurrentAppUserAccessToken(CONNECTOR_ID);
    } catch {
      return Response.json({ error: 'not_connected' }, { status: 400 });
    }

    if (!accessToken) return Response.json({ error: 'not_connected' }, { status: 400 });

    // Store this admin's user ID on the board
    await base44.asServiceRole.entities.Board.update(board_id, {
      slack_admin_user_id: user.id,
      slack_admin_user_name: user.full_name || user.email,
    });

    return Response.json({ success: true, connected_by: user.full_name || user.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});