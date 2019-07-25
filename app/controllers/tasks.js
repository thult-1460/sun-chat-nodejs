'use strict';

const Room = require('../models/room.js');
const { validationResult } = require('express-validator/check');
const logger = require('./../logger/winston');
const channel = logger.init('error');
const config = require('../../config/config');

function customMessageValidate(errors) {
  let customErrors = { ...errors.array() };
  for (let i in customErrors) {
    let param = customErrors[i].param;

    if (customErrors[param] == undefined) {
      customErrors[param] = '';
    } else {
      customErrors[param] += ', ';
    }

    customErrors[param] += customErrors[i].msg;
    delete customErrors[i];
  }

  return customErrors;
}

exports.createTask = async (req, res) => {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const io = req.app.get('socketIO');
  const { roomId } = req.params;
  const { ...task } = req.body;
  const { _id: userId } = req.decoded;

  try {
    const room = await Room.createTask(roomId, userId, task);
    const lastTask = room.tasks.pop();
    const newTaskInfo = await Room.getTaskInfoOfRoom(roomId, lastTask._id);

    return res.status(200).json({
      task_id: lastTask._id,
      task_info: newTaskInfo,
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({ error: __('task.create.error') });
  }
};

exports.editTask = async (req, res) => {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { roomId, taskId } = req.params;
  const { ...taskInput } = req.body;

  try {
    await Room.editTask(roomId, taskId, taskInput);
    const editedTaskInfo = await Room.getTaskInfoOfRoom(roomId, taskId);

    return res.status(200).json({
      message: __('task.edit.success'),
      task_info: editedTaskInfo,
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('task.edit.error'),
    });
  }
};

exports.getTasksOfRoom = async function(req, res) {
  const { roomId } = req.params;
  const { _id } = req.decoded;
  const { type } = req.query;

  try {
    let tasks = await Room.getTasksOfRoom(roomId, _id, type);

    return res.status(200).json({
      results: {
        tasks: tasks,
      },
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      results: [],
    });
  }
};

exports.deleteTask = async function(req, res) {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { roomId, taskId } = req.params;

  try {
    let tasks = await Room.deleteTask(roomId, taskId);

    return res.status(200).json({
      message: __('task.delete.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('task.delete.error'),
    });
  }
};

exports.finishTask = async function(req, res) {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { roomId, taskId } = req.params;
  const { _id: userId } = req.decoded;

  try {
    let tasks = await Room.finishTask(roomId, taskId, userId);

    return res.status(200).json({
      message: __('task.done.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('task.done.error'),
    });
  }
};

exports.rejectTask = async function(req, res) {
  const errors = validationResult(req);

  if (errors.array().length > 0) {
    let customErrors = customMessageValidate(errors);

    return res.status(422).json(customErrors);
  }

  const { roomId, taskId } = req.params;
  const { _id: userId } = req.decoded;

  try {
    let tasks = await Room.rejectTask(roomId, taskId, userId);

    return res.status(200).json({
      message: __('task.reject.success'),
    });
  } catch (err) {
    channel.error(err);

    return res.status(500).json({
      error: __('task.reject.error'),
    });
  }
};
