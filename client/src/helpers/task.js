import { config as configTask } from './../config/task';

export function isAssignedToMe(task, userId) {
  const assignees = task.assignees;

  for (let i = 0; i < assignees.length; i++) {
    if (assignees[i].user == userId) {
      return true;
    }
  }

  return false;
}

/**
 * Check a task have been done or rejected
 */
export function isFinishTask(task, userId) {
  const assignees = task.assignees;

  for (let i = 0; i < assignees.length; i++) {
    if (
      assignees[i].user == userId &&
      (assignees[i].status == configTask.STATUS.DONE.VALUE || assignees[i].status == configTask.STATUS.REJECT.VALUE)
    ) {
      return true;
    }
  }

  return false;
}
