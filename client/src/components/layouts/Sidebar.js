import React from 'react';
import { Layout, Icon, Menu, Avatar, message, Typography, Dropdown, List, Button, Spin } from 'antd';
import InfiniteScroll from 'react-infinite-scroller';
import { checkExpiredToken } from './../../helpers/common';
import { getListRoomsByUser, getQuantityRoomsByUserId, togglePinnedRoom } from './../../api/room';
import { Link } from 'react-router-dom';
import config from './../../config/listRoom';
import { ROOM_TYPE } from './../../config/room';
import { withNamespaces } from 'react-i18next';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withRouter } from 'react-router';
import { getRoomAvatarUrl, getUserAvatarUrl } from './../../helpers/common';
const { Sider } = Layout;

class Sidebar extends React.Component {
  static contextType = SocketContext;

  state = {
    rooms: [],
    error: '',
    loading: true,
    hasMore: true,
    page: 1,
    quantity_chats: 0,
    filter_type: config.FILTER_TYPE.LIST_ROOM.ALL.VALUE,
    selected_room: '',
  };

  fetchData = (page, filter_type) => {
    getListRoomsByUser(page, filter_type).then(res => {
      let { rooms } = this.state;
      res.data.map(item => {
        rooms.push(item);
      });
      this.setState({
        rooms,
        page,
        loading: false,
      });
    });
  };

  getListRoom() {
    const { socket } = this.context;
    const { filter_type, page } = this.state;
    socket.emit('get_list_room', {
      page: 0,
      filter_type,
      per_page: page * config.LIMIT_ITEM_SHOW.ROOM,
    });
  }

  componentDidMount() {
    const currentRoomId = this.props.match.params.id;

    this.setState({ selected_room: currentRoomId });

    if (checkExpiredToken()) {
      const { page, filter_type } = this.state;
      let { rooms } = this.state;

      this.fetchData(page, filter_type);

      getQuantityRoomsByUserId(filter_type).then(res => {
        this.setState({
          quantity_chats: res.data.result,
          isLoading: false,
        });
      });

      const { socket } = this.context;

      socket.on('action_room', () => {
        this.getListRoom();
      });

      socket.on('update_list_room', rooms => {
        this.setState({
          rooms: rooms,
        });
      });

      socket.on('add_to_list_rooms', newRoom => {
        let indexUnpinned = -1;

        for (var i = 0; i < rooms.length; i++) {
          if (rooms[i].pinned == false) {
            indexUnpinned = i;
            break;
          }
        }

        if (
          filter_type === config.FILTER_TYPE.LIST_ROOM.ALL.VALUE ||
          filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP.VALUE
        ) {
          indexUnpinned === -1 ? rooms.push(newRoom) : rooms.splice(indexUnpinned, 0, newRoom);
          this.setState({ rooms });
        }
      });

      socket.on('remove_from_list_rooms', res => {
        this.setState({
          rooms: this.state.rooms.filter(function(value, index, arr) {
            return value._id != res.roomId;
          }),
        });

        rooms = rooms.filter(function(value, index, arr) {
          return value._id != res.roomId;
        });

        if (currentRoomId == res.roomId) {
          this.props.history.push(`/rooms/${this.props.userContext.my_chat_id}`);
        }
      });

      socket.on('update_direct_room_info', res => {
        this.setState(prevState => ({
          rooms: prevState.rooms.map(room =>
            room._id === res._id
              ? {
                  ...room,
                  name: res.name,
                  avatar: res.avatar !== undefined ? res.avatar : room.avatar,
                }
              : room
          ),
        }));
      });

      socket.on('update_user_avatar', res => {
        this.setState(prevState => ({
          rooms: prevState.rooms.map(room =>
            room._id === res.room_mychat_id
              ? {
                  ...room,
                  avatar: res.avatar !== undefined ? res.avatar : room.avatar,
                }
              : room
          ),
        }));
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const roomId = nextProps.match.params.id;
    this.setState({ selected_room: roomId });
  }

  handleInfiniteOnLoad = () => {
    let { page, rooms, quantity_chats, filter_type } = this.state;

    page = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (rooms.length >= quantity_chats) {
      message.warning(this.props.t('notice.action.end_of_list'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(page, filter_type);
  };

  onClick = e => {
    const filter_type = e.item.props.flag;
    let page = 1;

    this.setState({
      rooms: [],
      loading: true,
      hasMore: true,
      page,
      filter_type: filter_type,
    });

    this.fetchData(page, filter_type);

    getQuantityRoomsByUserId(filter_type).then(res => {
      this.setState({
        quantity_chats: res.data.result,
      });
    });
  };

  handlePinned = e => {
    let roomId = e.target.value;

    togglePinnedRoom(roomId).then(res => {
      this.getListRoom();
    });
  };

  render() {
    const { rooms, isLoading } = this.state;
    const { t } = this.props;
    const list_flag = config.FILTER_TYPE.LIST_ROOM;
    const active = 'ant-dropdown-menu-item-selected';
    let selected_content,
      condFilter = [];

    for (let index in list_flag) {
      condFilter.push(
        <Menu.Item
          key={index}
          flag={list_flag[index].VALUE}
          className={this.state.filter_type === list_flag[index].VALUE ? active : ''}
        >
          {t(list_flag[index].TITLE)}
        </Menu.Item>
      );

      if (list_flag[index].VALUE == this.state.filter_type) {
        selected_content = t(list_flag[index].TITLE);
      }
    }
    const cond_filter = <Menu onClick={this.onClick.bind(this.context)}>{condFilter}</Menu>;

    let renderHtml =
      rooms.length > 0 &&
      rooms.map((room, index) => {
        return (
          <List.Item
            key={index}
            className={room._id == this.state.selected_room ? 'item-active' : ''}
            data-room-id={room._id}
            onClick={this.updateSelectedRoom}
          >
            <Link to={`/rooms/${room._id}`}>
              <div className="avatar-name">
                <Avatar
                  src={
                    room.type === ROOM_TYPE.GROUP_CHAT ? getRoomAvatarUrl(room.avatar) : getUserAvatarUrl(room.avatar)
                  }
                />
                &nbsp;&nbsp;
                <span className="nav-text">{room.name}</span>
              </div>
              {room.quantity_unread > 0 && <Typography.Text mark>{room.quantity_unread}</Typography.Text>}
              <Button className={room.pinned ? 'pin pinned' : 'pin'} onClick={this.handlePinned} value={room._id}>
                <Icon type="pushpin" />
              </Button>
            </Link>
          </List.Item>
        );
      });

    return (
      checkExpiredToken() && (
        <Sider>
          <div id="div-filter">
            <Dropdown overlay={cond_filter}>
              <a className="ant-dropdown-link">
                {selected_content}
                <Icon type="filter" />
              </a>
            </Dropdown>
          </div>
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <div className="sidebar-infinite-container">
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.state.loading && this.state.hasMore}
                useWindow={false}
              >
                {renderHtml}
              </InfiniteScroll>
            </div>
          </Menu>
        </Sider>
      )
    );
  }
}

export default withRouter(withNamespaces(['listRoom'])(withUserContext(Sidebar)));
