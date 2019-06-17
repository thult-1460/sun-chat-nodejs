import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col, Badge, Popover, message, Divider } from 'antd';
import { loadMessages, sendMessage, loadPrevMessages, loadUnreadNextMessages, updateMessage } from './../../api/room.js';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withNamespaces } from 'react-i18next';
import moment from 'moment';
import { MESSAGE_PAGINATE, VISIABLE_MSG_TO_LOAD, LIMIT_QUANLITY_NEWEST_MSG, ROOM_TYPE } from '../../config/room';
import { messageConfig } from '../../config/messageConfig';
import InfiniteScroll from 'react-infinite-scroller';
import '../../scss/messages.scss';
import handlersMessage from '../../helpers/handlersMessage';

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

    //Listen 'update_msg' event from server
    this.socket.on('update_msg', res => {
      const message = this.getMessageById(this.state.messages, res._id);

      if (message !== null) {
        message.content = res.content;
        this.handleCancelEdit();
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
    });

    document.getElementById('msg-content').value = '';
  };

  editMessage = e => {
    const messageId = e.currentTarget.id;
    const message = this.getMessageById(this.state.messages, messageId);

    if (message !== null) {
      this.setState({
        messageIdEditing: message._id,
        isEditing: true,
      });

      document.getElementById('msg-content').value = message.content;
    }
  };

  handleSendMessage = e => {
    const { t, roomId } = this.props;
    const messageId = this.state.messageIdEditing;

    if (e.key === undefined || (e.ctrlKey && e.keyCode == 13)) {
      let messageContent = document.getElementById('msg-content').value;

      if (messageContent.trim() !== '') {
        let data = {
          content: messageContent,
        };

        if (messageId == null) {
          sendMessage(roomId, data)
          .catch(e => {
            message.error(t('send.failed'));
          });
        } else {
          updateMessage(roomId, messageId, data)
          .catch(e => {
            message.error(t('edit.failed'));
          });
        };

        document.getElementById('msg-content').value = '';
      }
    }

    if (e.keyCode == 27) {
      this.handleCancelEdit();
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

  handleInfiniteOnLoad = () => {};

  createMarkupMessage = (content) => {
    const members = this.props.allMembers;
    let messageContentHtml = handlersMessage.renderMessage(content, members);

    return {__html: messageContentHtml};
  };

  render() {
    const { prevMessages, messages, currentLastMsgId, listNewLoadedMessage, isEditing } = this.state;
    const { t, roomInfo, allMembers } = this.props;
    const currentUserInfo = this.props.userContext.info;

    const showListMember = (allMembers == []) ? (
      <span>Not data</span>
    ) : (
      <div className="member-infinite-container">
        {( roomInfo.type == ROOM_TYPE.GROUP_CHAT ) && (
          <a className="form-control to-all" href="javascript:;" onClick={handlersMessage.actionFunc.toAll}>
            <span>{t('to_all')}</span>
          </a>
        )}
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={this.handleInfiniteOnLoad}
          useWindow={false}
        >
          <List
            dataSource={allMembers}
            renderItem={member => {
              return ( member._id != currentUserInfo._id ) ? (
                <List.Item key={member._id}>
                  <List.Item.Meta
                    avatar={
                      <Avatar src={member.avatar} />
                    }
                    title={<a onClick={handlersMessage.actionFunc.toMember} href="javascript:;" data-mid={member._id}>{member.name}</a>}
                  />
                </List.Item>
              ) : (<span></span>)
            }}
          />
        </InfiniteScroll>
      </div>
    );

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
          {prevMessages.map(message => {
            let messageHtml = this.createMarkupMessage(message.content)
            let isToMe = messageHtml.__html.includes(`data-cwtag="[To:${currentUserInfo._id}]"`) ||
              messageHtml.__html.includes(messageConfig.SIGN_TO_ALL);

            return (
              <div key={message._id} ref={element => (this.prevMessageRowRefs[message._id] = element)}>
                <Row className={isToMe ? 'timelineMessage--mention' : ''}>
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
            )
          })}
          <div ref={element => (this.roomRef = element)}>
            {messages.map(message => {
              let messageHtml = this.createMarkupMessage(message.content)
              let isToMe = messageHtml.__html.includes(`data-cwtag="[To:${currentUserInfo._id}]"`) ||
                messageHtml.__html.includes(messageConfig.SIGN_TO_ALL);

              return (
                <div key={message._id} ref={element => (this.messageRowRefs[message._id] = element)} className='wrap-message'>
                  <Row
                    key={message._id}
                    className={this.state.messageIdEditing === message._id ? 'message-item isEditing' : 'message-item', isToMe ? 'timelineMessage--mention' : '' }
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    id={message._id}
                  >
                    <Col span={22}>
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar src={message.user_info.avatar} />}
                          title={<p>{message.user_info.name}</p>}
                          description={
                            <pre className="timelineMessage__message" dangerouslySetInnerHTML={messageHtml} />
                          }
                        />
                      </List.Item>
                    </Col>
                    <Col span={2} className="message-time">
                      <h4> {this.formatMsgTime(message.updatedAt)} </h4>
                    </Col>
                    <Col span={24} style={{ position: 'relative' }}>
                      {this.state.messageIdHovering === message._id &&
                        <div style={{ textAlign: 'right', position: 'absolute', bottom: '0', right: '0' }}>
                          {currentUserInfo._id === message.user_info._id &&
                            !this.props.isReadOnly && (
                              <Button type="link" onClick={this.editMessage} id={message._id}>
                                <Icon type="edit" /> {t('button.edit')}
                              </Button>
                            )
                          }
                          <Divider type="vertical" />
                          <Button type="link" onClick={handlersMessage.actionFunc.replyMember} id={currentUserInfo._id + '-' + message._id} data-mid={message.user_info._id}>
                            <Icon type="enter" /> {t('button.reply')}
                          </Button>
                          <Divider type="vertical" />
                          <Button type="link" onClick={this.quoteMessage} id={message._id}>
                            <Icon type="rollback" /> {t('button.quote')}
                          </Button>
                        </div>
                      }
                    </Col>
                  </Row>
                  {message._id === currentLastMsgId && currentLastMsgId !== listNewLoadedMessage[0] ? redLine : ''}
                </div>
              )
            })}
          </div>
        </div>
        <div className="box-button">
          <Popover content={showListMember}>
            <Badge className="header-icon" type="primary">
              <a href="javascript:;">
                <strong>{t('to')}</strong>
              </a>
            </Badge>
          </Popover>
          {isEditing ? (
            <React.Fragment>
              <Button style={{ float: 'right' }} type="primary" onClick={this.handleSendMessage}>
                {t('button.update')}
              </Button>
              <Button style={{ float: 'right' }} type="default" onClick={this.handleCancelEdit}>
                {t('button.cancel')}
              </Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
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
          onKeyDown={this.handleSendMessage}
        />
      </Content>
    );
  }
}

export default withRouter(withNamespaces(['message'])(withUserContext(ChatBox)));
