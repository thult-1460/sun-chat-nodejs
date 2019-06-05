import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListContactRequest from './ListContactRequest';
import { getNumberContactRequest } from '../../../api/contact';
import { SocketContext } from './../../../context/SocketContext';
import config from './../../../config/contact';

class ModalListContactRequest extends Component {
  static contextType = SocketContext;

  state = {
    visible: false,
    showComponent: false,
    numberContactRequest: 0,
  };

  componentDidMount() {
    getNumberContactRequest().then(res => {
      this.setState({
        numberContactRequest: res.data.result,
      });
    });

    const socket = this.context;
    socket.on('update_request_friend_count', numberContactRequest => {
      this.setState({
        numberContactRequest: numberContactRequest,
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
      <Badge
        className="header-icon"
        count={this.state.numberContactRequest}
        overflowCount={config.NUMBER_CONTACT_REQUEST_OVERFLOW}
      >
        <Icon type="user-add" onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <ListContactRequest /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListContactRequest;
