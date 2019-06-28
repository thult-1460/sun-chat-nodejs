import React from 'react';
import { Layout, Row, Col, Menu, Icon, Dropdown, Avatar } from 'antd';
import { checkExpiredToken } from './../../helpers/common';
import InputSearch from './../InputSearch';
import ModalListContacts from '../modals/contact/ModalListContacts';
import ModalListContactRequest from '../modals/contact/ModalListContactRequest';
import ModalAddContact from '../modals/contact/ModalAddContact';
import CreateRoom from '../room/CreateRoom';
import ChangeLanguage from './../ChangeLanguage';
import { Link } from 'react-router-dom';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withRouter } from 'react-router';
import { getUserAvatarUrl } from './../../helpers/common';
const { Header } = Layout;

class Head extends React.Component {
  static contextType = SocketContext;

  state = {
    avatar: null,
  };

  componentDidMount() {
    if (checkExpiredToken()) {
      const { socket } = this.context;
      socket.on('update_received_request_count', request_friend_count => {});

      socket.on('update_user_avatar', res => {
        this.setState({
          avatar: res.avatar !== undefined ? res.avatar : null,
        });
      });
    }
  }

  onLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    const menu = (
      <Menu>
        <Menu.Item>
          <Link to="/setting/profile">Profile</Link>
          <Link to="/change-password">Change Passowrd</Link>
          <a href="javascript:;" onClick={this.onLogout}>
            Logout
          </a>
        </Menu.Item>
      </Menu>
    );
    const { avatar } = this.state;

    return checkExpiredToken() ? (
      <Header style={{ background: '#fff', padding: 0 }}>
        <Row type="flex" justify="end" align="middle">
          <Col span={5}>
            <InputSearch />
          </Col>
          <Col span={7} />
          <Col span={4}>
            <ModalListContacts />
            <ModalListContactRequest />
            <ModalAddContact />
            <CreateRoom />
          </Col>
          <Col span={4}>
            <Dropdown overlay={menu}>
              <a className="ant-dropdown-link">
                <Avatar src={getUserAvatarUrl(avatar == null ? this.props.userContext.info.avatar : avatar)} />
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

export default withRouter(withUserContext(Head));
