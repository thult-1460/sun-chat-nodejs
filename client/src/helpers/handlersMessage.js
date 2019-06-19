'use strict';

import hljs from "highlight.js";
import { messageConfig } from '../config/messageConfig';
import { getUserAvatarUrl } from './common';
const _ = require('lodash');


let contentHtml = '';
let listMembers = [];
let subContent = {};

const insertTextToMessageArea = function(content) {
  let target = document.getElementById('msg-content');

  if (target.setRangeText) {
    //if setRangeText function is supported by current browser
    target.setRangeText(content)
  } else {
    target.focus()
    document.execCommand('insertText', false /*no UI*/, content);
  }
};

const actionFunc = {
  toMember: function(e) {
    insertTextToMessageArea("[To:" + e.target.getAttribute('data-mid') + "] " + e.target.text + "\n");

    return false;
  },
  replyMember: function(e) {
    insertTextToMessageArea("[Reply mid=" + e.target.getAttribute('data-mid') + " to=" + e.target.id + "] " + e.target.text + "\n");

    return false;
  },
  toAll: function(e) {
    insertTextToMessageArea("[toall]" + "\n");

    return false;
  }
};

const getAvatarByID = (id) => {
  let member = listMembers.find(member => member._id == id);
  let avatar = (member) ? getUserAvatarUrl(member.avatar) : messageConfig.ICO_AVATAR_NOTFOUND;

  return `<img src="${ avatar }" />`;
};

const messageToHtml = {
  to: function(id) {
    let avatar = getAvatarByID(id);

    return `<div data-cwtag="[To:${id}]" class="messageBadge" contenteditable="false"><div class="chatTimeLineTo"><span>To</span>${ avatar }</div></div>`;
  },
  code: function(code) {
    let codeHighlight = hljs.highlightAuto(_.unescape(code));

    return `<code data-cwtag="[code] ${ code } [/code]" class="chatCode">${ codeHighlight.value }</code>`;
  },
  toall: function() {
    return '<div class="messageBadge"' + messageConfig.SIGN_TO_ALL + '><div class="messageBadge__toAllBadge" contenteditable="false"><span>To ALL</span></div></div>';
  },
};

const renderMessageToHtml = {
  to: function(content) {
    let regEx = /\[to:([\w-]+)\]/gi;
    let match = regEx.exec(content);

    while (match !== null) {
      contentHtml = contentHtml.replace(match[0], messageToHtml.to(match[1]));
      match = regEx.exec(content);
    }

    return false;
  },
  toall: function(content) {
    contentHtml = contentHtml.replace(/\[toall\]/gi, messageToHtml.toall());

    return false;
  },
};

// handles blockCode
const renderBlockCode = (content) => {
  let blockCode = content;
  let regEx = /(\[code\])([\s\S]*?)(\[\/code\])/gi;
  let match = regEx.exec(content);
  
  while (match !== null) {
    blockCode = blockCode.replace(match[0], messageToHtml.code(match[2]));
    match = regEx.exec(content);
  }

  return blockCode
}

// pre-handling blockCode
const handlesBlockCode = (content) => {
  let regEx = /\[code\][\s\S]*?\[\/code\]/gm;
  let match = regEx.exec(content);
  let tmpContent = content;

  while (match !== null) {
    let key = `%_${Math.random().toString(36).substring(2, 35)}${new Date().getTime()}_%`;
    let blockCode = renderBlockCode(match[0]) // handle blockCode
    subContent[key] = blockCode;

    tmpContent = tmpContent.replace(match[0], key);
    match = regEx.exec(content);
  }

  return tmpContent;
}

const renderMessage = (message, members) => {
  let content = message.content;

  if (message.is_notification) {
    return `<div class="msg-notification"> ${content} </div>`;
  }

  listMembers = members;
  contentHtml = content = _.escape(handlesBlockCode(content));

  for (let key in renderMessageToHtml) {
    renderMessageToHtml[key](content);
  }

  for (let key in subContent) {
    contentHtml = contentHtml.replace(key, subContent[key]);
  }

  return contentHtml;
};

export default {
  renderMessage,
  actionFunc,
};
