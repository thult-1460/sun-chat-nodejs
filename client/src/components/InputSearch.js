import React, { Component } from 'react';
import { Input, List, Avatar } from 'antd';
import { Link } from 'react-router-dom';
import config from './../config/listRoom';
import { getListRoomsBySubName } from './../api/room';
import { getRoomAvatarUrl } from './../helpers/common';

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

  seachName = e => {
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

  render() {
    var name = [],
      regex = new RegExp(`(.*)(${this.state.subName})(.*)`, 'i');

    return (
      <div ref={node => (this.node = node)}>
        <Input.Search
          placeholder="Search name here !"
          onChange={this.seachName}
          onClick={this.seachName}
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
                    avatar={<Avatar src={getRoomAvatarUrl(item.avatar)} />}
                    title={
                      <Link to={`/rooms/${item._id}`}>
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
