'use trict';

import React from 'react';
import { Avatar } from 'antd';
import configEmoji from '../../config/emoji';
import InfiniteScroll from 'react-infinite-scroller';
import { getEmoji } from './../../helpers/common';
import handlersMessage from './../handlersMessage';
import { handleReaction } from './reaction';

export function generateListEmoji(component) {
  const listEmoji = configEmoji.EMOJI;
  const { t } = component.props;
  const content = (
    <div className="member-infinite-container" style={{ width: '210px' }}>
      <InfiniteScroll initialLoad={false} pageStart={0} loadMore={component.handleInfiniteOnLoad} useWindow={false}>
        <div className="box-emoji">
          {Object.entries(listEmoji).map(([key, emoji]) => {
            return (
              <p className="line-emoji" key={key}>
                <Avatar
                  className="image-emoji"
                  src={getEmoji(emoji.image)}
                  alt={key}
                  title={t(emoji.tooltip)}
                  onClick={handleEmoji}
                />
              </p>
            );
          })}
        </div>
      </InfiniteScroll>
    </div>
  );

  return content;
}

export function generateEmojiButton(component, message, value, isGetContentOfReplyMsg = false) {
  return !isGetContentOfReplyMsg ? (
    <span
      className="reactionButton reactionButton--myReaction _sendReaction _showDescription"
      aria-label="Remove component reaction"
      data-reactiontype="yes"
      onClick={() => handleReaction(component, message._id, value.reaction.reaction_tag)}
    >
      <img
        src={getEmoji(configEmoji.REACTION[value.reaction.reaction_tag].image)}
        alt={value.reaction.reaction_tag}
        className="reactionButton__emoticon"
      />
      <span className="reactionButton__count _reactionCount">{value.count}</span>
    </span>
  ) : (
    <span
      className="reactionButton reactionButton--myReaction _sendReaction _showDescription"
      aria-label="Remove component reaction"
      data-reactiontype="yes"
    >
      <img
        src={getEmoji(configEmoji.REACTION[value.reaction.reaction_tag].image)}
        alt={value.reaction.reaction_tag}
        className="reactionButton__emoticon"
      />
      <span className="reactionButton__count _reactionCount">{value.count}</span>
    </span>
  );
}

function handleEmoji(e) {
  handlersMessage.actionFunc.addEmoji(e.target.alt);
}
