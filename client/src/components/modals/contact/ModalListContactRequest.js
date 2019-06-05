import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListContactRequest from './ListContactRequest';
import { getNumberContactRequest } from '../../../api/contact';

class ModalListContactRequest extends Component {
  state = {
    visible: false,
    showComponent: false,
    numberContacts: 0,
  };

  componentDidMount() {
    getNumberContactRequest().then(res => {
      this.setState({
        numberContacts: res.data.result,
      });
    });
  }

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
      <Badge className="header-icon" dot={this.state.numberContacts > 0 ? true : false}>
        <Icon type="user-add" onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <ListContactRequest /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListContactRequest;
