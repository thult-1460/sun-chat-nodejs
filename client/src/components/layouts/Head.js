import React from 'react';
import { Layout, Row, Col, Menu, Icon, Badge, Dropdown, Avatar, Popover } from 'antd';
import { checkExpiredToken } from './../../helpers/common';
import ModalListContacts from '../modals/contact/ModalListContacts';
import ModalListContactRequest from '../modals/contact/ModalListContactRequest';
import ChangeLanguage from './../ChangeLanguage';
import { Link } from 'react-router-dom';
const { Header } = Layout;

class Head extends React.Component {
  render() {
    const menu = (
      <Menu>
        <Menu.Item>
          <Link to="/setting/profile">Profile</Link>
          <Link to="/change_password">Change Passowrd</Link>
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
            <ModalListContacts/>
            <ModalListContactRequest/>
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
