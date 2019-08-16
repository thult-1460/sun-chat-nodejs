'use trict';

import React from 'react';
import { Avatar, List } from 'antd';
import configEmoji from '../../config/emoji';
import InfiniteScroll from 'react-infinite-scroller';
import { getUserAvatarUrl, getEmoji } from './../../helpers/common';
import { room } from '../../config/room';
import avatarConfig from '../../config/avatar';
import handlersMessage from './../handlersMessage';
import ModalSetNicknames from '../../components/modals/room/ModalSetNicknames';

export function generateListTo(component) {
  const { t, allMembers, roomInfo } = component.props;
  const currentUserInfo = component.props.userContext.info;
  const content =
    allMembers == [] ? (
      <span>{t('not_data')}</span>
    ) : (
      <React.Fragment>
        <div className="member-infinite-container">
          {roomInfo.type == room.ROOM_TYPE.GROUP_CHAT && (
            <a className="form-control to-all" href="javascript:;" onClick={handlersMessage.actionFunc.toAll}>
              <span>{t('to_all')}</span>
            </a>
          )}
          <InfiniteScroll initialLoad={false} pageStart={0} loadMore={component.handleInfiniteOnLoad} useWindow={false}>
            <List
              dataSource={allMembers}
              renderItem={member => {
                return member._id != currentUserInfo._id ? (
                  <List.Item key={member._id}>
                    <List.Item.Meta
                      avatar={<Avatar size={avatarConfig.AVATAR.SIZE.SMALL} src={getUserAvatarUrl(member.avatar)} />}
                      title={
                        <a onClick={handlersMessage.actionFunc.toMember} href="javascript:;" data-mid={member._id}>
                          {member.nickname ? member.nickname.nickname : member.name}
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
        <ModalSetNicknames hidePopoverTo={component.hidePopoverTo} members={allMembers} />
      </React.Fragment>
    );

  return content;
}
