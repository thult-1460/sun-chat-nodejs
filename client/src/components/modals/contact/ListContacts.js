import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, message, Spin, Alert, Input } from 'antd';
import { getListContacts, deleteContact } from '../../../api/contact';

class ListContacts extends Component {
  state = {
    contacts: [],
    error: '',
    loading: false,
    hasMore: true,
    page: 1,
    totalContact: 0,
    searchText: '',
  };

  fetchData = (page, searchText) => {
    getListContacts(page, searchText)
      .then(res => {
        const { contacts } = this.state;
        res.data.result.map(item => {
          contacts.push(item);
        });
        this.setState({
          contacts,
          page,
          loading: false,
          searchText,
        });
        if (res.data.totalContact.length !== 0) {
          this.setState({
            totalContact: res.data.totalContact,
          });
        }
      })
      .catch(error => {
        this.setState({
          error: error.response.data.error,
        });
      });
  };

  componentDidMount() {
    const { page, searchText } = this.state;
    this.fetchData(page, searchText);
  }

  handleInfiniteOnLoad = () => {
    const { t } = this.props;
    let { page, contacts, totalContact, searchText } = this.state;
    const newPage = parseInt(page) + 1;
    this.setState({
      loading: true,
    });

    if (contacts.length >= totalContact) {
      message.warning(t('contact:list_contact.loaded_all'));
      this.setState({
        hasMore: false,
        loading: false,
      });
      return;
    }

    this.fetchData(newPage, searchText);
  };

  setAvatar(avatar) {
    if (avatar) {
      return <Avatar src={avatar} />;
    }

    return <Avatar icon="user" size="large" />;
  }

  handleDeteleContact = e => {
    const contactId = e.target.value;
    deleteContact({ contactId })
      .then(res => {
        this.setState(prevState => ({
          contacts: prevState.contacts.filter(item => item._id != contactId),
          totalContact: prevState.totalContact - 1,
        }));
        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  handleSearch(searchText) {
    let page = 1;

    this.setState({
      contacts: [],
      page,
      loading: true,
      hasMore: true,
    });

    this.fetchData(page, searchText);
  }

  render() {
    const { t } = this.props;
    const { error } = this.state;
    const Search = Input.Search;

    return (
      <React.Fragment>
        <h2 className="title-contact">
          {t('contact:list_contact.title_list_contact')} ({this.state.totalContact})
        </h2>
        <Search
          placeholder="input search text"
          enterButton="Search"
          size="large"
          onSearch={searchText => this.handleSearch(searchText)}
        />
        {this.state.contacts.length > 0 ? (
          <div>
            {error && <Alert message={t('user:error_title')} type="error" description={error} />}
            <div className="infinite-container">
              <InfiniteScroll
                initialLoad={false}
                pageStart={0}
                loadMore={this.handleInfiniteOnLoad}
                hasMore={!this.state.loading && this.state.hasMore}
                useWindow={false}
              >
                <List
                  dataSource={this.state.contacts}
                  renderItem={item => (
                    <List.Item key={item._id}>
                      <List.Item.Meta
                        avatar={this.setAvatar(item.avatar)}
                        title={<a href="#">{item.name}</a>}
                        description={item.email}
                      />
                      <Button.Group className="btn-accept">
                        <Button type="primary">{t('contact:list_contact.btn_send_message')}</Button>
                        <Button value={item._id} onClick={this.handleDeteleContact}>
                          {t('button.delete')}
                        </Button>
                      </Button.Group>
                    </List.Item>
                  )}
                >
                  {this.state.loading && this.state.hasMore && (
                    <div className="demo-loading-container">
                      <Spin />
                    </div>
                  )}
                </List>
              </InfiniteScroll>
            </div>
          </div>
        ) : (
          <div className="title-contact">{t('contact:list_contact.no_contact')}</div>
        )}
      </React.Fragment>
    );
  }
}

export default withNamespaces(['user', 'contact'])(withRouter(ListContacts));
