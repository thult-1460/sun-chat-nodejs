import React from 'react';
import { Layout, Icon, Menu, Avatar, message, Typography, Dropdown, List, Button } from 'antd';
import InfiniteScroll from 'react-infinite-scroller';
import { checkExpiredToken, saveSizeComponentsChat } from './../../helpers/common';
import { getListRoomsByUser, getQuantityRoomsByUserId, togglePinnedRoom } from './../../api/room';
import { Link } from 'react-router-dom';
import config from './../../config/listRoom';
import { room } from './../../config/room';
import { withNamespaces } from 'react-i18next';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';
import { withRouter } from 'react-router';
import { getRoomAvatarUrl, getUserAvatarUrl } from './../../helpers/common';
import avatarConfig from './../../config/avatar';
import { Resizable } from 're-resizable';
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
    selected_room: null,
  };

  fetchData = (page, filter_type, resetListRooms = false) => {
    getListRoomsByUser(page, filter_type).then(res => {
      this.setState({
        rooms: resetListRooms ? res.data : [...this.state.rooms, ...res.data],
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
    let sideBarDOM = document.getElementsByClassName('side-bar')[0];

    if (sideBarDOM) {
      sideBarDOM.style.removeProperty('width');
      sideBarDOM.style.removeProperty('min-width');
      sideBarDOM.style.removeProperty('max-width');
    }

    this.setState({ selected_room: this.props.match.params.id });

    if (checkExpiredToken()) {
      const { page, filter_type } = this.state;

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
        this.addToListRooms(newRoom, this.state.filter_type);
      });

      socket.on('remove_from_list_rooms', res => {
        this.setState({
          rooms: this.state.rooms.filter(function(value, index, arr) {
            return value._id != res.roomId;
          }),
        });

        if (this.state.selected_room == res.roomId) {
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

      socket.on('update_mychat_info', res => {
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

      socket.on('update_list_rooms_when_receive_msg', res => {
        let room = this.getRoomById(this.state.rooms, res.room._id);

        if (room) {
          room.last_created_msg = res.room.last_created_msg;

          if (res.sender != this.props.userContext.info._id) {
            room.quantity_unread = res.room.quantity_unread;
          }

          this.setState({ rooms: this.state.rooms.sort(this.compareRoom) });
        } else {
          this.addToListRooms(res.room, this.state.filter_type);
        }
      });

      socket.on('update_quantity_unread', res => {
        let room = this.getRoomById(this.state.rooms, res.room_id);

        if (room) {
          room.quantity_unread = res.quantity_unread;
          this.forceUpdate();
        }
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

    this.fetchData(page, filter_type, true);

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

  getRoomById = (rooms, roomId) => {
    for (let i = rooms.length - 1; i >= 0; i--) {
      if (rooms[i]._id === roomId) {
        return rooms[i];
      }
    }

    return null;
  };

  addToListRooms = (newRoom, filter_type) => {
    let { rooms } = this.state;
    let indexUnpinned = -1;

    for (var i = 0; i < rooms.length; i++) {
      if (rooms[i].pinned == false) {
        indexUnpinned = i;
        break;
      }
    }

    const {hasMore, quantity_chats} = this.state;

    if (hasMore !== true || indexUnpinned !== -1 || newRoom.pinned === true) {
      if (newRoom.pinned === true) {
        if (
          filter_type === config.FILTER_TYPE.LIST_ROOM.PINNED.VALUE ||
          filter_type === config.FILTER_TYPE.LIST_ROOM.ALL.VALUE ||
          (filter_type === config.FILTER_TYPE.LIST_ROOM.GROUP.VALUE &&
            newRoom.type === room.ROOM_TYPE.GROUP_CHAT) ||
          (filter_type === config.FILTER_TYPE.LIST_ROOM.DIRECT.VALUE &&
            newRoom.type === room.ROOM_TYPE.DIRECT_CHAT) ||
          (filter_type === config.FILTER_TYPE.LIST_ROOM.UNREAD.VALUE &&
            newRoom.quantity_unread > 0)
        ) {
          rooms.splice(0, 0, newRoom);

          if (hasMore === true) rooms.splice(rooms.length - 1, 1);
        }
      } else {
        if (indexUnpinned === -1) {
          rooms.push(newRoom);
        } else {
          rooms.splice(indexUnpinned, 0, newRoom);

          if (quantity_chats % config.LIMIT_ITEM_SHOW.ROOM === 0) { this.setState({hasMore: true}); }
          if (quantity_chats >= config.LIMIT_ITEM_SHOW.ROOM) { rooms.splice(rooms.length - 1, 1); }
        }
      }

      this.setState({rooms});
    }
  };

  compareRoom = (a, b) => {
    let comparison = 0;

    if (a.pinned > b.pinned) {
      comparison = -1;
    } else if (a.pinned < b.pinned) {
      comparison = 1;
    } else {
      if (a.last_created_msg > b.last_created_msg) {
        comparison = -1;
      } else if (a.last_created_msg < b.last_created_msg) {
        comparison = 1;
      } else {
        if (a._id > b._id) {
          comparison = -1;
        } else if (a._id < b._id) {
          comparison = 1;
        } else {
          comparison = 0;
        }
      }
    }

    return comparison;
  };

  setWidthChatBox = () => {
    saveSizeComponentsChat();
  };

  render() {
    const { rooms } = this.state;
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
      rooms.map((item, index) => {
        return (
          <List.Item
            key={index}
            className={item._id == this.state.selected_room ? 'item-active' : ''}
            data-room-id={item._id}
            onClick={this.updateSelectedRoom}
          >
            <Link to={`/rooms/${item._id}`}>
              <div className="avatar-name">
                <Avatar
                  className={
                    item.type === room.ROOM_TYPE.DIRECT_CHAT
                      ? `_avatar _avatar_Uid_${item.members}`
                      : `_avatar _avatar_Rid_${item._id}`
                  }
                  size={avatarConfig.AVATAR.SIZE.MEDIUM}
                  src={
                    item.type === room.ROOM_TYPE.GROUP_CHAT
                      ? getRoomAvatarUrl(item.avatar)
                      : getUserAvatarUrl(item.avatar)
                  }
                />
                &nbsp;&nbsp;
                <span className="nav-text">{item.name}</span>
              </div>
              <div className="state-room">
                {item.quantity_unread > 0 && <Typography.Text mark>{item.quantity_unread}</Typography.Text>}
                <Button className={item.pinned ? 'pin pinned' : 'pin'} onClick={this.handlePinned} value={item._id}>
                  <Icon type="pushpin" />
                </Button>
              </div>
            </Link>
          </List.Item>
        );
      });

    let minW = config.MIN_WIDTH * window.innerWidth;
    let maxW = config.MAX_WIDTH * window.innerWidth;

    return (
      checkExpiredToken() && (
        <Resizable
          enable={{ right: true }}
          minWidth={minW}
          maxWidth={maxW}
          onResizeStop={this.setWidthChatBox}
          defaultSize={{
            width: localStorage.getItem('sideBarW') ? localStorage.getItem('sideBarW') : (minW + maxW) / 2,
          }}
        >
          <Sider className="side-bar">
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
        </Resizable>
      )
    );
  }
}

export default withRouter(withNamespaces(['listRoom'])(withUserContext(Sidebar)));
