import React, { Component } from 'react';
import { Input, List, Avatar } from 'antd';
import { Link } from 'react-router-dom';
import config from './../config/listRoom';
import { getListRoomsBySubName } from './../api/room';
import { getRoomAvatarUrl, getUserAvatarUrl } from './../helpers/common';
import { room } from './../config/room';
const _ = require('lodash');

export default class InputSearch extends Component {
  data = [];
  state = {
    subName: '',
    hasData: false,
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick);
  }

  searchName = e => {
    let text = e.target.value.trim();
    this.data = [];

    this.setState({
      subName: text,
      hasData: false,
    });

    if (text.length >= config.COND_SEARCH_TEXT.MIN_LENGTH) {
      getListRoomsBySubName(text).then(res => {
        this.data = res.data;
        this.setState({
          hasData: res.data.length > 0,
        });
      });
    }
  };

  handleClick = e => {
    if (!this.node.contains(e.target)) {
      this.setState({
        subName: '',
        hasData: false,
      });
    }
  };

  clickItem = () => {
    this.setState({
      subName: '',
      hasData: false,
    });
  };

  render() {
    var name = [],
      regex = new RegExp(`(.*)(${_.escapeRegExp(this.state.subName)})(.*)`, 'i');

    return (
      <div ref={node => (this.node = node)}>
        <Input.Search
          placeholder="Search name here !"
          onChange={this.searchName}
          onClick={this.searchName}
          className="ant-dropdown-link"
        />
        {this.state.hasData && (
          <List
            itemLayout="horizontal"
            dataSource={this.data}
            renderItem={item =>
              this.state.subName &&
              (name = item.name.match(regex)) && (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={
                          item.type === room.ROOM_TYPE.GROUP_CHAT
                            ? getRoomAvatarUrl(item.avatar)
                            : getUserAvatarUrl(item.avatar)
                        }
                      />
                    }
                    title={
                      <Link to={`/rooms/${item._id}`} onClick={this.clickItem}>
                        {name[1]}
                        <span>{name[2]}</span>
                        {name[3]}
                      </Link>
                    }
                  />
                </List.Item>
              )
            }
          />
        )}
      </div>
    );
  }
}
