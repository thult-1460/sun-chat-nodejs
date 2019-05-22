import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListContactRequest from './ListContactRequest';

class ModalListContactRequest extends Component {
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
      <Badge className="header-icon" dot>
        <Icon type="user-add" onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <ListContactRequest /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListContactRequest;
