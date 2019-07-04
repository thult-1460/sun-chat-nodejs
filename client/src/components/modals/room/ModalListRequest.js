import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
import ListRequest from './ListRequest';
import { getNumberOfRequests } from '../../../api/room';
import { room as roomConfig } from '../../../config/room';
import { SocketContext } from '../../../context/SocketContext';

class ModalListRequest extends Component {
  static contextType = SocketContext;

  state = {
    visible: false,
    showComponent: false,
    numberRequestJoinRooms: 0,
  };

  componentDidMount() {
    const roomId = this.props.roomId;

    getNumberOfRequests(roomId).then(res => {
      this.setState({
        numberRequestJoinRooms: res.data.result,
      });
    });

    const { socket } = this.context;
    socket.on('update_request_join_room_number', numberRequestJoinRooms => {
      this.setState({
        numberRequestJoinRooms: numberRequestJoinRooms,
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
      <Badge count={this.state.numberRequestJoinRooms} overflowCount={roomConfig.NUMBER_REQUEST_JOIN_ROOM_OVERFLOW}>
        <Icon type="user-add" onClick={this.showModal} className="icon-setting-room" theme="outlined" />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <ListRequest /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListRequest;
