import React, { Component } from 'react';
import { Icon, Badge, Modal, Avatar } from 'antd';
import ListMember from './../../../pages/rooms/ListMember';

class ModalListMember extends Component {
  state = {
    visible: false,
  };

  showListMember = () => {
    this.setState({
      visible: true,
    });
  };

  handleHiddenListMember = e => {
    this.setState({
      visible: false,
    });
  };

  render() {
    return (
      <div>
        <Avatar className="list-member-chat-room" onClick={this.showListMember}>
          +{this.props.numRemainMember}
        </Avatar>
        <Modal visible={this.state.visible} onCancel={this.handleHiddenListMember} footer={null}>
          {this.state.visible === true ? <ListMember /> : ''}
        </Modal>
      </div>
    );
  }
}

export default ModalListMember;
