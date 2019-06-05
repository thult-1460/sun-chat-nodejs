import React from 'react';
import { Layout, Icon, Menu, Avatar, message, Typography, Dropdown, List, Button } from 'antd';
import InfiniteScroll from 'react-infinite-scroller';
import { checkExpiredToken } from './../../helpers/common';
import { getListRoomsByUser, getQuantityRoomsByUserId, togglePinnedRoom } from './../../api/room';
import { Link } from 'react-router-dom';
import config from './../../config/listRoom';
import { withNamespaces } from 'react-i18next';
import Loading from '../Loading';
import { SocketContext } from './../../context/SocketContext';
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
    filter_flag: 0,
    selected_room: '',
  };

  fetchData = param => {
    getListRoomsByUser(param).then(res => {
      this.setState({
        rooms: res.data,
        page: param.page,
        loading: false,
      });
    });
  };

  componentDidMount() {
    if (checkExpiredToken()) {
      const { page } = this.state;
      const filter_type = config.FILTER_TYPE.LIST_ROOM.ALL.VALUE;
      this.fetchData({ page, filter_type });

      getQuantityRoomsByUserId(filter_type).then(res => {
        this.setState({
          quantity_chats: res.data.result,
        });
      });

      const socket = this.context;
      socket.on('update_list_room', () => {});
      socket.on('add_room', () => {});
      socket.on('edit_room', () => {});
      socket.on('delete_room', () => {});
    }
  }

  handleInfiniteOnLoad = () => {
    let { page, data, quantity_chats } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (data.length >= quantity_chats) {
      message.warning(this.props.t('notice.action.end_of_list'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage);
  };

  onClick = e => {
    const filter_type = e.item.props.flag;

    this.setState({
      loading: true,
      page: 1,
      filter_flag: filter_type,
    });

    const { page } = this.state;
    this.fetchData({ page, filter_type });

    getQuantityRoomsByUserId(filter_type).then(res => {
      this.setState({
        quantity_chats: res.data.result,
      });
    });
  };

  handlePinned = e => {
    const page = 1;
    const { rooms } = this.state;
    let roomId = e.target.value;

    togglePinnedRoom(roomId).then(res => {
      this.fetchData(page);
    });
  };

  updateSelectedRoom = e => {
    this.setState({ selected_room: e.currentTarget.getAttribute('data-room-id') });
  };

  render() {
    const { rooms, loading } = this.state;
    const { t } = this.props;
    const list_flag = config.FILTER_TYPE.LIST_ROOM;
    const active = 'ant-dropdown-menu-item-selected';
    let selected_content,
      condFilter = [];

    for (let index in list_flag) {
      condFilter.push(
        <Menu.Item
          key={list_flag[index].VALUE}
          flag={list_flag[index].VALUE}
          className={this.state.filter_flag === list_flag[index].VALUE ? active : ''}
        >
          {t(list_flag[index].TITLE)}
        </Menu.Item>
      );

      if (list_flag[index].VALUE == this.state.filter_flag) {
        selected_content = t(list_flag[index].TITLE);
      }
    }
    const cond_filter = <Menu onClick={this.onClick.bind(this.context)}>{condFilter}</Menu>;

    let renderHtml =
      rooms.length > 0 &&
      rooms.map(room => {
        return (
          <List.Item
            key={room._id}
            className={room._id == this.state.selected_room ? 'item-active' : ''}
            data-room-id={room._id}
            onClick={this.updateSelectedRoom}
          >
            <Link to={'/room/' + room._id}>
              <div className="avatar-name">
                <Avatar src={room.avatar} />
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
            {loading && <Loading />}
            <Dropdown overlay={cond_filter}>
              <a className="ant-dropdown-link" href="#">
                {selected_content}
                <Icon type="filter" />
              </a>
            </Dropdown>
          </div>
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
            <div>
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

export default withNamespaces(['listRoom'])(Sidebar);
