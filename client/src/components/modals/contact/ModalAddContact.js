import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import AddContact from './AddContact';

class ModalAddContact extends Component {
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
      <Badge className="header-icon">
        <Icon type="usergroup-add" onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <AddContact /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalAddContact;
