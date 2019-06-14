import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col, message } from 'antd';
import { loadMessages, sendMessage, loadPrevMessages, updateMessage } from './../../api/room.js';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withNamespaces } from 'react-i18next';
import { ROLES } from './../../config/member';
import moment from 'moment';
import { MESSAGE_PAGINATE, VISIABLE_MSG_TO_LOAD } from '../../config/room';

const { Content } = Layout;
let firstScroll = false;
let fourthMsgId = 0;
let isLoading = false;
let firstPrevMsgId = 0;

class ChatBox extends React.Component {
  static contextType = SocketContext;

  state = {
    isEditing: false,
    messages: [],
    listMsgId: [],
    currentLastMsgId: this.props.lastMsgId,
    prevMessages: [],
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
    if (e.key == undefined || e.key == 'Enter') {
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

  setFourthMsgId = elment => {
    this.fourthMsgId = elment;
  };

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
        listMsgId: listId.reverse(),
      });

      loadPrevMessages(roomId, firstPrevMsgId).then(res => {
        const messages = this.state.messages;

        if (res.data.messages.length > 0) firstPrevMsgId = res.data.messages[0]._id;

        if (res.data.messages.length == MESSAGE_PAGINATE) {
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

    // Listen 'update_msg' event from server
    this.socket.on('update_msg', res => {
      const message = this.getMessageById(this.state.messages, res.message._id);

      if (message !== null) {
        message.content = this.state.messageContentEditing;
      }
    });
  }

  componentDidUpdate(prevProps) {
    this.checkAndUpdateLastMess();

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

    if (e.key == undefined || e.key == 'Enter') {
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

  handleScroll = () => {
    this.checkAndUpdateLastMess();
  };

  checkAndUpdateLastMess() {
    var { listMsgId, currentLastMsgId } = this.state;
    var messageRowRefsReverse = this.messageRowRefs.reverse();
    var arrCheckEnable = [];

    for (let i in messageRowRefsReverse) {
      if (listMsgId.indexOf(i) >= 0) {
        let status = this.checkInView(messageRowRefsReverse[i]);
        arrCheckEnable.push(status);

        if (status) {
          break;
        }
      }
    }

    if (
      arrCheckEnable.length &&
      (listMsgId[arrCheckEnable.length - 1] > currentLastMsgId || currentLastMsgId === null)
    ) {
      const param = {
        roomId: this.props.roomId,
        messageId: listMsgId[arrCheckEnable.length - 1],
      };

      this.socket.emit('update_last_readed_message_result', param);
      this.socket.on('update_last_readed_message_result', res => {
        if (res.result) {
          this.setState({
            currentLastMsgId: listMsgId[arrCheckEnable.length - 1],
          });
        }
      });
    }
  }

  handleScrollUp = e => {
    const roomId = this.props.roomId;
    let { prevMessages } = this.state;

    if (fourthMsgId != 0) {
      let dom = this.prevMessageRowRefs[fourthMsgId].getBoundingClientRect();

      if (dom.top > 0 && isLoading == false) {
        // Call next API
        loadPrevMessages(roomId, firstPrevMsgId).then(res => {
          isLoading = false;

          if (Object.entries(res.data.messages[0]).length !== 0) {
            firstPrevMsgId = res.data.messages[0]._id;

            if (res.data.messages.length == MESSAGE_PAGINATE) {
              fourthMsgId = res.data.messages[VISIABLE_MSG_TO_LOAD]._id;
            } else {
              fourthMsgId = 0;
            }

            const messages = this.state.messages;
            const oldMessages = res.data.messages;
            prevMessages = oldMessages.concat(prevMessages);

            this.setState({
              prevMessages: prevMessages,
            });
          }
        });

        isLoading = true;
      }
    }
  };

  render() {
    const { t } = this.props;
    const currentUserId = this.props.userContext.info._id;

    return (
      <Content className="chat-room">
        <div className="list-message" onScroll={this.handleScrollUp}>
          {this.state.prevMessages.map(message => (
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
          {this.state.messages.length > 0 && (
            <div className="timeLine__unreadLine" ref={element => (this.unReadMsg = element)}>
              <div className="timeLine__unreadLineBorder">
                <div className="timeLine__unreadLineContainer">
                  <div className="timeLine__unreadLineBody">
                    <span className="timeLine__unreadLineText">{t('unread_title')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={element => (this.roomRef = element)} onScroll={this.handleScroll}>
            {this.state.messages.map(message => (
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
              </div>
            ))}
          </div>
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
