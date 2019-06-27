import React, { Component } from 'react';
import { Icon, Modal } from 'antd';
import EditDesc from './EditDesc';

class ModalEditDesc extends Component {

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
      <div className="edit-desc">
        <Icon type="edit" onClick={this.showModal} />
        <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
          {this.state.showComponent === true ? <EditDesc roomDesc={this.props.roomDesc} roomId={this.props.roomId} handleVisible={this.handleVisible} /> : ''}
        </Modal>
      </div>
    );
  }
}

export default ModalEditDesc;
