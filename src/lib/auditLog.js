import { base44 } from "@/api/base44Client";

const STATUS_LABELS = {
  backlog: "Backlog",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const TYPE_LABELS = {
  task: "Task",
  bug: "Bug",
  idea: "Idea",
  feature: "Feature",
};

export async function logTaskMoved({ task, fromStatus, toStatus, user, appUser }) {
  const from = STATUS_LABELS[fromStatus] || fromStatus;
  const to = STATUS_LABELS[toStatus] || toStatus;
  await base44.entities.AuditLog.create({
    board_id: task.board_id || null,
    user_name: user?.full_name || user?.email || "Unknown",
    user_email: user?.email || "",
    user_role: appUser?.role || "user",
    action_type: "moved",
    task_title: task.title,
    task_id: task.id,
    field_changed: "status",
    from_value: fromStatus,
    to_value: toStatus,
    description: `Moved "${task.title}" from ${from} to ${to}`,
  });
}

export async function logTaskTypeChanged({ task, fromType, toType, user, appUser }) {
  const from = TYPE_LABELS[fromType] || fromType;
  const to = TYPE_LABELS[toType] || toType;
  await base44.entities.AuditLog.create({
    board_id: task.board_id || null,
    user_name: user?.full_name || user?.email || "Unknown",
    user_email: user?.email || "",
    user_role: appUser?.role || "user",
    action_type: "moved",
    task_title: task.title,
    task_id: task.id,
    field_changed: "type",
    from_value: fromType,
    to_value: toType,
    description: `Moved "${task.title}" from ${from} to ${to}`,
  });
}