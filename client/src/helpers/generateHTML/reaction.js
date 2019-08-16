'use trict';

import React from 'react';
import { Avatar, Tabs, List } from 'antd';
import configEmoji from '../../config/emoji';
import { getUserAvatarUrl, getEmoji } from './../../helpers/common';
import avatarConfig from '../../config/avatar';
import InfiniteScroll from 'react-infinite-scroller';
import { reactionMsg, getReactionUserListOfMsg } from './../../api/room.js';

const { TabPane } = Tabs;

export function generateReactionMsg(component, msgId) {
  const listReaction = configEmoji.REACTION;
  const { t } = component.props;
  const content = (
    <div id="_reactionList" className="reactionSelectorTooltip">
      <ul className="reactionSelectorTooltip__emoticonList">
        {Object.entries(listReaction).map(([key, reaction]) => {
          return (
            <li className="reactionSelectorTooltip__itemContainer" key={key}>
              <span className="reactionSelectorTooltip__item">
                <span className="reactionSelectorTooltip__emoticonContainer">
                  <Avatar
                    className="reactionSelectorTooltip__emoticon image-emoji"
                    src={getEmoji(reaction.image)}
                    alt={key}
                    title={t(reaction.tooltip)}
                    onClick={() => handleReaction(component, msgId, key)}
                  />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return content;
}

export function generateReactionUserList(component, msgId, reactionOfMsg) {
  return (
    <div className="reactionUserListTollTip">
      <Tabs activeKey={component.state.activeKeyTab} onChange={component.onChangeTab}>
        {reactionOfMsg.map((value, index) => {
          return (
            <TabPane
              tab={
                <div onClick={() => fetchReactionUserList(component, msgId, value.reaction.reaction_tag)}>
                  <img
                    src={getEmoji(configEmoji.REACTION[value.reaction.reaction_tag].image)}
                    alt={value.reaction.reaction_tag}
                    className="reactionButton__emoticon"
                  />
                  <span className="reactionButton__count _reactionCount">{value.count}</span>
                </div>
              }
              key={index}
            >
              {contentReactionUserList(component, msgId, value.reaction.reaction_tag)}
            </TabPane>
          );
        })}
      </Tabs>
    </div>
  );
}

function contentReactionUserList(component, msgId, reactionTag) {
  let { reactionUserList } = component.state;
  let content = '';

  if (reactionUserList[`${msgId}-${reactionTag}`]) {
    content = (
      <div className="member-infinite-container">
        <InfiniteScroll initialLoad={false} pageStart={0} loadMore={component.handleInfiniteOnLoad} useWindow={false}>
          <List
            dataSource={reactionUserList[`${msgId}-${reactionTag}`]}
            renderItem={user => {
              return (
                <List.Item key={user.info_user._id}>
                  <List.Item.Meta
                    avatar={
                      <Avatar src={getUserAvatarUrl(user.info_user.avatar)} size={avatarConfig.AVATAR.SIZE.SMALL} />
                    }
                    title={user.info_user.name}
                  />
                </List.Item>
              );
            }}
          />
        </InfiniteScroll>
      </div>
    );
  }

  return content;
}

export function handleReaction(component, msgId, reactionTag) {
  const currentRoomId = component.props.roomId;
  reactionMsg(currentRoomId, { msgId, reactionTag });
}

export function fetchReactionUserList(component, msgId, reactionTag) {
  const { roomId } = component.props;
  let { reactionUserList } = component.state;

  getReactionUserListOfMsg(roomId, msgId, reactionTag).then(res => {
    reactionUserList[`${msgId}-${reactionTag}`] = res.data.list_user;

    component.setState({
      reactionUserList: reactionUserList,
    });
  });
}
