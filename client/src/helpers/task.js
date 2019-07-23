export function isAssignedToMe(task, userId) {
  let assignedToMe = false;
  const assignees = task.assignees;

  for (let i = 0; i < assignees.length; i++) {
    if (assignees[i].user == userId) {
      assignedToMe = true;
      break;
    }
  }

  return assignedToMe;
}
