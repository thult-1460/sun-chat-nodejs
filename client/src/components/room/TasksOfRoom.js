import React from 'react';
import 'antd/dist/antd.css';
import { Typography, Row, Col, message, Button, Input, Icon, Avatar, Progress, Tooltip, Tabs } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { getTasksOfRoom } from '../../api/task';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { config as configTask } from '../../config/task';
import { getUserAvatarUrl } from '../../helpers/common';
import ModalEditTask from './../task/ModalEditTask';
import moment from 'moment';
import ModalCreateTask from './../task/ModalCreateTask';
import { isAssignedToMe } from './../../helpers/task';

const { Text } = Typography;
const { TabPane } = Tabs;
const _ = require('underscore');

let editedTaskInfo = {};
let newTask = null;
let tabIndex = configTask.TYPE.MY_TASKS; //check tab task that user selected

class TasksOfRoom extends React.Component {
  static contextType = SocketContext;

  state = {
    tasksAssigned: [],
    myTasks: [],
    tasks: [],
  };

  showCreateTaskModal = () => {
    newTask = null;
    this.setState({
      visibleCreateTask: true,
    });
  };

  hideCreateTaskModal = newTask => {
    if (newTask._id) {
      if (tabIndex == configTask.TYPE.MY_TASKS && isAssignedToMe(newTask, this.props.userContext.info._id)) {
        this.setState({
          myTasks: [newTask, ...this.state.myTasks],
        });
      } else {
        this.setState({
          tasksAssigned: [newTask, ...this.state.tasksAssigned],
          tasks: [newTask, ...this.state.tasks],
        });
      }
    }

    this.setState({
      visibleCreateTask: false,
    });
  };

  resetNewTask = () => {
    newTask = null;
  };

  formatDueTime(timeInput) {
    const { t } = this.props;
    const time = new Date(timeInput);

    return moment(time).format(t('format_time'));
  }

  getMyTasksOfRoom = roomId => {
    tabIndex = configTask.TYPE.MY_TASKS;

    getTasksOfRoom(roomId, configTask.TYPE.MY_TASKS).then(res => {
      this.setState({
        myTasks: res.data.results.tasks,
      });
    });
  };

  getTaskAssignedOfRoom = roomId => {
    tabIndex = configTask.TYPE.TASKS_ASSIGNED;

    getTasksOfRoom(roomId, configTask.TYPE.TASKS_ASSIGNED).then(res => {
      this.setState({
        tasksAssigned: res.data.results.tasks,
      });
    });
  };

  getAllTasksOfRoom = roomId => {
    tabIndex = configTask.TYPE.ALL;

    getTasksOfRoom(roomId).then(res => {
      this.setState({
        tasks: res.data.results.tasks,
      });
    });
  };

  componentDidMount() {
    const roomId = this.props.match.params.id;
    const { socket } = this.context;
    this.setState({ activeKey: '1' });

    this.getMyTasksOfRoom(roomId);
  }

  handleChangeTabs = key => {
    const roomId = this.props.match.params.id;
    this.setState({ activeKey: key });

    if (key == configTask.TYPE.MY_TASKS) {
      this.getMyTasksOfRoom(roomId);
    } else if (key == configTask.TYPE.TASKS_ASSIGNED) {
      this.getTaskAssignedOfRoom(roomId);
    } else {
      this.getAllTasksOfRoom(roomId);
    }
  };

  componentWillReceiveProps(nextProps) {
    const roomId = nextProps.match.params.id;

    if (this.props.match.params.id !== roomId) {
      if (tabIndex == configTask.TYPE.MY_TASKS) {
        this.getMyTasksOfRoom(roomId);
      } else if (tabIndex == configTask.TYPE.TASKS_ASSIGNED) {
        this.getTaskAssignedOfRoom(roomId);
      } else {
        this.getAllTasksOfRoom(roomId);
      }
    }
  }

  handleEditTask = e => {
    const taskId = e.target.closest('i').getAttribute('data-taskid');
    const { myTasks, tasks, tasksAssigned } = this.state;

    let editedTask;
    let assignees = [];
    let tasksTmp = [];
    if (tabIndex == configTask.TYPE.MY_TASKS) {
      tasksTmp = myTasks;
    } else if (tabIndex == configTask.TYPE.TASKS_ASSIGNED) {
      tasksTmp = tasksAssigned;
    } else {
      tasksTmp = tasks;
    }

    // Get edited task info
    tasksTmp.map(t => {
      if (t._id == taskId) {
        editedTask = t;
      }
    });

    // Get assigness in edited task
    editedTask.assignees.map(t => {
      assignees.push(t.user);
    });

    editedTaskInfo = {
      content: editedTask.content,
      start: editedTask.start,
      due: editedTask.due,
      assignees: assignees,
      id: taskId,
    };

    this.setState({
      visibleEditTask: true,
    });
  };

  handleHiddenEditTaskModal = () => {
    this.setState({
      visibleEditTask: false,
    });
  };

  updateEditedTaskIntoList = data => {
    let { myTasks, tasksAssigned, tasks } = this.state;

    if (data != undefined) {
      let indexOfEditedTask = -1;

      // Update tasks list when a task edited
      if (tabIndex == configTask.TYPE.MY_TASKS) {
        for (let i = 0; i < myTasks.length; i++) {
          if (myTasks[i]._id == data._id) {
            indexOfEditedTask = i;
            break;
          }
        }

        if (isAssignedToMe(data, this.props.userContext.info._id) && indexOfEditedTask != -1) {
          myTasks[indexOfEditedTask] = data;
        } else {
          myTasks.splice(indexOfEditedTask, 1);
        }

        this.setState({
          myTasks: myTasks,
        });
      } else if (tabIndex == configTask.TYPE.TASKS_ASSIGNED) {
        this.setState({
          tasksAssigned: tasksAssigned.map(task => {
            return task._id === data._id ? data : task;
          }),
        });
      } else {
        this.setState({
          tasks: tasks.map(task => {
            return task._id === data._id ? data : task;
          }),
        });
      }
    }
  };

  render() {
    let members = [];
    const roomId = this.props.match.params.id;
    const { t, roomInfo } = this.props;

    if (roomInfo != undefined && typeof roomInfo != 'string') {
      members = roomInfo.members_info;
    }

    const { myTasks, tasks, tasksAssigned } = this.state;
    const list_tasks = configTask.LIST_TASKS;
    let condFilter = [];

    for (let index in list_tasks) {
      let list_task = [];

      if (list_tasks[index].KEY == configTask.TYPE.MY_TASKS) {
        list_task = [...myTasks];
      } else if (list_tasks[index].KEY == configTask.TYPE.TASKS_ASSIGNED) {
        list_task = [...tasksAssigned];
      } else {
        list_task = [...tasks];
      }

      condFilter.push(
        <TabPane tab={<Text strong>{t(`${list_tasks[index].TITLE}`)}</Text>} key={list_tasks[index].KEY}>
          <div className="content-desc-chat-room">
            <div>
              <Button type="flex" justify="start" className="box-add-task" onClick={this.showCreateTaskModal}>
                <Col span={18}>
                  <Icon type="check-square" /> {t('title.tasks.add_task')}
                </Col>
                <Col span={6}>
                  <Icon type="plus" />
                </Col>
              </Button>
            </div>
            {list_task
              ? list_task.map((task, key) => {
                  return (
                    <div className="content-task" key={key}>
                      <Row type="flex" justify="start" className="content-task-chat-room">
                        <Col span={24}>
                          <div>{task.content}</div>
                          <hr />
                        </Col>
                        <Col span={24}>
                          <div className="assignee-info">
                            {task.assignees.map((assignee, key) => {
                              const status = _.find(configTask.STATUS, { VALUE: assignee.status });
                              const color = status ? status.COLOR : '';

                              return (
                                <div key={key}>
                                  <Tooltip title={`${assignee.name}: ${assignee.percent}%`}>
                                    <Avatar src={getUserAvatarUrl(assignee.avatar)} />
                                    <Progress
                                      percent={assignee.percent}
                                      size="small"
                                      strokeColor={color}
                                      format={() => (status ? t(status.TITLE) : '')}
                                      status={status ? status.STATUS : ''}
                                    />
                                  </Tooltip>
                                </div>
                              );
                            })}
                          </div>
                        </Col>
                      </Row>
                      <hr />
                      <Row type="flex" justify="start" className="content-task-chat-room content-task-icon">
                        <Col span={18}>
                          <div className="task-assign">
                            <Avatar src={getUserAvatarUrl(task.assigner.avatar)} /> Start{' '}
                            <strong>{this.formatDueTime(task.start)}</strong> - Due{' '}
                            <strong>{this.formatDueTime(task.due)}</strong>
                          </div>
                        </Col>
                        <Col span={6}>
                          <div className="task-icon">
                            {this.props.userContext.info._id == task.assigner._id && (
                              <div>
                                <a href="#">
                                  <Tooltip title={t('button.edit')}>
                                    <Icon type="edit" onClick={this.handleEditTask} data-taskid={task._id} />
                                  </Tooltip>
                                </a>
                                <a href="#">
                                  <Tooltip title={t('button.delete')}>
                                    <Icon type="delete" />
                                  </Tooltip>
                                </a>
                                <a href="#">
                                  <Tooltip title={t('button.done')}>
                                    <Icon type="check-circle" theme="twoTone" twoToneColor="#1890ff" />
                                  </Tooltip>
                                </a>
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );
                })
              : null}
          </div>
        </TabPane>
      );
    }

    return (
      <React.Fragment>
        <div className="chat-task">
          <Tabs onChange={this.handleChangeTabs} activeKey={this.state.activeKey}>
            {condFilter}
          </Tabs>
        </div>

        <ModalEditTask
          visibleModal={this.state.visibleEditTask}
          members={members}
          roomId={roomId}
          hiddenModal={this.handleHiddenEditTaskModal}
          task={editedTaskInfo}
          updateEditedTaskIntoList={this.updateEditedTaskIntoList}
        />
        <ModalCreateTask
          members={roomInfo.members_info}
          roomId={roomId}
          visibleCreateTask={this.state.visibleCreateTask}
          hideCreateTaskModal={this.hideCreateTaskModal}
          resetNewTask={this.resetNewTask}
        />
      </React.Fragment>
    );
  }
}

export default withRouter(withNamespaces(['task'])(withUserContext(TasksOfRoom)));
