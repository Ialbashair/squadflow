import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { board_id } = await req.json();
    if (!board_id) return Response.json({ error: 'board_id is required' }, { status: 400 });

    // Only board admins can disconnect Slack
    const members = await base44.entities.BoardMember.filter({ board_id, user_id: user.id, status: 'active' });
    const membership = members[0];
    if (!membership || membership.role !== 'admin') {
      return Response.json({ error: 'Only board admins can disconnect Slack' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Board.update(board_id, {
      slack_admin_user_id: null,
      slack_admin_user_name: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});