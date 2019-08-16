import React, { Component } from 'react';
import { Modal, Button } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import config from './../../../config/configServer';

class ModalNotificationCallRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      play: false,
      pause: true,
      showComponent: false,
    };

    this.url = config.CALLING_NOTIFICATION_LOCATION;
    this.audio = new Audio(this.url);
  }

  play = () => {
    this.setState({
      play: true,
    });
    this.audio.play();

  }

  pause = () => {
    this.setState({ play: false });
    this.audio.pause();
  }

  componentDidMount() {
    if (this.props.showModal) {
      this.showModal();
    }

    setTimeout(
      () => this.disableModal(),
      config.TIME_SHOW_NOTIFICATION * 1000
    );
  }

  disableModal = () => {
    this.setState({
      visible: false,
      showComponent: false,
    });
    this.pause();
    this.props.disableModal();
  }

  showModal = () => {
    this.setState({
      visible: true,
      showComponent: true,
    });
    this.play();
  };

  handleOk = () => {
    this.props.joinLiveChat();
    this.setState({
      visible: false,
    });
    this.pause();
  };

  handleCancel = () => {
    this.disableModal();
  };

  render() {
    const { t, roomName } = this.props;
    return (
      <span>
        {this.state.showComponent && (<Modal title={t('video-audio-call.invation')} maskClosable={false} visible={this.state.visible} onCancel={this.handleCancel} footer={null} width={400}>
          <p> {t('video-audio-call.message-join-call')} {roomName} </p>
          <Button type="primary" className="btn-join-call" onClick={this.handleOk}>
            {t('button.join-call')}
          </Button>
        </Modal>)}
      </span>
    );
  }
}

export default withNamespaces(['notification'])(withRouter(ModalNotificationCallRequest));
