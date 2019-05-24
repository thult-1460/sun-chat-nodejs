import React, { Component } from 'react';
import { Icon, Badge, Modal } from 'antd';
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
      <Badge className="header-icon">
        <Icon type="team" onClick={this.showListMember} />
        <Modal visible={this.state.visible} onCancel={this.handleHiddenListMember} footer={null}>
          {this.state.visible === true ? <ListMember /> : ''}
        </Modal>
      </Badge>
    );
  }
}

export default ModalListMember;
