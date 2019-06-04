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

  handleOk = e => {
    this.setState({
      visible: false,
    });
  };

  render() {
    return (
      <div>
        <a>
          <Avatar className="list-member-chat-room" onClick={this.showListMember}>
            +{this.props.numRemainMember}
          </Avatar>
        </a>
        <Modal visible={this.state.visible} onCancel={this.handleHiddenListMember} footer={null} width="550px">
          {this.state.visible === true ? <ListMember handleOk={this.handleOk} /> : ''}
        </Modal>
      </div>
    );
  }
}

export default ModalListMember;
