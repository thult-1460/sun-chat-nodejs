import React, { Component } from 'react';
import { Button, Modal, Form, Icon } from 'antd';
import CreateTaskForm from './../task/CreateTaskForm.js';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class ModalCreateTask extends Component {
  state = {
    members: [],
    roomId: 0,
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      members: nextProps.members,
      roomId: nextProps.roomId,
    });
  }

  componentDidMount() {
    this.setState({
      members: this.props.members,
      roomId: this.props.roomId,
    });
  }

  render() {
    const { t } = this.props;

    return (
      <Modal
        title={t('title.create')}
        visible={this.props.visibleCreateTask}
        onCancel={this.props.hideCreateTaskModal}
        width="35%"
        footer={null}
      >
        <CreateTaskForm
          members={this.state.members}
          roomId={this.state.roomId}
          resetNewTask={this.props.resetNewTask}
          hideCreateTaskModal={this.props.hideCreateTaskModal}
        />
      </Modal>
    );
  }
}

export default withRouter(withNamespaces(['task'])(Form.create({ name: 'modal_creat_task' })(ModalCreateTask)));
