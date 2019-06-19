import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, Checkbox, Spin, message, Alert } from 'antd';
import { getContactRequest, getNumberContactRequest, rejectContact, acceptContact } from '../../../api/contact';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { SocketContext } from './../../../context/SocketContext';
import { getUserAvatarUrl } from './../../../helpers/common';
const CheckboxGroup = Checkbox.Group;

class ListContactRequest extends React.Component {
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
    numberContacts: 0,
  };

  fetchData = page => {
    getContactRequest(page).then(res => {
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
    this.fetchData(page);

    getNumberContactRequest().then(res => {
      this.setState({
        numberContacts: res.data.result,
      });
    });

    const { socket } = this.context;
    socket.on('update_received_request_count', numberContactRequest => {
      this.setState({
        numberContacts: numberContactRequest,
      });
    });

    socket.on('add_to_list_received_requests', userId => {
      if (this.state.data.length >= this.state.numberContacts || this.state.hasMore === false) {
        this.setState(previousState => ({
          data: [...previousState.data, userId],
        }));
      }
    });

    socket.on('remove_from_list_received_requests', userIds => {
      this.setState({
        data: this.state.data.filter(person => userIds.indexOf(person._id) < 0),
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
    let { page, data, numberContacts } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (data.length >= numberContacts) {
      message.warning(this.props.t('contact:list_contact_request.loaded_all'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage);
  };

  handleRejectContact = e => {
    let dataInput = {};
    let newData = [];
    const { data, numberContacts } = this.state;

    // If check all
    dataInput = {
      rejectContactIds: e.target.value == 0 ? this.state.checkedList : [e.target.value],
    };

    if (dataInput.rejectContactIds.length > 0) {
      rejectContact(dataInput)
        .then(res => {
          dataInput['rejectContactIds'].map(checkedId => {
            this.setState(prevState => ({
              allItem: prevState.allItem.filter(item => item != checkedId),
              checkedList: prevState.checkedList.filter(item => item != checkedId),
            }));
          });
          this.setState({ indeterminate: this.state.checkedList.length > 0 });
          message.success(res.data.success);
        })
        .catch(error => {
          this.setState({
            error: error.response.data.error,
          });
        });
    }
  };

  acceptContact = e => {
    const requestId = e.target.value == 0 ? this.state.checkedList : [e.target.value];
    acceptContact(requestId)
      .then(res => {
        message.success(res.data.success);
        requestId.map(idCheck => {
          this.setState(prevState => ({
            allItem: prevState.allItem.filter(item => item != idCheck),
            checkedList: prevState.checkedList.filter(item => item != idCheck),
          }));
        });
        this.setState({ indeterminate: this.state.checkedList.length > 0 });
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
          {t('contact:request.list_title')} ({this.state.numberContacts})
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
                          <Button value={item._id} onClick={this.handleRejectContact}>
                            {t('contact:button.delete')}
                          </Button>
                          <Button type="primary" value={item._id} onClick={this.acceptContact}>
                            {t('contact:button.accept')}
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
                {t('contact:button.check_all')}
              </Checkbox>
              <Button.Group className="btn-all-accept">
                <Button value="0" onClick={this.handleRejectContact}>
                  {t('contact:button.delete')}
                </Button>
                <Button type="primary" onClick={this.acceptContact}>
                  {t('contact:button.accept')}
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

export default withRouter(withNamespaces(['auth', 'contact'])(ListContactRequest));
