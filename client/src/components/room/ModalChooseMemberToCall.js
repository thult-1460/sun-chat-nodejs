import React, { Component } from 'react';
import { Icon, Modal } from 'antd';
import ChooseMemberToCall from './ChooseMemberToCall';

class ModalChooseMemberToCall extends Component {

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

  handleVisible = () => {
    this.setState({
      visible: false,
      showComponent: false,
    });
  }

  handleCancel = e => {
    this.setState({
      visible: false,
      showComponent: false,
    });
  };

  render() {
    return (
      <span>
        <Icon type="video-camera" style={{ marginLeft: 10 }} onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null} className="modal-show_call">
          {this.state.showComponent === true ? <ChooseMemberToCall listMember={this.props.listMember} roomDetail={this.props.roomDetail} handleVisible={this.handleVisible} /> : ''}
        </Modal>
      </span>
    );
  }
}

export default ModalChooseMemberToCall;
