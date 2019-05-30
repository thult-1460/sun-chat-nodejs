import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListContacts from './ListContacts';

class ModalListContacts extends Component {
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
        <Icon type="contacts" onClick={this.showModal} />
        <Modal
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={null}
          width="900px"
        >
          {this.state.showComponent === true ? <ListContacts /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListContacts;
