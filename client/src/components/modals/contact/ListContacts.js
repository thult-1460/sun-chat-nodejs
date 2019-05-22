import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, message, Spin, Alert } from 'antd';
import { getListContacts, getContactCount } from '../../../api/contact';

class ListContacts extends Component {
  state = {
    contacts: [],
    error: '',
    loading: false,
    hasMore: true,
    page: 1,
    totalContact: 0,
  };

  fetchData = page => {
    getListContacts(page)
      .then(res => {
        const { contacts } = this.state;
        res.data.result.map(item => {
          contacts.push(item);
        });
        this.setState({
          contacts: contacts,
          page: page,
          loading: false,
        });
      })
      .catch(error => {
        this.setState({
          error: error.response.data.error,
        });
      });
  };

  componentDidMount() {
    const { page } = this.state;
    this.fetchData(page);

    getContactCount()
      .then(res => {
        this.setState({
          totalContact: res.data.result,
        });
      })
      .catch(error => {
        this.setState({
          error: error.response.data.error,
        });
      });
  }

  handleInfiniteOnLoad = () => {
    const { t } = this.props;
    let { page, contacts, totalContact } = this.state;
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

    this.fetchData(newPage);
  };

  setAvatar(avatar) {
    if (avatar) {
      return <Avatar src={avatar} />;
    }

    return <Avatar icon="user" size="large" />;
  }

  render() {
    const { t } = this.props;
    const { error } = this.state;

    return (
      <React.Fragment>
        <h2 className="title-contact">
          {t('contact:list_contact.title_list_contact')} ({this.state.totalContact})
        </h2>
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
                        avatar={this.setAvatar(item.members[0].user.avatar)}
                        title={<a href="https://ant.design">{item.members[0].user.name}</a>}
                        description={item.members[0].user.email}
                      />
                      <Button.Group className="btn-accept">
                        <Button type="primary">{t('contact:list_contact.btn_send_message')}</Button>
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
