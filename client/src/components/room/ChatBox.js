import React from 'react';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col, Badge, Popover, message, Spin, Tabs } from 'antd';
import {
  loadMessages,
  loadPrevMessages,
  loadUnreadNextMessages,
  getDirectRoomId,
  getListNicknameByUserInRoom,
} from './../../api/room.js';
import {
  addContact,
  getListSentRequestContacts,
  deleteSentRequestContact,
  acceptContact,
  rejectContact,
} from './../../api/contact';
import { getUserById } from './../../api/user';
import { offerJoinLiveChat } from '../../api/call';
import { getMessageInfo } from './../../api/room.js';
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
import { generateListEmoji } from '../../helpers/generateHTML/emoji';
import { generateListTo } from '../../helpers/generateHTML/to';
import {
  getReplyMessageContent,
  generateMsgContent,
  generateRedLine,
  generateMessageHTML,
  handleCancelEdit,
  handleSendMessage
} from '../../helpers/generateHTML/message';
import { getUserAvatarUrl, saveSizeComponentsChat, getEmoji } from './../../helpers/common';
import ModalChooseMemberToCall from './ModalChooseMemberToCall';
import avatarConfig from '../../config/avatar';
import $ from 'jquery';
import ModalSetNicknames from '../modals/room/ModalSetNicknames';

const { Content } = Layout;
const { TabPane } = Tabs;
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
  infoUserTip: {},
  nicknames: {},
  reactionUserList: {},
  flagMsgId: '',
  activeKeyTab: 0,
  visiblePopoverTo: false,
  replyMessageContent: '',
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
  infoUserTips: {},
};

let cacheReplyMessages = [];

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
        handleCancelEdit(this);
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

    this.socket.on('delete-message', msgId => {
      if (msgId) {
        let listMsg = this.state.messages.filter(msg => {
          return msg._id !== msgId;
        });

        this.setState({
          messages: listMsg,
        });

        message.success(t('delete.success'));
      }
    });

    this.socket.on('reaction_msg', newMsg => {
      const { messages } = this.state;
      const message = this.getMessageById(messages, newMsg._id);

      if (message !== null) {
        message.reactions = newMsg.reactions;
        this.forceUpdate();
      }
    });

    this.socket.on('update_nickname_member_in_message', nicknames => {
      this.setState({ nicknames });
    });

    this.socket.on('remove_global_nickname_from_message', nicknames => {
      this.setState({ nicknames });
    });

    if (!localStorage.getItem('descW')) {
      saveSizeComponentsChat();
    }

    let _this = this;
    const { t } = this.props;

    $(document).on('click', '._avatarClickTip', async function(e) {
      $('#originMsgTooltip').hide();
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
            name: t('cancelled_user'),
          };
        }
      }

      _this.setState({ infoUserTip: userInfo });
      if (flag) {
        await _this.handleVisibleChange(profileTipId)(true);
      }
    });

    $(document).on('click', '.reply-msg', async function(e) {
      const msgId = $(e.currentTarget).data('msg_id');
      const { roomId } = _this.props;
      const { messages } = _this.state;

      try {
        if (msgId) {
          let messagesTmp = cacheReplyMessages.concat(messages);
          let message = _this.getMessageById(messagesTmp, msgId);

          if (message != null) {
              await Promise.resolve(1);
          } else {
            let messageResponse = await getMessageInfo(roomId, msgId);

            message = messageResponse.data.message;
            cacheReplyMessages.push(message);
          }

          let replyMessageContent = getReplyMessageContent(_this, message);
          _this.setState({'replyMessageContent': replyMessageContent});
        } else {
          await Promise.reject(new Error("No message id!"));
        }

      } catch(err) {
        _this.setState({'replyMessageContent': initialState.replyMessageContent});
      }
    })

    $(document).on('click', 'body', function(event) {
      let xPosition = 0,
        yPosition = 0;
      xPosition = event.clientX - $('.profileTooltip').width() / 2;

      if (event.clientY - $('.profileTooltip').height() < 0) {
        yPosition = event.clientY + 20;
        $('.tooltipTriangle').css({
          bottom: '225px',
          'border-width': '0 7px 7px 7px',
          'border-color': 'transparent transparent #a5a0a0 transparent',
        });
      } else {
        yPosition = event.clientY - ($('.profileTooltip').height() + 25);
        $('.tooltipTriangle').css({
          bottom: '-7px',
          'border-width': '7px 7px 0 7px',
          'border-color': '#a5a0a0 transparent transparent transparent',
        });
      }

      if (event.target.id == 'target') {
        $('#_profileTip')
          .css({
            top: yPosition + 'px',
            left: xPosition + 'px',
          })
          .show();
        $('#originMsgTooltip').hide();
      } else if (event.target.id == 'reply-msg') {
        $('#originMsgTooltip')
          .css({
            top: yPosition + 'px',
            left: xPosition + 'px',
          })
          .show();
        $('#_profileTip').hide();
      } else {
        _this.setState({ infoUserTip: {}, replyMessageContent: initialState.replyMessageContent });
        $('.profileTooltip').hide();
      }
    });
  }

  componentDidUpdate(prevProps) {
    $('.joinLiveButton').unbind('click').bind('click', e => {
      this.joinLiveChat(e.currentTarget.dataset.liveId);
    });

    if (prevProps.loadedRoomInfo && !this.props.loadedRoomInfo) {
      document.getElementById('msg-content').value = '';
      this.inputMsg.focus();

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
      getListNicknameByUserInRoom(this.props.roomId)
        .then(res => {
          const nicknames = res.data.nicknames;
          this.setState({ nicknames });
        })
        .catch(err => {
          message.error(err.response.data.error);
        });
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
    
    const height = $('#originMsgTooltip').height();
    const position = $('#originMsgTooltip').position();

    $('#originMsgTooltip').css({
      top: (position.top + (225 - height)) + 'px',
      left: position.left + 'px',
    });
  }

  hidePopoverTo = () => {
    this.setState({
      visiblePopoverTo: false,
    });
  };

  joinLiveChat = liveChatId => {
    let param = {
      roomId: this.props.roomId,
      liveChatId: liveChatId,
      info: {
        avatar: this.props.userContext.info.avatar,
        name: this.props.userContext.info.name,
      },
    };

    offerJoinLiveChat(param).then(res => {
      if (res.data.success) {
        window.open(
          `${window.location.href}/live/${liveChatId}`,
          '_blank',
          'toolbar=yes, width=' + window.innerWidth + ',height=' + window.innerHeight
        );
      } else {
        message.error(res.data.message);
      }
    });
  };

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

  formatMsgTime(timeInput) {
    const { t } = this.props;
    const time = new Date(timeInput);

    return moment(time).format(t('format_time'));
  }

  getMessageById(messages, messageId) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]._id === messageId) {
        return messages[i];
      }
    }

    return null;
  }

  getEmptyReplyMessage = () => {
    const { t } = this.props;

    return (
      <div class="empty-reply-msg">
        <p> { t('messages.no_reply_msg')} </p>
      </div>
    )
  };

  onChangeTab = activeKey => {
    this.setState({ activeKeyTab: activeKey });
  };

  handleVisibleChangePopoverTo = visiblePopoverTo => {
    this.setState({ visiblePopoverTo });
  };

  handleInfiniteOnLoad = () => {};

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
  // Sort reaction array
  mapOrder = (array, order, objKey) => {
    array.sort( function (a, b) {
      let A = a[objKey.key][objKey.subKey],
          B = b[objKey.key][objKey.subKey];

      if (order.indexOf(A) > order.indexOf(B)) {
        return 1;
      } else {
        return -1;
      }
    });

    return array;
  };

  render() {
    let {
      messages,
      nicknames,
      redLineMsgId,
      isEditing,
      loadingPrev,
      loadingNext,
      messageIdEditing,
      infoUserTip,
      replyMessageContent,
      flagMsgId,
    } = this.state;
    const { t, roomInfo, isReadOnly, roomId, allMembers } = this.props;
    const currentUserInfo = this.props.userContext.info;
    const showListMember = generateListTo(this);
    const showListEmoji = generateListEmoji(this);
    const redLine = generateRedLine(this);
    const listMember = allMembers.filter(item => item._id != currentUserInfo._id);
    let nextMsgId = null;

    for (let message of messages) {
      if (!redLineMsgId || message._id > redLineMsgId) {
        nextMsgId = message._id;
        break;
      }
    }

    if (replyMessageContent == '') {
      replyMessageContent = this.getEmptyReplyMessage();
    }

    return (
      <Content className="chat-room">
        <div id="_profileTip" className="profileTooltip tooltip tooltip--white" role="tooltip">
          <div className="_cwTTTriangle tooltipTriangle tooltipTriangle--whiteTop" />
          {generateMsgContent(this, infoUserTip)}
        </div>

        <div id="originMsgTooltip" className="profileTooltip tooltip tooltip--white" role="tooltip">
          {replyMessageContent}
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
              return generateMessageHTML(this, message);
            })}

            {loadingNext && (
              <div className="loading-room">
                <Spin tip="Loading..." />
              </div>
            )}
          </div>
        </div>
        <div className="box-button">
          <Popover content={showListEmoji} trigger="click">
            <Badge className="header-icon" type="primary">
              <a><Icon type="smile" theme="outlined"/></a>
            </Badge>
          </Popover>
          <Popover content={showListMember} trigger="click" visible={this.state.visiblePopoverTo} onVisibleChange={this.handleVisibleChangePopoverTo}>
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
              <Button style={{ float: 'right' }} type="primary" onClick={(e) => handleSendMessage(e, this)}>
                {t('button.update')}
              </Button>
              <Button style={{ float: 'right' }} type="default" onClick={() => handleCancelEdit(this)}>
                {t('button.cancel')}
              </Button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Button style={{ float: 'right' }} type="primary" onClick={(e) => handleSendMessage(e, this)} disabled={isReadOnly}>
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
          onKeyDown={(e) => handleSendMessage(e, this)}
          ref={input => {
            this.inputMsg = input;
          }}
        />
      </Content>
    );
  }
}

export default withRouter(withNamespaces(['message'])(withUserContext(ChatBox)));
