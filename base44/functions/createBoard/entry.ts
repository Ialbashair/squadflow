import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await req.json();
    if (!name?.trim()) return Response.json({ error: 'Board name is required' }, { status: 400 });

    // Create the board
    const board = await base44.asServiceRole.entities.Board.create({
      name: name.trim(),
      description: description?.trim() || '',
      admin_user_id: user.id,
      admin_user_email: user.email,
    });

    // Auto-create admin BoardMember record
    await base44.asServiceRole.entities.BoardMember.create({
      board_id: board.id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name || user.email,
      role: 'admin',
      status: 'accepted',
      joined_at: new Date().toISOString(),
    });

    // Auto-create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    const columns = await Promise.all(
      defaultColumns.map((title, position) =>
        base44.asServiceRole.entities.Column.create({
          board_id: board.id,
          title,
          position,
        })
      )
    );

    return Response.json({ board, columns });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});