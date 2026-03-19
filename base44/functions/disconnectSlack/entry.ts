import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Delete all tasks
    const tasks = await base44.asServiceRole.entities.Task.list();
    await Promise.all(tasks.map(t => base44.asServiceRole.entities.Task.delete(t.id)));

    // Delete all audit logs
    const logs = await base44.asServiceRole.entities.AuditLog.list();
    await Promise.all(logs.map(l => base44.asServiceRole.entities.AuditLog.delete(l.id)));

    return Response.json({ success: true, deletedTasks: tasks.length, deletedLogs: logs.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});