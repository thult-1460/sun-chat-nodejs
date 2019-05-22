import React from 'react';
import { Layout, Icon, Menu, Avatar, message, Typography } from 'antd';
import InfiniteScroll from 'react-infinite-scroller';
import { checkExpiredToken } from './../../helpers/common';
import { getListRoomsByUser, getAllRoomsByUserNumber } from './../../api/room';
import { Link } from 'react-router-dom';
import { withNamespaces } from 'react-i18next';
const { Sider } = Layout;

class Sidebar extends React.Component {
  state = {
    rooms: [],
    error: '',
    loading: false,
    hasMore: true,
    page: 1,
    numberAllData: 0,
  };

  fetchData = page => {
    getListRoomsByUser(page).then(res => {
      this.setState({
        rooms: res.data,
        page: page,
        loading: false,
      });
    });
  };

  componentDidMount() {
    const { page } = this.state;
    this.fetchData(page);

    getAllRoomsByUserNumber().then(res => {
      this.setState({
        numberAllData: res.data.result,
      });
    });
  }

  handleInfiniteOnLoad = () => {
    let { page, data, numberAlldata } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (data.length >= numberAlldata) {
      message.warning(this.props.t('notice.action.end_of_list'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage);
  };

  render() {
    const { rooms } = this.state;

    let renderHtml =
      rooms.length > 0 &&
      rooms.map((room, key) => {
        return (
          <Menu.Item key={key}>
            <Link to={'/room/' + room._id}>
              <Avatar src={room.avatar_url} />
              &nbsp;&nbsp;
              <span className="nav-text">{room.name}</span>
              {room.marked && <Icon type="pushpin" />}
              {room.quantity_unread > 0 && <Typography.Text mark>{room.quantity_unread}</Typography.Text>}
            </Link>
          </Menu.Item>
        );
      });

    return (
      checkExpiredToken() && (
        <Sider>
          <div className="logo2" />
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
