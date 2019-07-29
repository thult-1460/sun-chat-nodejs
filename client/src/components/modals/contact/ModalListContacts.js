import React, { Component } from 'react';
import { Icon, Badge, Modal, Tabs, Button, Form, message } from 'antd';
import ListContacts from './ListContacts';
import ListGlobalNicknames from './ListGlobalNicknames';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

const { TabPane } = Tabs;

class ModalListContacts extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      showComponent: false,
    };
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
    const { t } = this.props;

    return (
      <Badge className="header-icon">
        <Icon type="contacts" onClick={this.showModal} />
        <Modal
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          footer={null}
          width="900px"
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab={t('tab.list_contacts')} key="1">
              {this.state.showComponent === true ? <ListContacts handleOk={this.handleOk} /> : ''}
            </TabPane>
            <TabPane tab={t('tab.set_nickname')} key="2">
              {this.state.showComponent === true ? <ListGlobalNicknames handleOk={this.handleOk} /> : ''}
            </TabPane>
          </Tabs>
        </Modal>
      </Badge>
    );
  }
}

export default withNamespaces(['contact'])(withRouter(ModalListContacts));
