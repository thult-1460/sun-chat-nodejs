import hljs from 'highlight.js';
import { messageConfig } from '../config/message';
import { getUserAvatarUrl } from './common';
import i18n from '../i18n';

const _ = require('lodash');

let contentHtml = '';
let listMembers = [];
let subContent = {};

const insertTextToMessageArea = function(content) {
  let target = document.getElementById('msg-content');

  target.focus();
  if (document.execCommand('insertText', false, content)) {
    return;
  }

  target.setRangeText(content, target.selectionStart, target.selectionEnd, 'end');
};

const handleContentMessageWithI18n = content => {
  return content.replace(new RegExp('\\[' + i18n.t('message:button.reply') + ' mid=', 'g'), '[rp mid=');
};

const actionFunc = {
  toMember: function(e) {
    insertTextToMessageArea('[To:' + e.target.getAttribute('data-mid') + '] ' + e.target.text + '\n');

    return false;
  },
  replyMember: function(e) {
    insertTextToMessageArea(
      '[' +
        i18n.t('message:button.reply') +
        ' mid=' +
        e.target.getAttribute('data-mid') +
        '] ' +
        e.target.getAttribute('data-name') +
        '\n'
    );

    return false;
  },
  toAll: function(e) {
    insertTextToMessageArea('[toall]' + '\n');

    return false;
  }
};

const getAvatarByID = (id, userInfo) => {
  let member = listMembers.find(member => member._id == id);
  let avatar = member && member.avatar ? getUserAvatarUrl(member.avatar) : messageConfig.ICO_AVATAR_NOTFOUND;

  return `<img data-mid="${id}" src="${
    userInfo[id] && userInfo[id].avatar ? getUserAvatarUrl(userInfo[id].avatar) : avatar
  }" onError="this.onerror=null;this.src='${messageConfig.ICO_AVATAR_NOTFOUND}';" />`;
};

const messageToHtml = {
  to: function(id, userInfo) {
    let avatar = getAvatarByID(id, userInfo);

    return `<div data-tag="[To:${id}]" class="messageBadge" contenteditable="false"><div class="chatTimeLineTo"><span>To</span>${avatar}</div></div>`;
  },
  code: function(code) {
    let codeHighlight = hljs.highlightAuto(_.unescape(code));

    return `<code data-tag="[code] ${code} [/code]" class="chatCode">${codeHighlight.value}</code>`;
  },
  toall: function() {
    return (
      '<div class="messageBadge"' +
      messageConfig.SIGN_TO_ALL +
      '><div class="messageBadge__toAllBadge" contenteditable="false"><span>TO ALL</span></div></div>'
    );
  },
  reply: function(memberId, userInfo) {
    let avatar = getAvatarByID(memberId, userInfo);

    return `<div data-tag="[rp mid=${memberId}]" class="messageBadge" contenteditable="false"><div class="chatTimeLineTo" data-mid="${memberId}"><span>&#8592; Re</span>${avatar}</div></div>`;
  },
  title: function(content) {
    return `<div><b>&#9432</b> ${content}</div>`;
  },
};

const renderMessageToHtml = {
  to: function(content, userInfo) {
    let regEx = /\[to:([\w-]+)\]/gi;
    let match = regEx.exec(content);
    let tmpMatch = {};

    while (match !== null) {
      tmpMatch[match[0]] = messageToHtml.to(match[1], userInfo);
      match = regEx.exec(content);
    }

    _.map(tmpMatch, function(el, key) {
      contentHtml = contentHtml.replace(new RegExp(_.escapeRegExp(key), 'g'), el);
    });

    return false;
  },
  toall: function(content, userInfo) {
    contentHtml = contentHtml.replace(/\[toall\]/gi, messageToHtml.toall());

    return false;
  },
  reply: function(content, userInfo) {
    let regEx = /\[rp mid=([\w-]+).*?\]/g;
    let match = regEx.exec(content);
    let tmpMatch = {};

    while (match !== null) {
      tmpMatch[match[0]] = messageToHtml.reply(match[1], userInfo);
      match = regEx.exec(content);
    }

    _.map(tmpMatch, function(el, key) {
      contentHtml = contentHtml.replace(new RegExp(_.escapeRegExp(key), 'g'), el);
    });

    return false;
  },
};

// handles blockCode
const renderBlockCode = content => {
  let blockCode = content;
  let regEx = /(\[code\])([\s\S]*?)(\[\/code\])/gi;
  let match = regEx.exec(content);

  while (match !== null) {
    blockCode = blockCode.replace(match[0], messageToHtml.code(match[2]));
    match = regEx.exec(content);
  }

  return blockCode;
};

// pre-handling blockCode
const handleBlockCode = content => {
  let regEx = /\[code\][\s\S]*?\[\/code\]/gm;
  let match = regEx.exec(content);
  let tmpContent = content;

  while (match !== null) {
    let key = `%_${Math.random()
      .toString(36)
      .substring(2, 35)}${new Date().getTime()}_%`;
    let blockCode = renderBlockCode(match[0]); // handle blockCode
    subContent[key] = blockCode;

    tmpContent = tmpContent.replace(match[0], key);
    match = regEx.exec(content);
  }

  return tmpContent;
};

const handleTitle = content => {
  let regEx = /(\[title\])(((?!\[(title|\/title)\]).)*)(\[\/title\])/s;
  let match = regEx.exec(content);

  while (match !== null) {
    content = content.replace(match[0], messageToHtml.title(match[2]));
    match = regEx.exec(content);
  }

  return content;
};

const renderMessage = (message, members, userInfo = {}) => {
  let content = message.content;

  if (message.is_notification) {
    return `<div class="msg-notification"> ${content} </div>`;
  }

  listMembers = members;
  content = _.escape(handleBlockCode(content));
  content = handleTitle(content);

  contentHtml = content;
  for (let key in renderMessageToHtml) {
    renderMessageToHtml[key](content, userInfo);
  }

  for (let key in subContent) {
    contentHtml = contentHtml.replace(key, subContent[key]);
  }

  return contentHtml;
};

export default {
  handleContentMessageWithI18n,
  renderMessage,
  actionFunc,
};
