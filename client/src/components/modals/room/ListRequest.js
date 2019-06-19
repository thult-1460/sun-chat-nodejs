import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, Checkbox, Spin, message, Alert } from 'antd';
import { getRequests, getNumberOfRequests, rejectRequests, acceptRequests } from '../../../api/room';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { SocketContext } from '../../../context/SocketContext';
import { getUserAvatarUrl } from './../../../helpers/common';
const CheckboxGroup = Checkbox.Group;

class ListRequest extends React.Component {
  static contextType = SocketContext;

  state = {
    data: [],
    error: '',
    loading: false,
    hasMore: true,
    checkedList: [],
    checkAll: false,
    indeterminate: false,
    allItem: [],
    page: 1,
    numberRequests: 0,
  };

  fetchData = page => {
    const roomId = this.props.match.params.id;

    getRequests(roomId, page).then(res => {
      const { data, allItem } = this.state;
      res.data.result.map(item => {
        allItem.push(item._id);
        data.push(item);
      });
      this.setState({
        data: data,
        allItem: allItem,
        page: page,
        loading: false,
      });
    });
  };

  componentDidMount() {
    const { page } = this.state;
    const roomId = this.props.match.params.id;

    this.fetchData(roomId, page);

    getNumberOfRequests(roomId).then(res => {
      this.setState({
        numberRequests: res.data.result,
      });
    });

    const { socket } = this.context;
    socket.on('update_request_join_room_number', numberRequests => {
      this.setState({
        numberRequests: numberRequests,
      });
    });

    socket.on('remove_from_list_request_join_room', requestIds => {
      requestIds.map(idCheck => {
        this.setState(prevState => ({
          data: prevState.data.filter(item => item._id != idCheck),
          allItem: prevState.allItem.filter(item => item != idCheck),
          checkedList: prevState.checkedList.filter(item => item != idCheck),
        }));
      });
      this.setState({ indeterminate: this.state.checkedList.length > 0 });
    });

    socket.on('add_to_list_request_join_room', newRequest => {
      this.setState({
        data: [newRequest, ...this.state.data],
        allItem: [newRequest._id, ...this.state.data],
      });
    });
  }

  onChange = checkedList => {
    const { allItem } = this.state;
    this.setState({
      checkedList,
      indeterminate: checkedList.length && checkedList.length < allItem.length,
      checkAll: checkedList.length === allItem.length,
    });
  };

  onCheckAllChange = e => {
    const { allItem } = this.state;
    this.setState({
      checkedList: e.target.checked ? allItem : [],
      indeterminate: false,
      checkAll: e.target.checked,
    });
  };

  handleInfiniteOnLoad = () => {
    let { page, data, numberRequests } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (data.length >= numberRequests) {
      message.warning(this.props.t('contact:list_contact_request.loaded_all'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage);
  };

  handleRejectRequest = e => {
    const roomId = this.props.match.params.id;
    let dataInput = {};
    let newData = [];
    const { data, numberRequests } = this.state;

    // If check all
    dataInput = {
      requestIds: e.target.value == 0 ? this.state.checkedList : [e.target.value],
    };

    if (dataInput.requestIds.length > 0) {
      rejectRequests(roomId, dataInput)
        .then(res => {
          message.success(res.data.message);
        })
        .catch(error => {
          this.setState({
            error: error.response.data.error,
          });
        });
    }
  };

  handleAcceptRequest = e => {
    const roomId = this.props.match.params.id;
    const requestIds = e.target.value == 0 ? this.state.checkedList : [e.target.value];
    let dataInput = {};

    dataInput = {
      requestIds: requestIds,
    };

    acceptRequests(roomId, dataInput)
      .then(res => {
        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  render() {
    const { t } = this.props;
    const { error } = this.state;

    return (
      <React.Fragment>
        <h2 className="title-contact">
          {t('room:request.title')} ({this.state.numberRequests})
        </h2>
        {this.state.data.length > 0 ? (
          <div>
            {error && <Alert message={t('error_title')} type="error" description={error} />}
            <div className="infinite-container">
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.state.loading && this.state.hasMore}
                useWindow={false}
              >
                <CheckboxGroup onChange={this.onChange} value={this.state.checkedList}>
                  <List
                    dataSource={this.state.data}
                    renderItem={item => (
                      <List.Item key={item._id}>
                        <Checkbox value={item._id} className="item-checkbox" key={item._id} />
                        <List.Item.Meta
                          avatar={<Avatar src={getUserAvatarUrl(item.avatar)} />}
                          title={<a href="https://ant.design">{item.name}</a>}
                          description={item.email}
                        />

                        <Button.Group className="btn-accept">
                          <Button value={item._id} onClick={this.handleRejectRequest}>
                            {t('button.delete')}
                          </Button>
                          <Button type="primary" value={item._id} onClick={this.handleAcceptRequest}>
                            {t('button.accept')}
                          </Button>
                        </Button.Group>
                      </List.Item>
                    )}
                  >
                    {this.state.loading && this.state.hasMore && (
                      <div className="demo-loading-container">
                        <Spin tip="Loading..." />
                      </div>
                    )}
                  </List>
                </CheckboxGroup>
              </InfiniteScroll>
            </div>
            <div className="contact-check-all">
              <Checkbox
                indeterminate={this.state.indeterminate}
                onChange={this.onCheckAllChange}
                checked={this.state.checkAll}
              >
                {t('button.check_all')}
              </Checkbox>
              <Button.Group className="btn-all-accept">
                <Button value="0" onClick={this.handleRejectRequest}>
                  {t('button.delete')}
                </Button>
                <Button type="primary" onClick={this.handleAcceptRequest}>
                  {t('button.accept')}
                </Button>
              </Button.Group>
            </div>
          </div>
        ) : (
          <div className="title-contact"> {t('contact:request.no_data')}</div>
        )}
      </React.Fragment>
    );
  }
}

export default withNamespaces(['user', 'contact', 'room'])(withRouter(ListRequest));
