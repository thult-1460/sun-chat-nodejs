import React from 'react';
import { deleteRoom } from '../../api/room';
import { withNamespaces } from 'react-i18next';
import history from '../../history';
import { ROOM_TYPE, LIMIT_REPRESENTATIVE_MEMBER } from '../../config/room';
import { Layout, Menu, Icon, Button, Dropdown, message, Typography, Avatar, Row, Col } from 'antd';
import ModalListRequest from '../modals/room/ModalListRequest';
import ModalListMember from '../modals/room/ModalListMember';
import ModalListNotMember from "./ModalListNotMember";
import EditRoom from './EditRoom';
import { SocketContext } from './../../context/SocketContext';

const { Header } = Layout;

const { Text } = Typography;

class HeaderOfRoom extends React.Component {
  static contextType = SocketContext;

  componentDidMount() {
    const socket = this.context.socket;
    socket.on('edit_room', () => {});
    socket.on('change_member_count', () => {});
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

      data.members_info.map(member => {
        listMember.push(<Avatar size={30} key={member._id} src={member.avatar} className="list-member-chat-room" />);
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

  render() {
    const { t, data } = this.props;
    return (
      <Header className="header-chat-room">
        <Row type="flex" justify="start">
          <Col span={17}>
            <Avatar size={30} src={this.props.data.avatar} className="avatar-room-chat" />
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
          <Col span={1}>
            {this.props.isAdmin && (
            <ModalListNotMember />
            )}
          </Col>
          <Col span={1}>
            <Dropdown
              overlay={
                <Menu className="menu-detail-room">
                  <Menu.Item className="item-setting">
                    {this.props.isAdmin && <EditRoom roomInfo={data} />}
                    {this.props.isAdmin && <Button onClick={this.handleDeleteRoom}>{t('button.delete-room')}</Button>}
                    <Button onClick={this.outBox}>{t('button.left-room')}</Button>
                  </Menu.Item>
                </Menu>
              }
            >
              <Icon type="setting" className="icon-setting-room" theme="outlined" />
            </Dropdown>
          </Col>
        </Row>
      </Header>
    );
  }
}

export default withNamespaces(['room'])(HeaderOfRoom);
