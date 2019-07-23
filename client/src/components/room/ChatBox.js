import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col, Badge, Popover, message, Spin } from 'antd';
import {
  loadMessages,
  sendMessage,
  loadPrevMessages,
  loadUnreadNextMessages,
  updateMessage,
  getDirectRoomId,
} from './../../api/room.js';
import {
  addContact,
  getListSentRequestContacts,
  deleteSentRequestContact,
  acceptContact,
  rejectContact,
} from './../../api/contact';
import { getUserById } from './../../api/user';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withNamespaces } from 'react-i18next';
import moment from 'moment';
import { room } from '../../config/room';
import configEmoji from '../../config/emoji';
import { messageConfig, block } from '../../config/message';
import InfiniteScroll from 'react-infinite-scroller';
import '../../scss/messages.scss';
import handlersMessage from '../../helpers/handlersMessage';
import { getUserAvatarUrl, saveSizeComponentsChat, getEmoji } from './../../helpers/common';
import ModalChooseMemberToCall from './ModalChooseMemberToCall';
import $ from 'jquery';

const { Content } = Layout;
const initialState = {
  // for edit msg
  isEditing: false,
  messageIdHovering: null,
  messageIdEditing: null,

  // for load msg
  messages: [],
  redLineMsgId: null,
  loadingPrev: false,
  loadingNext: false,

  // for popover
  directRoomIds: [],
  receivedRequestUsers: [],
  sendingRequestUsers: [],
  infoUserTip: {}
};
const initialAttribute = {
  messageRowRefs: [],
  msgContainerRef: null,
  unreadMsgLineRef: null,

  hasPrevMsg: true,
  hasNextMsg: null,
  initData: false,
  firstLoading: true,
  isSender: false,

  savedLastMsgId: null,
  scrollTop: 0,
  infoUserTips: {}
};

class ChatBox extends React.Component {
  static contextType = SocketContext;

  state = initialState;
  attr = JSON.parse(JSON.stringify(initialAttribute));
  socket = this.context.socket;

  componentDidMount() {
    this.socket.on('send_new_msg', res => {
      if (this.props.loadedRoomInfo && !this.attr.hasNextMsg) {
        var { redLineMsgId, messages } = this.state;
        var lastLoadedMsgId = messages.length ? messages.slice(-1)[0]._id : null;

        if (
          !lastLoadedMsgId ||
          (redLineMsgId == lastLoadedMsgId && this.checkInView(this.attr.messageRowRefs[lastLoadedMsgId])) ||
          (this.attr.isSender && !this.attr.unreadMsgLineRef)
        ) {
          this.setState({ redLineMsgId: res.message._id });
          this.attr.isSender = false;
        }

        this.setState(
          {
            messages: [...messages, res.message],
          },
          () => {
            if (!lastLoadedMsgId || this.checkInView(this.attr.messageRowRefs[lastLoadedMsgId])) {
              this.updateLastMsgId(res.message._id);
              this.attr.messageRowRefs[res.message._id].scrollIntoView();
              window.scrollTo(0, 0);
            }
          }
        );
      }
    });

    this.socket.on('update_last_message_id_success', res => {
      if (res.messageId && (res.messageId > this.attr.savedLastMsgId || !this.attr.savedLastMsgId)) {
        this.attr.savedLastMsgId = res.messageId;
      }
    });

    this.socket.on('update_msg', res => {
      const { messages } = this.state;
      const message = this.getMessageById(messages, res._id);

      if (message !== null) {
        message.content = res.content;
        this.handleCancelEdit();
      }
    });

    this.socket.on('update_received_request_users', (requestId, status = true) => {
      this.updateReceivedRequestUsers(requestId, status);
    });

    this.socket.on('update_sending_request_users', (sentRequestId, status = true) => {
      this.updateSendingRequestUsers(sentRequestId, status);
    });

    this.socket.on('update_direct_room_id', userId => {
      this.getDirectRoom(userId);
    });

    if (!localStorage.getItem('descW')) {
      saveSizeComponentsChat();
    }

    let _this = this;
    const { t } = this.props;

    $(document).on('click', '._avatarClickTip', async function(e) {
      let { infoUserTips } = _this.attr;
      let currentUserInfo = _this.props.userContext.info;
      let flag = true;
      let profileTipId = $(e.currentTarget).attr('data-mid');
      let userInfo = {};

      if (profileTipId == currentUserInfo._id) {
        const { _id, avatar, email, name } = currentUserInfo;
        userInfo = { _id, avatar, email, name };
      } else if (infoUserTips[profileTipId]) {
        userInfo = infoUserTips[profileTipId];
      } else {
        try {
          let response = await getUserById(profileTipId);
          userInfo = response.data.userInfo;
          infoUserTips[profileTipId] = userInfo;
        } catch {
          flag = false;
          userInfo = {
            name: t('cancelled_user')
          }
        }
      }

      _this.setState({ infoUserTip: userInfo })
      if (flag) {
        await _this.handleVisibleChange(profileTipId)(true)
      }
    });

    $(document).on('click', 'body', function(event) {
      let xPosition = 0, yPosition = 0;
      xPosition = event.clientX - ($('.profileTooltip').width() / 2);

      if ((event.clientY - $('.profileTooltip').height()) < 0) {
        yPosition = event.clientY + 20;
        $('.tooltipTriangle').css({
          'bottom': '225px',
          'border-width': '0 7px 7px 7px',
          'border-color': 'transparent transparent #a5a0a0 transparent'
        })
      } else {
        yPosition = event.clientY - ($('.profileTooltip').height() + 25);
        $('.tooltipTriangle').css({
          'bottom': '-7px',
          'border-width': '7px 7px 0 7px',
          'border-color': '#a5a0a0 transparent transparent transparent'
        })
      }

      if (event.target.id == 'target') {
        $('.profileTooltip').css({
          top: yPosition + "px",
          left: xPosition + "px"
        }).show();
      } else {
        _this.setState({ infoUserTip:  {} });
        $('.profileTooltip').hide();
      }
    });
  }

  componentDidUpdate(prevProps) {
    this.inputMsg.focus();

    if (prevProps.loadedRoomInfo && !this.props.loadedRoomInfo) {
      document.getElementById('msg-content').value = '';

      this.attr = JSON.parse(JSON.stringify(initialAttribute));
      this.setState(initialState);
    }

    if (this.state.messages.length == 0) {
      this.attr.messageRowRefs = new Array();
    }

    if (!prevProps.loadedRoomInfo && this.props.loadedRoomInfo) {
      if (!this.state.redLineMsgId && this.props.lastMsgId) {
        this.setState({ redLineMsgId: this.props.lastMsgId });
      }

      if (this.attr.hasNextMsg == undefined && this.props.roomInfo.has_unread_msg != undefined) {
        this.attr.hasNextMsg = this.props.roomInfo.has_unread_msg;
      }

      this.fetchData(this.props.roomId);
    }

    if (Object.keys(this.attr.messageRowRefs).length && this.attr.firstLoading) {
      if (this.attr.unreadMsgLineRef) {
        this.attr.unreadMsgLineRef.scrollIntoView({ block: 'start' });
        window.scroll(0, 0);
        this.attr.firstLoading = false;
      } else if (Object.keys(this.attr.messageRowRefs).length) {
        this.attr.messageRowRefs[Object.keys(this.attr.messageRowRefs).slice(-1)[0]].scrollIntoView({ block: 'start' });
        window.scroll(0, 0);
        this.attr.firstLoading = false;
      }
    }
  }

  handleScroll = e => {
    let scrollTop = e.currentTarget.scrollTop;

    if (this.attr.scrollTop > 0) {
      if (this.attr.scrollTop > scrollTop) {
        this.scrollUp();
      } else {
        this.scrollDown();
      }
    }

    this.attr.scrollTop = scrollTop;
  };

  scrollDown() {
    let { messages } = this.state;

    if (messages.length) {
      this.checkUpdateLastMsgId();
    }

    const checkMsg = messages.slice(-room.VISIABLE_MSG_TO_LOAD)[0];
    let dom = this.attr.messageRowRefs[checkMsg ? checkMsg._id : null];

    if (this.checkInView(dom)) {
      this.loadNextMsg(this.props.roomId, messages.slice(-1)[0]._id);
    }
  }

  scrollUp() {
    const { messages } = this.state;
    const checkMsg = messages[room.VISIABLE_MSG_TO_LOAD - 1];
    let dom = this.attr.messageRowRefs[checkMsg ? checkMsg._id : null];

    if (this.checkInView(dom)) {
      this.loadPrevMsg(this.props.roomId, messages[0]._id);
    }
  }

  fetchData(roomId) {
    const { t } = this.props;

    if (!this.state.loadingNext && !this.state.loadingPrev) {
      this.setState({ loadingNext: true });

      loadMessages(roomId)
        .then(res => {
          this.setState({ loadingNext: false });
          let nextMessages = res.data.messages;

          if (nextMessages.length < room.MESSAGE_PAGINATE) {
            this.attr.hasNextMsg = false;
          }

          if (nextMessages.length > 0) {
            this.setState({
              messages: nextMessages,
            });
            this.checkUpdateLastMsgId();
          }

          this.loadPrevMsg(roomId, this.state.messages.length ? this.state.messages[0]._id : null);
        })
        .catch(error => {
          this.setState({ loadingNext: false });
          message.error(t('get_next_msg.failed'));
        });
    }
  }

  loadPrevMsg(roomId, currentMsgId, concatMsg = true) {
    const { t } = this.props;

    if (this.attr.hasPrevMsg && !this.state.loadingPrev && !this.state.loadingNext) {
      this.setState({ loadingPrev: true });

      loadPrevMessages(roomId, currentMsgId)
        .then(res => {
          this.setState({ loadingPrev: false });
          let prevMessages = res.data.messages;

          if (prevMessages.length < room.MESSAGE_PAGINATE) {
            this.attr.hasPrevMsg = false;
          }

          if (!this.attr.initData) {
            this.attr.firstLoading = true;
            this.attr.initData = true;
          }

          if (prevMessages.length > 0) {
            this.setState({
              messages: prevMessages.concat(this.state.messages),
            });
          }
        })
        .catch(error => {
          this.setState({ loadingPrev: false });
          message.error(t('get_prev_msg.failed'));
        });
    }
  }

  loadNextMsg(roomId, currentMsgId) {
    const { t } = this.props;

    if (this.attr.hasNextMsg && !this.state.loadingPrev && !this.state.loadingNext) {
      this.setState({ loadingNext: true });

      loadUnreadNextMessages(roomId, currentMsgId)
        .then(res => {
          this.setState({ loadingNext: false });
          let nextMessages = res.data.messages;

          if (nextMessages.length < room.MESSAGE_PAGINATE) {
            this.attr.hasNextMsg = false;
          }

          if (nextMessages.length > 0) {
            let messages = this.state.messages.concat(nextMessages);

            if (messages.length > room.LIMIT_QUANLITY_NEWEST_MSG) {
              messages = messages.slice(-room.LIMIT_QUANLITY_NEWEST_MSG);
            }

            this.setState({
              messages: messages,
            });
          }
        })
        .catch(error => {
          this.setState({ loadingNext: false });
          message.error(t('get_next_msg.failed'));
        });
    }
  }

  checkInView(message) {
    if (!message) {
      return false;
    }

    var msgContainer = this.attr.msgContainerRef.getBoundingClientRect();
    message = message.getBoundingClientRect();
    var elemTop = message.top - msgContainer.top;
    var elemBottom = elemTop + message.height;

    return elemBottom > 0 && elemBottom <= msgContainer.height;
  }

  checkUpdateLastMsgId() {
    let messageRowRefs = this.attr.messageRowRefs;
    let messageIdRowRefs = Object.keys(messageRowRefs);
    let bottomMsgId = null;

    for (let i = messageIdRowRefs.length - 1; i >= 0; i--) {
      if (this.checkInView(messageRowRefs[messageIdRowRefs[i]])) {
        bottomMsgId = messageIdRowRefs[i];
        break;
      }
    }

    if ((!this.attr.savedLastMsgId && bottomMsgId) || bottomMsgId > this.attr.savedLastMsgId) {
      this.updateLastMsgId(bottomMsgId);
    }
  }

  updateLastMsgId(lastMsgId) {
    const param = {
      roomId: this.props.roomId,
      messageId: lastMsgId,
    };

    this.socket.emit('update_last_message_id', param);
  }

  handleEmoji = (e) => {
    handlersMessage.actionFunc.addEmoji(e.target.alt);
  }
  // for display msg content - BEGIN
  formatMsgTime(timeInput) {
    const { t } = this.props;
    const time = new Date(timeInput);

    return moment(time).format(t('format_time'));
  }

  generateMsgContent = infoUserTip => {
    const { t } = this.props;
    const userId = infoUserTip._id ? infoUserTip._id : null;
    const myChatId = this.props.userContext.my_chat_id;
    const currentUserId = this.props.userContext.info._id;
    const directRoomId = this.state.directRoomIds[userId];
    const receivedRequestUser = this.state.receivedRequestUsers[userId];
    const sendingRequestUser = this.state.sendingRequestUsers[userId];
    let button = <Spin />;

    if (userId == currentUserId) {
      button = (
        <Link to={`/rooms/${myChatId}`}>
          <Button>{this.props.t('title.my_chat')}</Button>
        </Link>
      );
    } else if (directRoomId === undefined) {
      button = '';
    } else {
      button = directRoomId ? (
        <Link to={`/rooms/${directRoomId}`}>
          <Button>{this.props.t('title.direct_chat')}</Button>
        </Link>
      ) : sendingRequestUser ? (
        <div>
          <Button value={userId} onClick={this.handleRejectContact}>
            {this.props.t('title.reject_request')}
          </Button>
          <Button value={userId} onClick={this.handleAcceptContact}>
            {this.props.t('title.accept_request')}
          </Button>
        </div>
      ) : receivedRequestUser ? (
        <Button value={userId} onClick={this.handleCancelRequest}>
          {this.props.t('title.cancel_request')}
        </Button>
      ) : (
        <Button value={userId} onClick={this.handleSendRequestContact}>
          {this.props.t('title.add_contact')}
        </Button>
      );
    }

    return (
      <div className="popover-infor">
        <div className="infor-bg">
          <Avatar src={getUserAvatarUrl(infoUserTip.avatar)} className="infor-avatar" />
        </div>
        <div style={{ minHeight: '55px'}}>
          <p className="infor-name">{ (infoUserTip.name) ? infoUserTip.name : t('loading')}</p>
          <p>{ (infoUserTip.email) ? infoUserTip.email : '' }</p>
        </div>
        <div className="infor-footer">
          <div>{<List.Item style={{ minHeight: '35px' }}>{button}</List.Item>}</div>
        </div>
      </div>
    );
  };

  generateRedLine = () => {
    const { t } = this.props;

    return (
      <div className={'timeLine__unreadLine'} ref={element => (this.attr.unreadMsgLineRef = element)}>
        <div className="timeLine__unreadLineBorder">
          <div className="timeLine__unreadLineContainer">
            <div className="timeLine__unreadLineBody">
              <span className="timeLine__unreadLineText">{t('unread_title')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  createMarkupMessage = message => {
    const { roomId } = this.props;
    const members = this.props.allMembers;
    let messageContentHtml = handlersMessage.renderMessage(message, members, roomId);

    return { __html: messageContentHtml };
  };
  // for display msg content - END

  // for SEND msg - BEGIN
  handleSendMessage = e => {
    const { t, roomId } = this.props;
    const messageId = this.state.messageIdEditing;

    if (e.key === undefined || (e.ctrlKey && e.keyCode == 13)) {
      let messageContent = document.getElementById('msg-content').value;

      if (messageContent.trim() !== '') {
        let data = {
          content: handlersMessage.handleContentMessageWithI18n(messageContent),
        };

        if (messageId == null) {
          sendMessage(roomId, data).catch(e => {
            message.error(t('send.failed'));
          });
        } else {
          updateMessage(roomId, messageId, data).catch(e => {
            message.error(t('edit.failed'));
          });
        }

        this.attr.isSender = true;

        if (this.state.messages.length) {
          let lastMsgId = this.state.messages.slice(-1)[0]._id;

          if (this.checkInView(this.attr.messageRowRefs[lastMsgId]) && !this.attr.hasNextMsg) {
            this.setState({ redLineMsgId: lastMsgId });
          }
        }

        document.getElementById('msg-content').value = '';
      }
    }

    if (e.keyCode == 27) {
      this.handleCancelEdit();
    }
  };
  // for SEND msg - END

  // for edit msg - BEGIN
  handleMouseEnter = e => {
    const messageIdHovering = e.currentTarget.id;

    if (document.getElementById('action-button-' + messageIdHovering)) {
      document.getElementById('action-button-' + messageIdHovering).style.display = 'block';
    }
  };

  handleMouseLeave = e => {
    const messageIdHovering = e.currentTarget.id;

    if (document.getElementById('action-button-' + messageIdHovering)) {
      document.getElementById('action-button-' + messageIdHovering).style.display = 'none';
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
    });

    document.getElementById('msg-content').value = '';
  };

  editMessage = e => {
    const messageId = e.currentTarget.id;
    const oldMsgFlag = e.currentTarget.getAttribute('old-msg-flag');

    const message =
      oldMsgFlag == 1
        ? this.getMessageById(this.state.messages, messageId)
        : this.getMessageById(this.state.messages, messageId);

    if (message !== null) {
      this.setState({
        messageIdEditing: message._id,
        isEditing: true,
      });

      document.getElementById('msg-content').value = message.content;
    }
  };
  // for edit msg - END

  // for quote msg - BEGIN
  quoteMessage = e => {
    const messageId = e.currentTarget.id;
    const memberId = e.target.getAttribute('data-mid');
    const message = this.getMessageById(this.state.messages, messageId);

    let data = {
      content: message.content,
      userName: message.user_info.name,
      time: message.updatedAt,
    };

    handlersMessage.actionFunc.quoteMessage(memberId, data);
  };
  // for quote msg - END

  // generate list TO - BEGIN
  generateListTo = () => {
    const { t, allMembers, roomInfo } = this.props;
    const currentUserInfo = this.props.userContext.info;
    const content =
      allMembers == [] ? (
        <span>Not data</span>
      ) : (
        <div className="member-infinite-container">
          {roomInfo.type == room.ROOM_TYPE.GROUP_CHAT && (
            <a className="form-control to-all" href="javascript:;" onClick={handlersMessage.actionFunc.toAll}>
              <span>{t('to_all')}</span>
            </a>
          )}
          <InfiniteScroll initialLoad={false} pageStart={0} loadMore={this.handleInfiniteOnLoad} useWindow={false}>
            <List
              dataSource={allMembers}
              renderItem={member => {
                return member._id != currentUserInfo._id ? (
                  <List.Item key={member._id}>
                    <List.Item.Meta
                      avatar={<Avatar src={getUserAvatarUrl(member.avatar)} />}
                      title={
                        <a onClick={handlersMessage.actionFunc.toMember} href="javascript:;" data-mid={member._id}>
                          {member.nick_name ? member.nick_name.nick_name : member.name}
                        </a>
                      }
                    />
                  </List.Item>
                ) : (
                  <span />
                );
              }}
            />
          </InfiniteScroll>
        </div>
      );

    return content;
  };
  generateListEMoji = () => {
    const listEmoji = configEmoji.EMOJI;
    const { t } = this.props;
    const content = (
          <div className="member-infinite-container" style={{ width: '210px' }}>

            <InfiniteScroll initialLoad={false} pageStart={0} loadMore={this.handleInfiniteOnLoad} useWindow={false}>
              <div className="box-emoji" >
                {Object.entries(listEmoji).map(([key, emoji]) => {
                  return (
                    <p className="line-emoji"><Avatar className="image-emoji" src={getEmoji(emoji.image)} alt={key} title={t(emoji.tooltip)} onClick={this.handleEmoji}/></p>
                  )
                })}
              </div>
            </InfiniteScroll>
          </div>
        );

    return content;
  };

  handleInfiniteOnLoad = () => {};
  // generate list TO - END

  // process for popover - BEGIN
  updateSendingRequestUsers = (requestId, status = true) => {
    this.setState(prevState => ({
      sendingRequestUsers: {
        ...prevState.sendingRequestUsers,
        [requestId]: status,
      },
    }));
  };

  updateReceivedRequestUsers = (sentRequestId, status = true) => {
    this.setState(prevState => ({
      receivedRequestUsers: {
        ...prevState.receivedRequestUsers,
        [sentRequestId]: status,
      },
    }));
  };

  getDirectRoom = userId => {
    getDirectRoomId(userId).then(res => {
      let roomId = res.data;

      this.setState(prevState => ({
        directRoomIds: {
          ...prevState.directRoomIds,
          [userId]: roomId._id !== undefined ? roomId._id : null,
        },
      }));
    });
  };

  handleSendRequestContact = e => {
    const sendContactId = e.target.value;

    addContact({ userId: sendContactId })
      .then(res => {
        this.updateReceivedRequestUsers(sendContactId);
        this.updateSendingRequestUsers(this.props.userContext.info._id);
        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleCancelRequest = e => {
    const sentRequestId = e.target.value;

    deleteSentRequestContact({ requestSentContactId: sentRequestId })
      .then(res => {
        this.updateReceivedRequestUsers(sentRequestId, false);
        this.updateSendingRequestUsers(this.props.userContext.info._id, false);
        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleRejectContact = e => {
    let dataInput = {
      rejectContactIds: [e.target.value],
    };

    if (dataInput.rejectContactIds.length > 0) {
      rejectContact(dataInput)
        .then(res => {
          dataInput['rejectContactIds'].map(checkedId => {
            this.updateSendingRequestUsers(checkedId, false);
            this.updateReceivedRequestUsers(this.props.userContext.info._id, false);
          });

          message.success(res.data.success);
        })
        .catch(error => {
          message.error(error.response.data.error);
        });
    }
  };

  handleAcceptContact = e => {
    const requestId = [e.target.value];

    acceptContact(requestId)
      .then(res => {
        this.updateSendingRequestUsers(requestId, false);
        this.updateReceivedRequestUsers(this.props.userContext.info._id, false);
        this.getDirectRoom(requestId);

        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleVisibleChange = userId => visible => {
    if (visible && this.state.directRoomIds[userId] === undefined) {
      this.getDirectRoom(userId);
    }

    if (visible && this.state.receivedRequestUsers[userId] === undefined) {
      getListSentRequestContacts().then(res => {
        let sentRequestIds = res.data.result;
        sentRequestIds.map(item => {
          this.updateReceivedRequestUsers(item._id);
        });

        if (!sentRequestIds.includes(userId)) {
          this.updateReceivedRequestUsers(userId, false);
        }
      });
    }

    if (visible && this.state.sendingRequestUsers[userId] === undefined) {
      let requestContactIds = this.props.userContext.info.requested_in_comming;

      if (requestContactIds.includes(userId)) {
        requestContactIds.map(item => {
          let requestContactId = Object.assign({ _id: item });

          this.updateSendingRequestUsers(requestContactId._id);
        });
      }
    }
  };
  // process for popover - END

  render() {
    const {
      messages,
      redLineMsgId,
      isEditing,
      loadingPrev,
      loadingNext,
      messageIdEditing,
      messageIdHovering,
      infoUserTip
    } = this.state;
    const { t, roomInfo, isReadOnly, roomId, allMembers } = this.props;
    const currentUserInfo = this.props.userContext.info;
    const showListMember = this.generateListTo();
    const showListEmoji = this.generateListEMoji();
    const redLine = this.generateRedLine();
    const listMember = allMembers.filter(item => item._id != currentUserInfo._id);

    let nextMsgId = null;

    for (let message of messages) {
      if (!redLineMsgId || message._id > redLineMsgId) {
        nextMsgId = message._id;
        break;
      }
    }

    return (
      <Content className="chat-room">
        <div id="_profileTip" className="profileTooltip tooltip tooltip--white" role="tooltip">
          <div className="_cwTTTriangle tooltipTriangle tooltipTriangle--whiteTop"></div>
          { this.generateMsgContent(infoUserTip) }
        </div>
        <div
          className="list-message"
          ref={element => (this.attr.msgContainerRef = element)}
          onScroll={this.handleScroll}
        >
          {loadingPrev && (
            <div className="loading-room">
              <Spin tip="Loading..." />
            </div>
          )}
          <div>
            {messages.map(message => {
              let messageHtml = this.createMarkupMessage(message);
              let notificationClass = message.is_notification ? 'pre-notification' : '';
              let isToMe =
                messageHtml.__html.includes(`data-tag="[To:${currentUserInfo._id}]"`) ||
                messageHtml.__html.includes(`data-tag="[rp mid=${currentUserInfo._id}]"`) ||
                messageHtml.__html.includes(messageConfig.SIGN_TO_ALL);

              return (
                <div
                  key={message._id}
                  ref={element => (this.attr.messageRowRefs[message._id] = element)}
                  className="wrap-message"
                >
                  {message._id === nextMsgId ? redLine : ''}
                  <Row
                    key={message._id}
                    className={
                      (messageIdEditing === message._id ? 'message-item isEditing' : 'message-item',
                      isToMe ? 'timelineMessage--mention' : '')
                    }
                    onMouseEnter={this.handleMouseEnter}
                    onMouseLeave={this.handleMouseLeave}
                    id={message._id}
                  >
                    <Col span={22}>
                      <List.Item className="li-message">
                        <Popover
                          placement="topLeft"
                          trigger="click"
                          text={message.user_info.name}
                          content={this.generateMsgContent(message.user_info)}
                          onVisibleChange={this.handleVisibleChange(message.user_info._id)}
                        >
                          <div data-user-id={message.user_info._id}>
                            <List.Item.Meta
                              className="show-infor"
                              avatar={<Avatar src={getUserAvatarUrl(message.user_info.avatar)} />}
                              title={<p>{message.user_info.name}</p>}
                            />
                          </div>
                        </Popover>
                      </List.Item>
                      <div className="infor-content">
                        <pre
                          className={'timelineMessage__message ' + notificationClass}
                          dangerouslySetInnerHTML={messageHtml}
                        />
                      </div>
                    </Col>
                    <Col span={2} className="message-time">
                      <h4>
                        {this.formatMsgTime(message.updatedAt)}{' '}
                        {message.updatedAt !== message.createdAt ? (
                          <span>
                            <Icon type="edit" />
                          </span>
                        ) : (
                          ''
                        )}
                      </h4>
                    </Col>
                    <Col span={24} style={{ position: 'relative' }}>
                      {message.is_notification == false && (
                        <div
                          id={'action-button-' + message._id}
                          style={{ textAlign: 'right', position: 'absolute', bottom: '0', right: '0', display: 'none' }}
                        >
                          {currentUserInfo._id === message.user_info._id && !message.is_notification && !isReadOnly && (
                            <Button type="link" onClick={this.editMessage} id={message._id}>
                              <Icon type="edit" /> {t('button.edit')}
                            </Button>
                          )}
                          {currentUserInfo._id !== message.user_info._id && !isReadOnly && (
                            <Button
                              type="link"
                              onClick={handlersMessage.actionFunc.replyMember}
                              id={message._id}
                              data-rid={roomId}
                              data-mid={message.user_info._id}
                              data-name={message.user_info.name}
                            >
                              <Icon type="enter" /> {t('button.reply')}
                            </Button>
                          )}
                          <Button
                            type="link"
                            onClick={this.quoteMessage}
                            id={message._id}
                            data-mid={message.user_info._id}
                          >
                            <Icon type="rollback" /> {t('button.quote')}
                          </Button>
                        </div>
                      )}
                    </Col>
                  </Row>
                </div>
              );
            })}
            {loadingNext && (
              <div className="loading-room">
                <Spin tip="Loading..." />
              </div>
            )}
          </div>
        </div>
        <div className="box-button">
          <Popover content={showListEmoji}>
            <Badge className="header-icon" type="primary">
              <Icon type="smile" theme="outlined" />
            </Badge>
          </Popover>
          <Popover content={showListMember}>
            <Badge className="header-icon" type="primary">
              <a href="javascript:;">{roomInfo.type !== room.ROOM_TYPE.MY_CHAT ? <strong>{t('to')}</strong> : ''}</a>
            </Badge>
          </Popover>
          {roomInfo.type === room.ROOM_TYPE.GROUP_CHAT && (
            <ModalChooseMemberToCall
              listMember={listMember}
              roomDetail={{
                name: roomInfo.name,
                avatar: roomInfo.avatar,
                type: roomInfo.type,
                _id: roomInfo._id,
                currentUserId: currentUserInfo._id,
              }}
            />
          )}
          <a onClick={handlersMessage.actionFunc.infoBlock} className="block">
            <strong>{block.INFO_BLOCK}</strong>
          </a>
          <a onClick={handlersMessage.actionFunc.titleBlock} className="block">
            <strong>{block.TITLE_BLOCK}</strong>
          </a>
          <a onClick={handlersMessage.actionFunc.codeBlock} className="block">
            <strong>{block.CODE_BLOCK}</strong>
          </a>
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
              <Button style={{ float: 'right' }} type="primary" onClick={this.handleSendMessage} disabled={isReadOnly}>
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
          disabled={isReadOnly}
          onKeyDown={this.handleSendMessage}
          ref={input => {
            this.inputMsg = input;
          }}
        />
      </Content>
    );
  }
}

export default withRouter(withNamespaces(['message'])(withUserContext(ChatBox)));
