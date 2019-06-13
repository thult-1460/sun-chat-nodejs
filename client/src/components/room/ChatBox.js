import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, Button, List, Avatar, Row, Col, message } from 'antd';
import { loadMessages, sendMessage, loadPrevMessages, loadUnreadNextMessages, updateMessage } from './../../api/room.js';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withNamespaces } from 'react-i18next';
import moment from 'moment';
import { MESSAGE_PAGINATE, VISIABLE_MSG_TO_LOAD, LIMIT_QUANLITY_NEWEST_MSG } from '../../config/room';

const { Content } = Layout;
let firstScroll = false;
let fourthMsgId = 0;
let isLoadingPrev = false;
let loadingNew = false;
let firstPrevMsgId = 0;

class ChatBox extends React.Component {
  static contextType = SocketContext;

  state = {
    isEditing: false,
    messages: [],
    listNewLoadedMessage: [],
    currentLastMsgId: this.props.lastMsgId,
    prevMessages: [],
    hasMsgUnRead: true,
    scrollTop: 0,
    messageIdHovering: null,
    messageIdEditing: null,
    messageContentEditing: null,
  };

  handleMouseEnter = e => {
    const messageIdHovering = e.currentTarget.id;
    this.setState({
      messageIdHovering,
    });
  };

  handleMouseLeave = e => {
    this.setState({
      messageIdHovering: null,
    });
  };

  dataMessageEditing = e => {
    const messageId = e.currentTarget.id;
    const message = this.getMessageById(this.state.messages, messageId);

    if (message !== null) {
      this.setState({
        messageIdEditing: message._id,
        messageContentEditing: message.content,
        isEditing: true,
      });
    }
  };

  getMessageById(messages, messageId) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]._id === messageId) {
        return messages[i];
      }
    }

    return null;
  }

  handleCancelEdit = () => {
    this.setState({
      isEditing: false,
      messageIdEditing: null,
      messageContentEditing: null,
    });
  };

  handleChangeMessage = e => {
    this.setState({ messageContentEditing: e.target.value });
  };

  handleUpdateMessage = e => {
    if (e.key === undefined || e.key === 'Enter') {
      const content = this.state.messageContentEditing;
      const roomId = this.props.roomId;
      const messageId = this.state.messageIdEditing;
      let data = {
        content,
      };

      if (content !== '') {
        updateMessage(roomId, messageId, data).then(res => {
          this.handleCancelEdit();
        });
      }
    }
  };

  prevMessageRowRefs = [];
  messageRowRefs = [];
  roomRef = '';
  unReadMsg = '';
  socket = this.context.socket;

  fetchData(roomId) {
    loadMessages(roomId).then(res => {
      let listId = [],
        messages = res.data.messages;

      messages.map(function(item) {
        listId.push(item._id);
      });

      this.setState({
        messages: messages,
        listNewLoadedMessage: listId.reverse(),
      });

      this.checkUpdateLastMsgAndLoadNew();

      loadPrevMessages(roomId, firstPrevMsgId).then(res => {
        if (res.data.messages.length > 0){
          firstPrevMsgId = res.data.messages[0]._id;
        }

        if (res.data.messages.length === MESSAGE_PAGINATE) {
          fourthMsgId = res.data.messages[VISIABLE_MSG_TO_LOAD]._id;
        } else {
          fourthMsgId = 0;
        }

        this.setState({
          prevMessages: res.data.messages,
        });
      });
    });
  }

  componentDidMount() {
    const roomId = this.props.roomId;

    this.fetchData(roomId);

    // Listen 'send_new_msg' event from server
    this.socket.on('send_new_msg', res => {
      const messages = this.state.messages;
      messages.push(res.message);

      this.setState({
        messages: messages,
      });
    });

    this.socket.on('update_last_readed_message', res => {
      if (res.messageId) {
        this.setState({
          currentLastMsgId: res.messageId,
        });
      }
    });

    // Listen 'update_msg' event from server
    this.socket.on('update_msg', res => {
      const message = this.getMessageById(this.state.messages, res.message._id);

      if (message !== null) {
        message.content = this.state.messageContentEditing;
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      this.fetchData(this.props.roomId);
    }

    if (!firstScroll && this.unReadMsg && (this.state.messages || this.state.prevMessages)) {
      this.unReadMsg.scrollIntoView({ block: 'start' });
      window.scroll(0, 0);
      firstScroll = true;
    }
  }

  formatMsgTime(timeInput) {
    const { t } = this.props;
    const time = new Date(timeInput);

    return moment(time).format(t('format_time'));
  }

  handleSendMessage = e => {
    const { t } = this.props;

    if (e.key === undefined || e.key === 'Enter') {
      const roomId = this.props.roomId;
      const msgElement = document.getElementById('msg-content');
      let data = {
        content: msgElement.value,
      };

      if (msgElement.value !== '') {
        sendMessage(roomId, data)
          .then(res => {
            msgElement.value = '';
          })
          .catch(e => {
            msgElement.value = '';
            message.error(t('send.failed'));
          });
      }
      this.setState({
        messageContentEditing: null,
      });
    }
  };

  checkInView(message) {
    var roomChat = this.roomRef.getBoundingClientRect();
    message = message.getBoundingClientRect();
    var elemTop = message.top - roomChat.top;
    var elemBottom = elemTop + message.height;

    return (elemTop < 0 && elemBottom > 0) || (elemTop > 0 && elemTop <= roomChat.height);
  }

  updateLastMsgId(listNewLoadedMessage, currentLastMsgId, arrCheckEnable) {
    /* when message_id need update > current last_message_id */
    if (listNewLoadedMessage[arrCheckEnable.length - 1] > currentLastMsgId || currentLastMsgId === null) {
      const param = {
        roomId: this.props.match.params.id,
        messageId: listNewLoadedMessage[arrCheckEnable.length - 1],
      };

      this.socket.emit('update_last_readed_message', param);
    }
  }

  checkUpdateLastMsgAndLoadNew() {
    var { listNewLoadedMessage, currentLastMsgId, messages, prevMessages, hasMsgUnRead } = this.state;
    var roomId = this.props.match.params.id,
      messageRowRefs = this.messageRowRefs,
      messageKeysRowRefs = Object.keys(messageRowRefs),
      arrCheckEnable = [], listNewId = [];

    /* check from newest message, stop when meet first message be displayed */
    for (let i = messageKeysRowRefs.length - 1; i >= 0; i--) {
      if (listNewLoadedMessage.indexOf(messageKeysRowRefs[i]) >= 0) {
        let status = this.checkInView(messageRowRefs[messageKeysRowRefs[i]]);
        arrCheckEnable.push(status);

        if (status) {
          break;
        }
      }
    }

    if (messages.length >= MESSAGE_PAGINATE && !loadingNew) {
      if (hasMsgUnRead && arrCheckEnable.length <= VISIABLE_MSG_TO_LOAD) {
        loadingNew = true;
        loadUnreadNextMessages(roomId, listNewLoadedMessage[0]).then(res => {
          loadingNew = false;
          let listNewMsg = res.data.messages;

          /* concat current messages and new message */
          messages = messages.concat(listNewMsg);

          if (listNewMsg.length < MESSAGE_PAGINATE) {
            this.setState({
              hasMsgUnRead: false,
            });
          }

          listNewMsg.map(function (item) {
            listNewId.push(item._id);
          });

          /* just need LIMIT_QUANLITY_NEWEST_MSG message */
          if (messages.length > LIMIT_QUANLITY_NEWEST_MSG) {
            messages = messages.slice(messages.length - LIMIT_QUANLITY_NEWEST_MSG, messages.length);
            prevMessages = [];
            firstPrevMsgId = messages[0]._id;
            fourthMsgId = messages[VISIABLE_MSG_TO_LOAD]._id;
          } else if (messages.length + prevMessages.length > LIMIT_QUANLITY_NEWEST_MSG) {
            prevMessages = prevMessages.slice(prevMessages.length - LIMIT_QUANLITY_NEWEST_MSG + messages.length, prevMessages.length);
            firstPrevMsgId = prevMessages[0]._id;
            fourthMsgId = prevMessages.length < VISIABLE_MSG_TO_LOAD ? (messages[VISIABLE_MSG_TO_LOAD - prevMessages.length]._id) : prevMessages[VISIABLE_MSG_TO_LOAD]._id;
          }

          this.setState({
            listNewLoadedMessage: listNewMsg ? listNewId.reverse() : listNewLoadedMessage,
            messages: messages,
          });
        });
      }
    }

    /* check the first view room || loading new message || final message */
    if (currentLastMsgId === this.props.lastMsgId || loadingNew || (arrCheckEnable.length === 1 && !hasMsgUnRead)) {
      this.updateLastMsgId(listNewLoadedMessage, currentLastMsgId, arrCheckEnable);
    }
  }

  scrollDown() {
    this.checkUpdateLastMsgAndLoadNew();
  }

  scrollUp() {
    const roomId = this.props.roomId;
    let { prevMessages } = this.state;

    if (fourthMsgId !== 0) {
      let dom = this.prevMessageRowRefs[fourthMsgId].getBoundingClientRect();

      if (dom.top > 0 && isLoadingPrev === false) {
        // Call next API
        loadPrevMessages(roomId, firstPrevMsgId).then(res => {
          isLoadingPrev = false;

          if (Object.entries(res.data.messages[0]).length !== 0) {
            firstPrevMsgId = res.data.messages[0]._id;

            if (res.data.messages.length === MESSAGE_PAGINATE) {
              fourthMsgId = res.data.messages[VISIABLE_MSG_TO_LOAD]._id;
            } else {
              fourthMsgId = 0;
            }

            const oldMessages = res.data.messages;
            prevMessages = oldMessages.concat(prevMessages);

            this.setState({
              prevMessages: prevMessages,
            });
          }
        });

        isLoadingPrev = true;
      }
    }
  }

  handleScroll = e => {
    let scrollTop = e.currentTarget.scrollTop;

    if (this.state.scrollTop > scrollTop) {
      this.scrollUp();
    } else {
      this.scrollDown();
    }

    this.setState({
      scrollTop: scrollTop,
    });
  };

  render() {
    const { t } = this.props;
    const { prevMessages, messages, currentLastMsgId, listNewLoadedMessage } = this.state;
    const currentUserId = this.props.userContext.info._id;


    const redLine = (
      <div className={'timeLine__unreadLine ' + (loadingNew || currentLastMsgId === this.props.lastMsgId ? 'hide' : '')} ref={element => (this.unReadMsg = element)}>
        <div className="timeLine__unreadLineBorder">
          <div className="timeLine__unreadLineContainer">
            <div className="timeLine__unreadLineBody">
              <span className="timeLine__unreadLineText">{t('unread_title')}</span>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <Content className="chat-room">
        <div className="list-message" ref={element => (this.roomRef = element)} onScroll={this.handleScroll}>
          {prevMessages.map(message => (
            <div key={message._id} ref={element => (this.prevMessageRowRefs[message._id] = element)}>
              <Row>
                <Col span={22}>
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={message.user_info.avatar} />}
                      title={<p>{message.user_info.name}</p>}
                      description={message.content}
                    />
                  </List.Item>
                </Col>
                <Col span={2} className="message-time">
                  <h4> {this.formatMsgTime(message.updatedAt)} </h4>
                </Col>
                <hr />
              </Row>
            </div>
          ))}
          {messages.map(message => (
            <div key={message._id} ref={element => (this.messageRowRefs[message._id] = element)}>
              <Row
                key={message._id}
                className={this.state.messageIdEditing === message._id ? 'message-item isEditing' : 'message-item'}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                id={message._id}
              >
                <Col span={22}>
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={message.user_info.avatar} />}
                      title={<p>{message.user_info.name}</p>}
                      description={message.content}
                    />
                  </List.Item>
                </Col>
                <Col span={2} className="message-time">
                  <h4> {this.formatMsgTime(message.updatedAt)} </h4>
                  {this.state.messageIdHovering === message._id &&
                  currentUserId === message.user_info._id &&
                  !this.props.isReadOnly && (
                    <Button type="primary" onClick={this.dataMessageEditing} id={message._id}>
                      {t('button.edit')}
                    </Button>
                  )}
                </Col>
              </Row>
              {message._id === currentLastMsgId && currentLastMsgId !== listNewLoadedMessage[0] ? redLine : ''}
            </div>
          ))}
        </div>
        <div className="box-button">
          {this.state.isEditing ? (
            <React.Fragment>
              <span>
                <b>{t('title_edit')}</b>
              </span>
              <Button style={{ float: 'right' }} type="primary" onClick={this.handleUpdateMessage}>
                {t('button.update')}
              </Button>
              <Button style={{ float: 'right' }} type="default" onClick={this.handleCancelEdit}>
                {t('button.cancel')}
              </Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button type="link" size={'small'}>
                {t('to')}
              </Button>
              <Button
                style={{ float: 'right' }}
                type="primary"
                onClick={this.handleSendMessage}
                disabled={this.props.isReadOnly}
              >
                {t('button.send')}
              </Button>
            </React.Fragment>
          )}
        </div>
        <Input.TextArea
          placeholder={t('type_msg')}
          rows={4}
          style={{ resize: 'none' }}
          id="msg-content"
          disabled={this.props.isReadOnly}
          onKeyDown={this.state.isEditing ? this.handleUpdateMessage : this.handleSendMessage}
          value={this.state.messageContentEditing}
          onChange={this.handleChangeMessage}
        />
      </Content>
    );
  }
}

export default withRouter(withNamespaces(['message'])(withUserContext(ChatBox)));
