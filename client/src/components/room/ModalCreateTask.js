import React, { Component } from 'react';
import { Button, Modal, Form, Icon } from 'antd';
import CreateTaskForm from './../task/CreateTaskForm.js';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class ModalCreateTask extends Component {
  state = {
    visible: false,
    members: [],
    roomId: 0,
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
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
      <div>
        <Button type="primary" onClick={this.showModal} className="create-task-btn">
          <Icon type="check-square" />
          {t('title.create')}
        </Button>
        <Modal
          title={t('title.create')}
          visible={this.state.visible}
          onCancel={this.handleCancel}
          width="35%"
          footer={null}
        >
          <CreateTaskForm members={this.state.members} roomId={this.state.roomId} />
        </Modal>
      </div>
    );
  }
}

export default withRouter(withNamespaces(['task'])(Form.create({ name: 'modal_creat_task' })(ModalCreateTask)));
