import React, { PureComponent } from 'react';
import 'antd/dist/antd.css';
import FormCreateRoom from './FormCreateRoom';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { Button } from 'antd';

class EditRoom extends PureComponent {
  state = {
    modalVisible: false
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: flag,
    });
  };

  render() {
    const { t, roomInfo } = this.props;
    const { modalVisible } = this.state;
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
