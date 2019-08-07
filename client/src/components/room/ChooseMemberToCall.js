import React from 'react';
import { withNamespaces } from 'react-i18next';
import { withUserContext } from './../../context/withUserContext';
import 'antd/dist/antd.css';
import { List, Avatar, Button, Input, Row, Col, Checkbox, message } from 'antd';
import { SocketContext } from './../../context/SocketContext';
import { getRoomAvatarUrl, getUserAvatarUrl } from './../../helpers/common';
import { room } from '../../config/room';
import { sendCallingRequest } from '../../api/room';
import { createLiveChat } from '../../api/call';
const _ = require('lodash');
const CheckboxGroup = Checkbox.Group;

class ChooseMemberToCall extends React.Component {
  static contextType = SocketContext;
  socket;

  constructor(props) {
    super(props);

    this.state = {
      checkedList: [],
      checkedAll: false,
      listMember: this.props.listMember,
      indeterminate: false,
      callType: room.CALL.TYPE.VIDEO_CHAT,
    };
  }

  componentDidMount() {
    this.socket = this.context.socket;
    this.socket.on('add_to_list_members', newMember => {
      newMember.map(member => {
        this.setState(prevState => ({
          listMember: [...prevState.listMember, member.user],
        }));
      });
    });

    this.socket.on('remove_to_list_members', memberId => {
      this.setState(prevState => ({
        listMember: prevState.listMember.filter(item => item._id != memberId),
        checkedList: prevState.checkedList.filter(item => item != memberId),
      }));
    });
  }

  onChange = checkedList => {
    this.setState({
      checkedList,
    });
  };

  oncheckedAll = e => {
    const { listMember } = this.state;
    let listIdMember = [];
    listMember.map(member => {
      listIdMember.push(member._id);
    });

    this.setState({
      checkedList: listIdMember,
    });
  };

  unCheckedAll = () => {
    this.setState({
      checkedList: [],
    });
  };

  handleSearch = e => {
    const searchText = e.target.value.trim();
    const listMember = this.props.listMember;
    const regex = new RegExp(`(.*)(${_.escapeRegExp(searchText)})(.*)`, 'i');
    let result = [];
    listMember.filter(item => {
      if (item.name.match(regex)) result.push(item);
    });
    this.setState({
      listMember: result,
    });
  };

  cancel = () => {
    this.props.handleVisible();
  };

  handleSendRequest = e => {
    createLiveChat({ roomId: this.props.roomDetail._id, callType: e.target.value }).then(res => {
      if (res.data.success) {
        const { checkedList } = this.state;
        const roomId = this.props.roomDetail._id;
        const roomName = this.props.roomDetail.name;

        if (res.data.id) {
          const liveChatId = res.data.id;

          window.open(
            `${window.location.href}/live/${liveChatId}`,
            '_blank',
            'toolbar=yes, width=' + window.innerWidth + ',height=' + window.innerHeight
          );

          sendCallingRequest({checkedList, roomName, liveChatId}, roomId)
            .then(res => {
            })
            .catch(error => {
              message.error(error.response.data.error);
            });
        }
      } else {
        message.error(res.data.message);
        this.props.handleVisible();
      }
    });
  };

  render() {
    const { t, roomDetail } = this.props;
    const { listMember, checkedList } = this.state;

    return (
      <React.Fragment>
        <Row>
          <Row>
            <h2 className="title-call">{t('title.video-audio-call')}</h2>
          </Row>
          <Row>
            <Avatar src={getRoomAvatarUrl(roomDetail.avatar)} />
            &nbsp;&nbsp;
            <span className="nav-text">{roomDetail.name}</span>
          </Row>
          <Row className="input-search-member-to-call">
            <Input.Search placeholder={t('video-audio-call.search-member')} onChange={this.handleSearch} />
          </Row>
          <Row>
            <Col span={24}>
              <a onClick={this.oncheckedAll}> {t('button.check-all')} </a>
              <a onClick={this.unCheckedAll}> / {t('button.uncheck-all')} </a>
            </Col>
            <Col span={24} className="group-call-member-list-box">
              <p className="group-call-member-list-box-title">{t('video-audio-call.choose-member')}</p>
              {listMember.length > 0 ? (
                <div className="infinite-container" style={{ height: '400px', overflow: 'auto' }}>
                  <CheckboxGroup onChange={this.onChange} value={checkedList}>
                    <List
                      style={{ padding: '5px' }}
                      dataSource={listMember}
                      renderItem={item => (
                        <List.Item key={item._id}>
                          <Checkbox value={item._id} className="item-checkbox" key={item._id} />
                          <List.Item.Meta
                            avatar={<Avatar src={getUserAvatarUrl(item.avatar)} />}
                            title={item.name}
                            description={item.email}
                          />
                        </List.Item>
                      )}
                    />
                  </CheckboxGroup>
                </div>
              ) : (
                <div id="no-contact">{t('no-data')}</div>
              )}
            </Col>
          </Row>
          <Row className="button-group-choose-type-call">
            <Button type="primary" onClick={this.handleSendRequest} value={room.CALL.TYPE.VIDEO_CHAT}>
              {t('button.video-call')}
            </Button>
            <Button onClick={this.handleSendRequest} value={room.CALL.TYPE.AUDIO_CHAT}>
              {t('button.audio-call')}
            </Button>
            <Button onClick={this.cancel}>{t('button.cancel')}</Button>
          </Row>
        </Row>
      </React.Fragment>
    );
  }
}

export default withNamespaces(['room'])(withUserContext(ChooseMemberToCall));
