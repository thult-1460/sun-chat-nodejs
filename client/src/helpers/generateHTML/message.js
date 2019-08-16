'use trict';

import React from 'react';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col, Badge, Popover, message, Spin, Tabs } from 'antd';
import { messageConfig } from '../../config/message';
import { Link } from 'react-router-dom';
import { getUserAvatarUrl, getEmoji } from './../common';
import { generateListTo } from './to';
import { generateListEmoji, generateEmojiButton } from './emoji';
import handlersMessage from './../handlersMessage';
import configEmoji from '../../config/emoji';
import avatarConfig from '../../config/avatar';
import { generateReactionMsg, generateReactionUserList } from './reaction';
import { deleteMessage as deleteMessageAPI, sendMessage, updateMessage } from './../../api/room.js';
import { fetchReactionUserList } from './reaction';

export function getReplyMessageContent(component, message) {
  return generateMessageHTML(component, message, true);
}

export function generateMsgContent(component, infoUserTip) {
  const { t } = component.props;
  const userId = infoUserTip._id ? infoUserTip._id : null;
  const myChatId = component.props.userContext.my_chat_id;
  const currentUserId = component.props.userContext.info._id;
  const directRoomId = component.state.directRoomIds[userId];
  const receivedRequestUser = component.state.receivedRequestUsers[userId];
  const sendingRequestUser = component.state.sendingRequestUsers[userId];
  let button = <Spin />;

  if (userId == currentUserId) {
    button = (
      <Link to={`/rooms/${myChatId}`}>
        <Button>{component.props.t('title.my_chat')}</Button>
      </Link>
    );
  } else if (directRoomId === undefined) {
    button = '';
  } else {
    button = directRoomId ? (
      <Link to={`/rooms/${directRoomId}`}>
        <Button>{component.props.t('title.direct_chat')}</Button>
      </Link>
    ) : sendingRequestUser ? (
      <div>
        <Button value={userId} onClick={component.handleRejectContact}>
          {component.props.t('title.reject_request')}
        </Button>
        <Button value={userId} onClick={component.handleAcceptContact}>
          {component.props.t('title.accept_request')}
        </Button>
      </div>
    ) : receivedRequestUser ? (
      <Button value={userId} onClick={component.handleCancelRequest}>
        {component.props.t('title.cancel_request')}
      </Button>
    ) : (
      <Button value={userId} onClick={component.handleSendRequestContact}>
        {component.props.t('title.add_contact')}
      </Button>
    );
  }

  return (
    <div className="popover-infor">
      <div className="infor-bg">
        <Avatar src={getUserAvatarUrl(infoUserTip.avatar)} className="infor-avatar" />
      </div>
      <div style={{ minHeight: '55px' }}>
        <p className="infor-name">{infoUserTip.name ? infoUserTip.name : t('loading')}</p>
        <p>{infoUserTip.email ? infoUserTip.email : ''}</p>
      </div>
      <div className="infor-footer">
        <div>{<List.Item style={{ minHeight: '35px' }}>{button}</List.Item>}</div>
      </div>
    </div>
  );
}

export function generateMessageHTML(component, message, isGetContentOfReplyMsg = false) {
  let {
    messages,
    nicknames,
    redLineMsgId,
    isEditing,
    loadingPrev,
    loadingNext,
    messageIdEditing,
    messageIdHovering,
    infoUserTip,
    flagMsgId,
  } = component.state;
  const { t, roomInfo, isReadOnly, roomId, allMembers } = component.props;
  const currentUserInfo = component.props.userContext.info;
  const showListMember = generateListTo(component);
  const showListEmoji = generateListEmoji(component);
  const redLine = generateRedLine(component);
  const listMember = allMembers.filter(item => item._id != currentUserInfo._id);
  let nextMsgId = null;
  let messageHtml = createMarkupMessage(component, message);
  let notificationClass = message.is_notification ? 'pre-notification' : '';
  let isToMe =
    messageHtml.__html.includes(`data-tag="[To:${currentUserInfo._id}]"`) ||
    messageHtml.__html.includes(`data-tag="[rp mid=${currentUserInfo._id}]"`) ||
    messageHtml.__html.includes(messageConfig.SIGN_TO_ALL);
  let reactionOfMsg = reactionDupplicateCounter(component, message.reactions);

  for (let message of messages) {
    if (!redLineMsgId || message._id > redLineMsgId) {
      nextMsgId = message._id;
      break;
    }
  }

  return (
    <div
      key={message._id}
      ref={element => (component.attr.messageRowRefs[message._id] = element)}
      className="wrap-message"
    >
      {message._id === nextMsgId ? redLine : ''}
      <Row
        key={message._id}
        className={
          (messageIdEditing === message._id ? 'message-item isEditing' : 'message-item',
          isToMe ? 'timelineMessage--mention' : '')
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        id={message._id}
      >
        <Col span={22}>
          <List.Item className="li-message">
            <Popover
              placement="topLeft"
              trigger="click"
              text={message.user_info.name}
              content={generateMsgContent(component, message.user_info)}
              onVisibleChange={component.handleVisibleChange(message.user_info._id)}
            >
              <div data-user-id={message.user_info._id}>
                <List.Item.Meta
                  className="show-infor"
                  avatar={
                    <Avatar size={avatarConfig.AVATAR.SIZE.MEDIUM} src={getUserAvatarUrl(message.user_info.avatar)} />
                  }
                  title={
                    <p>
                      {nicknames[message.user_info._id] ? nicknames[message.user_info._id] : message.user_info.name}
                    </p>
                  }
                />
              </div>
            </Popover>
          </List.Item>
          <div className="infor-content">
            <pre className={'timelineMessage__message ' + notificationClass} dangerouslySetInnerHTML={messageHtml} />
            {reactionOfMsg.length > 0 ? (
              <div className="_reaction timelineMessage__reactionDisplayContainer" style={{ display: 'flex' }}>
                {reactionOfMsg.map(value => {
                  return configEmoji.REACTION[value.reaction.reaction_tag]
                    ? generateEmojiButton(component, message, value, isGetContentOfReplyMsg)
                    : '';
                })}
                {!isGetContentOfReplyMsg && (
                  <Popover
                    trigger="click"
                    content={generateReactionUserList(component, message._id, reactionOfMsg)}
                    visible={flagMsgId === message._id}
                    onVisibleChange={visible =>
                      showReactionUserList(component, message._id, reactionOfMsg[0].reaction.reaction_tag, visible)
                    }
                  >
                    <span
                      className="_openSelectedReactionDialog timelineMessage__reactionUserListContainer _showDescription"
                      aria-label="View Reactions"
                    >
                      <Icon className="timelineMessage__reactionUserListIcon" type="usergroup-add" />
                    </span>
                  </Popover>
                )}
              </div>
            ) : (
              ''
            )}
          </div>
        </Col>
        <Col span={2} className="message-time">
          <h4>
            {component.formatMsgTime(message.updatedAt)}{' '}
            {message.updatedAt !== message.createdAt ? (
              <span>
                <Icon type="edit" />
              </span>
            ) : (
              ''
            )}
          </h4>
        </Col>
        {!isGetContentOfReplyMsg && (
          <Col span={24} style={{ position: 'relative' }}>
            {message.is_notification === false && (
              <div
                className="optionChangeMessage"
                id={'action-button-' + message._id}
                style={{ textAlign: 'right', position: 'absolute', bottom: '0', right: '0', display: 'none' }}
              >
                {currentUserInfo._id === message.user_info._id && !message.is_notification && !isReadOnly && (
                  <Button
                    type="link"
                    onClick={e => {
                      editMessage(e, component);
                    }}
                    id={message._id}
                  >
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
                    data-name={
                      nicknames[message.user_info._id] ? nicknames[message.user_info._id] : message.user_info.name
                    }
                  >
                    <Icon type="enter" /> {t('button.reply')}
                  </Button>
                )}
                <Popover content={generateReactionMsg(component, message._id)} trigger="click">
                  <Button type="link" id={message._id} data-mid={message.user_info._id}>
                    <Icon type="heart" theme="twoTone" twoToneColor="#eb2f96" /> {t('button.reaction')}
                  </Button>
                </Popover>
                <Button
                  type="link"
                  onClick={e => quoteMessage(e, component)}
                  id={message._id}
                  data-mid={message.user_info._id}
                >
                  <Icon type="rollback" /> {t('button.quote')}
                </Button>
                {currentUserInfo._id === message.user_info._id && !isReadOnly && (
                  <Button type="link" id={message._id} onClick={e => deleteMessage(e, component)}>
                    <Icon type="delete" /> {t('button.delete')}
                  </Button>
                )}
              </div>
            )}
          </Col>
        )}
      </Row>
    </div>
  );
}

export function generateRedLine(component) {
  const { t } = component.props;

  return (
    <div className={'timeLine__unreadLine'} ref={element => (component.attr.unreadMsgLineRef = element)}>
      <div className="timeLine__unreadLineBorder">
        <div className="timeLine__unreadLineContainer">
          <div className="timeLine__unreadLineBody">
            <span className="timeLine__unreadLineText">{t('unread_title')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function handleMouseEnter(e) {
  const messageIdHovering = e.currentTarget.id;

  if (document.getElementById('action-button-' + messageIdHovering)) {
    document.getElementById('action-button-' + messageIdHovering).style.display = 'block';
  }
}

function handleMouseLeave(e) {
  const messageIdHovering = e.currentTarget.id;

  if (document.getElementById('action-button-' + messageIdHovering)) {
    document.getElementById('action-button-' + messageIdHovering).style.display = 'none';
  }
}

function editMessage(e, component) {
  const messageId = e.currentTarget.id;
  const oldMsgFlag = e.currentTarget.getAttribute('old-msg-flag');

  const message =
    oldMsgFlag == 1
      ? component.getMessageById(component.state.messages, messageId)
      : component.getMessageById(component.state.messages, messageId);

  if (message !== null) {
    component.setState({
      messageIdEditing: message._id,
      isEditing: true,
    });

    document.getElementById('msg-content').value = message.content;
  }
}

function createMarkupMessage(component, message) {
  const { roomId } = component.props;
  const members = component.props.allMembers;
  let messageContentHtml = handlersMessage.renderMessage(message, members, roomId);

  return { __html: messageContentHtml };
}

function showReactionUserList(component, msgId, reactionTag, visible) {
  let { activeKeyTab } = component.state;

  if (visible) {
    fetchReactionUserList(component, msgId, reactionTag);
    component.setState({
      flagMsgId: msgId,
      activeKeyTab: '0',
    });
  } else {
    component.setState({ flagMsgId: '' });
  }
}

function quoteMessage(e, component) {
  const messageId = e.currentTarget.id;
  const memberId = e.target.getAttribute('data-mid');
  const message = component.getMessageById(component.state.messages, messageId);

  let data = {
    content: message.content,
    userName: message.user_info.name,
    time: message.updatedAt,
  };

  handlersMessage.actionFunc.quoteMessage(memberId, data);
}

function deleteMessage(e, component) {
  if (e.currentTarget.id) {
    let params = {
      roomId: component.props.roomId,
      messageId: e.currentTarget.id,
    };

    deleteMessageAPI(params);
  }
}

// handle reaction dupplicate counter
function reactionDupplicateCounter(component, reactionArr = []) {
  let configReaction = Object.keys(configEmoji.REACTION);

  reactionArr = reactionArr.reduce((accumulator, currentValue) => {
    (
      accumulator[accumulator.findIndex(item => item.reaction.reaction_tag === currentValue.reaction_tag)] ||
      accumulator[accumulator.push({ reaction: currentValue, count: 0 }) - 1]
    ).count++;

    return accumulator;
  }, []);

  if (reactionArr.length > 1) {
    reactionArr = component.mapOrder(reactionArr, configReaction, { key: 'reaction', subKey: 'reaction_tag' });
  }

  return reactionArr;
}

export function handleCancelEdit(component) {
  component.setState({
    isEditing: false,
    messageIdEditing: null,
  });

  document.getElementById('msg-content').value = '';
}

export function handleSendMessage(e, component) {
  const { t, roomId } = component.props;
  const messageId = component.state.messageIdEditing;

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

      component.attr.isSender = true;

      if (component.state.messages.length) {
        let lastMsgId = component.state.messages.slice(-1)[0]._id;

        if (component.checkInView(component.attr.messageRowRefs[lastMsgId]) && !component.attr.hasNextMsg) {
          component.setState({ redLineMsgId: lastMsgId });
        }
      }

      document.getElementById('msg-content').value = '';
      component.inputMsg.focus();
    }
  }

  if (e.keyCode == 27) {
    handleCancelEdit(component);
  }
}
