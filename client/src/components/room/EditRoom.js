import React, { PureComponent } from 'react';
import 'antd/dist/antd.css';
import FormCreateRoom from './FormCreateRoom';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { Button } from 'antd';

class EditRoom extends PureComponent {
  state = {
    modalVisible: false,
    roomInfo: {},
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: flag,
    });
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      roomInfo: nextProps.roomInfo
    });
  }

  render() {
    const { t } = this.props;
    const { modalVisible, roomInfo } = this.state;
    const parentMethods = {
      handleModalVisible: this.handleModalVisible
    };

    return (
      <React.Fragment>
        <Button onClick={() => this.handleModalVisible(true)}>{t('button.install-room')}</Button>
        <FormCreateRoom {...parentMethods} modalVisible={modalVisible} roomInfo={roomInfo} />
      </React.Fragment>
    );
  }
}

export default withNamespaces(['room'])(withRouter(EditRoom));
