import React from 'react';
import { Layout, Row, Col, Menu, Icon, Dropdown, Avatar, Badge, Popover } from 'antd';
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
import { withNamespaces } from 'react-i18next';
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
          avatar: res.avatar,
        });
      });
    }
  }

  onLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  render() {
    const { t } = this.props;

    const menu = (
      <div style={{ padding: '5px 15px 0'}}>
        <p><Link to="/setting/profile"><Icon type="user" /> {t('button.profile')}</Link></p>
        <p><Link to="/change-password"><Icon type="edit" /> {t('button.change_passowrd')}</Link></p>
        <p><a href="javascript:;" onClick={this.onLogout}><Icon type="logout" /> {t('button.logout')}</a></p>
      </div>
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
            <Popover content={menu}>
              <Badge className="header-icon" type="primary">
                <a href="javascript:;">
                  <Avatar src={getUserAvatarUrl(avatar == null ? this.props.userContext.info.avatar : avatar)} />
                  {this.props.userContext.info.name} <Icon type="caret-down" style={{ fontSize: '12px'}} />
                </a>
              </Badge>
            </Popover>
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

export default withRouter(withNamespaces(['user'])(withUserContext(Head)));
