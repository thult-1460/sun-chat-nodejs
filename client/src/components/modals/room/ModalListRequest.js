import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListRequest from './ListRequest';

class ModalListRequest extends Component {
  state = {
    visible: false,
    showComponent: false,
  };

  showModal = () => {
    this.setState({
      visible: true,
      showComponent: true,
    });
  };

  handleOk = e => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    this.setState({
      visible: false,
      showComponent: false,
    });
  };

  render() {
    return (
      <Badge>
        <Icon type="user-add" onClick={this.showModal} className="icon-setting-room" theme="outlined" />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <ListRequest /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListRequest;
