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

export function isDoneTask(task, userId) {
  const assignees = task.assignees;

  for (let i = 0; i < assignees.length; i++) {
    if (
      assignees[i].user == userId &&
      assignees[i].percent == 100 &&
      assignees[i].status == configTask.STATUS.DONE.VALUE
    ) {
      return true;
    }
  }

  return false;
}
