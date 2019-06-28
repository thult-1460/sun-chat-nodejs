import React from 'react';
import { deleteRoom, leaveRoom } from '../../api/room';
import { withNamespaces } from 'react-i18next';
import history from '../../history';
import { ROOM_TYPE, LIMIT_REPRESENTATIVE_MEMBER } from '../../config/room';
import { Layout, Menu, Icon, Button, Dropdown, message, Typography, Avatar, Row, Col } from 'antd';
import ModalListRequest from '../modals/room/ModalListRequest';
import ModalListMember from '../modals/room/ModalListMember';
import ModalListNotMember from '../modals/room/ModalListNotMember';
import EditRoom from './EditRoom';
import { deleteContact } from '../../api/contact';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withRouter } from 'react-router';
import { getUserAvatarUrl, getRoomAvatarUrl } from './../../helpers/common';

const { Header } = Layout;

const { Text } = Typography;

class HeaderOfRoom extends React.Component {
  static contextType = SocketContext;
  state = {
    memberOfRoom: [],
  };
  componentWillReceiveProps(nextProps) {
    this.setState({ memberOfRoom: nextProps.data.members_info });
  }
  componentDidMount() {
    const socket = this.context.socket;
    socket.on('edit_room', () => {});
    socket.on('change_member_count', () => {});
    this.context.socket.on('update_member_of_room', memberOfRoom => {
      this.setState({ memberOfRoom });
    });
  }

  showRepresentativeMembers = () => {
    let listMember = [];
    const data = this.props.data;
    const limitShowMember = LIMIT_REPRESENTATIVE_MEMBER;

    if (data.type === ROOM_TYPE.GROUP_CHAT) {
      if (data.number_of_members > limitShowMember) {
        listMember.push(<ModalListMember key={0} numRemainMember={data.number_of_members - limitShowMember} />);
      } else {
        listMember.push(<ModalListMember key={0} numRemainMember="" />);
      }

      this.state.memberOfRoom.map(member => {
        listMember.push(
          <Avatar size={30} key={member._id} src={getUserAvatarUrl(member.avatar)} className="list-member-chat-room" />
        );
      });
    }

    return listMember;
  };

  handleDeleteRoom = () => {
    const roomId = this.props.data._id;
    deleteRoom({ roomId })
      .then(res => {
        message.success(res.data.success);
        history.goBack();
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleLeaveTheRoom = e => {
    const myChatId = this.props.userContext.my_chat_id;
    const roomId = this.props.data._id;
    let historyProp = this.props.history;

    leaveRoom(roomId)
      .then(res => {
        historyProp.push('/rooms/' + myChatId);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleDeteleContact = e => {
    const contactId = e.target.value;
    const myChatId = this.props.userContext.my_chat_id;

    deleteContact({ contactId })
      .then(res => {
        this.props.history.push('/rooms/' + myChatId);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  render() {
    const { t, data } = this.props;
    let buttonLeaveRoom = '';
    let directChatId = 0;

    if (typeof data == 'object') {
      for (let i = 0; i < data.members_info.length; i++) {
        if (data.members_info[i]._id !== this.props.userContext.info._id) {
          directChatId = data.members_info[i]._id;
          break;
        }
      }
    }

    if (data.type === ROOM_TYPE.DIRECT_CHAT) {
      buttonLeaveRoom = (
        <Button value={directChatId} onClick={this.handleDeteleContact}>
          {t('button.remove_contact')}
        </Button>
      );
    } else {
      buttonLeaveRoom = <Button onClick={this.handleLeaveTheRoom}>{t('button.left-room')}</Button>;
    }

    return (
      <Header className="header-chat-room">
        <Row type="flex" justify="start">
          <Col span={17}>
            <Avatar
              size={30}
              src={
                data.type === ROOM_TYPE.GROUP_CHAT
                  ? getRoomAvatarUrl(this.props.data.avatar)
                  : getUserAvatarUrl(this.props.data.avatar)
              }
              className="avatar-room-chat"
            />
            <Text strong className="name-chat-room">
              {this.props.data.name}
            </Text>
          </Col>
          <Col span={1}>
            {this.props.isAdmin && (
              <div className="icon-request-list">
                <ModalListRequest roomId={data._id} />
              </div>
            )}
          </Col>
          <Col span={4}> {this.showRepresentativeMembers()}</Col>
          <Col span={1}>{this.props.isAdmin && <ModalListNotMember />}</Col>
          {data.type !== ROOM_TYPE.MY_CHAT && (
            <Col span={1}>
              <Dropdown
                overlay={
                  <Menu className="menu-detail-room">
                    <Menu.Item className="item-setting">
                      {this.props.isAdmin && <EditRoom roomInfo={data} />}
                      {this.props.isAdmin && <Button onClick={this.handleDeleteRoom}>{t('button.delete-room')}</Button>}
                      {buttonLeaveRoom}
                    </Menu.Item>
                  </Menu>
                }
              >
                <Icon type="setting" className="icon-setting-room" theme="outlined" />
              </Dropdown>
            </Col>
          )}
        </Row>
      </Header>
    );
  }
}

export default withRouter(withNamespaces(['room'])(withUserContext(HeaderOfRoom)));
