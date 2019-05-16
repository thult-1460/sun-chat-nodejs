import React from 'react';
import { Layout, Row, Col, Menu, Icon, Badge, Dropdown, Avatar, Popover, Modal } from 'antd';
import { checkExpiredToken } from './../../helpers/common';
import ListContactRequest from '../contact/ListContactRequest';
import ChangeLanguage from './../ChangeLanguage';
const { Header } = Layout;

class Head extends React.Component {
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

  onLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  handleCancel = e => {
    this.setState({
      visible: false,
      showComponent: false,
    });
  };

  render() {
    const menu = (
      <Menu>
        <Menu.Item>
          <a href="javascript:;" onClick={this.onLogout}>
            Logout
          </a>
        </Menu.Item>
      </Menu>
    );

    const content = (
      <div>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
      </div>
    );
    return checkExpiredToken() ? (
      <Header style={{ background: '#fff', padding: 0 }}>
        <Row type="flex" justify="end" align="middle">
          <Col span={3}>
            <Badge className="header-icon" dot>
              <Icon type="contacts" theme="twoTone" onClick={this.showModal} />
              <Modal visible={this.state.visible} onOk={this.handleOk} onCancel={this.handleCancel} footer={null}>
                {this.state.showComponent === true ? <ListContactRequest /> : ''}
              </Modal>
            </Badge>
            <Popover content={content} title="Create Room" trigger="click">
              <Badge className="header-icon">
                <a href="#">
                  <Icon type="plus-circle" />
                </a>
              </Badge>
            </Popover>
          </Col>
          <Col span={3}>
            <Dropdown overlay={menu}>
              <a className="ant-dropdown-link" href="#">
                <Avatar style={{ verticalAlign: 'middle' }}>Abc</Avatar>
                <Icon type="down" />
              </a>
            </Dropdown>
          </Col>
          <Col span={3}>
            <ChangeLanguage />
          </Col>
        </Row>
      </Header>
    ) : (
      <Header style={{ background: '#fff', padding: 0 }}>
        <Row type="flex" justify="end" align="middle">
          <Col span={3}>
            <ChangeLanguage />
          </Col>
        </Row>
      </Header>
    );
  }
}
export default Head;
