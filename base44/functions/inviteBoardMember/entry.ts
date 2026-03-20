import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { board_id, email } = await req.json();
    if (!board_id || !email) return Response.json({ error: 'board_id and email are required' }, { status: 400 });

    // Verify the requester is an admin of this board
    const memberships = await base44.asServiceRole.entities.BoardMember.filter({ board_id, user_id: user.id });
    const myMembership = memberships.find(m => m.status === 'active' && m.role === 'admin');
    if (!myMembership) return Response.json({ error: 'Forbidden: only board admins can invite' }, { status: 403 });

    // Check if already a member
    const existing = await base44.asServiceRole.entities.BoardMember.filter({ board_id, invited_email: email });
    const activeOrPending = existing.find(m => m.status === 'active' || m.status === 'pending');
    if (activeOrPending) return Response.json({ error: 'This email is already invited or a member' }, { status: 409 });

    // Look up existing user by email in AppUser entity
    const matchedUsers = await base44.asServiceRole.entities.AppUser.filter({ email });
    const matchedUser = matchedUsers[0] || null;

    // Fetch board name for the email
    const boards = await base44.asServiceRole.entities.Board.filter({ id: board_id });
    const board = boards[0];

    const memberRecord = await base44.asServiceRole.entities.BoardMember.create({
      board_id,
      user_id: matchedUser?.id || null,
      user_email: email,
      user_name: matchedUser?.full_name || null,
      invited_email: email,
      invited_by: user.id,
      role: 'member',
      status: 'pending',
    });

    // Send invite email
    const inviterName = user.full_name || user.email;
    const boardName = board?.name || 'a board';
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: `${inviterName} invited you to "${boardName}" on SquadFlow`,
      body: `
        <p>Hi there,</p>
        <p><strong>${inviterName}</strong> has invited you to join the board <strong>"${boardName}"</strong> on SquadFlow.</p>
        <p>Log in to SquadFlow and check your dashboard to accept or decline the invite.</p>
        <p>— The SquadFlow Team</p>
      `,
    });

    return Response.json({ member: memberRecord });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});