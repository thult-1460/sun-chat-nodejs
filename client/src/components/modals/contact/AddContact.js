import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { List, Avatar, Button, Form, Icon, Input, Tabs, message, Alert } from 'antd';
import { getSearchContactByName, addContact, rejectContact, acceptContact } from '../../../api/contact';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import '../../../scss/contact.scss';
import { SocketContext } from './../../../context/SocketContext';
const FormItem = Form.Item;
const TabPane = Tabs.TabPane;

class AddContact extends React.Component {
  static contextType = SocketContext;

  state = {
    data: [],
    error: '',
    errors: {},
    page: 1,
    hasMore: true,
    loading: false,
    isLoading: false,
    searchText: '',
  };

  rules = {
    search_text: {
      validateFirst: true,
      rules: [{ required: true, message: this.props.t('contact:send_request_contact.required_search_user') }],
    },
  };

  fetchData = (page, searchText) => {
    getSearchContactByName(searchText, page)
      .then(res => {
        const { data } = this.state;
        res.data.result.map(item => {
          data.push(item);
        });
        this.setState({
          data,
          page,
          loading: false,
          searchText,
        });
      })
      .catch(err => {
        const { data: errors } = err.response;
        const { error = '' } = errors;

        this.setState({
          error,
          errors: error ? {} : errors,
          isLoading: false,
        });
      });
  };

  onSubmitSearchName = e => {
    e.preventDefault();
    const page = 1;
    const searchText = this.props.form.getFieldValue('search_text');
    this.setState({ isLoading: true, data: [] });
    this.props.form.validateFields((err, values) => {
      if (err) {
        return;
      }

      this.fetchData(page, searchText);
    });
  };

  updateNumberContactRequest = userId => {
    const socket = this.context;
    socket.emit('update_request_friend_count', userId);
  };

  addContact = e => {
    const userId = e.target.value;
    const { data } = this.state;

    addContact({ userId })
      .then(res => {
        data.map(item => {
          if (item._id == userId) {
            item['flagSendContact'] = true;
          }
        });
        this.setState({
          data: data,
        });
        this.updateNumberContactRequest(userId);

        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  loadContactMore = () => {
    const page = this.state.page;
    let newPage = page + 1;
    this.fetchData(newPage, this.state.searchText);
  };

  handleRejectContact = e => {
    let dataInput = {};

    dataInput = {
      rejectContactIds: [e.target.value],
    };

    if (dataInput.rejectContactIds.length > 0) {
      rejectContact(dataInput)
        .then(res => {
          dataInput['rejectContactIds'].map(checkedId => {
            this.setState(prevState => ({
              data: prevState.data.filter(item => item._id != checkedId),
              numberContacts: prevState.numberContacts - 1,
            }));
          });
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
            data: prevState.data.filter(item => item._id != idCheck),
            numberContacts: prevState.numberContacts - 1,
          }));
        });
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  render() {
    const { error, errors } = this.state;
    const { form, t } = this.props;

    return (
      <React.Fragment>
        <h2 className="title-contact">{t('contact:send_request_contact.title')}</h2>
        <Tabs defaultActiveKey="1">
          <TabPane
            tab={
              <span>
                <Icon type="user" />
                {t('contact:send_request_contact.description')}
              </span>
            }
            key="1"
          >
            <div className="contact-search">
              <Form layout="horizontal" onSubmit={this.onSubmitSearchName}>
                {error && <Alert message="Error" type="error" description={error} />}
                <FormItem
                  help={
                    form.getFieldError('search_text') ? (
                      form.getFieldError('search_text')
                    ) : errors && errors.search_text ? (
                      <span className="error-message-from-server">{errors.search_text}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('search_text', this.rules.search_text)(
                    <Input
                      prefix={<Icon type="search" className="icon_input" />}
                      type="text"
                      placeholder={t('contact:send_request_contact.input_search')}
                      onKeyUp={this.onSubmitSearchName}
                    />
                  )}

                  <Button type="primary" htmlType="submit" shape="circle" icon="search" />
                </FormItem>
              </Form>
            </div>
            {this.state.data.length > 0 ? (
              <div className="search-by-name">
                {error && <Alert message={t('error_title')} type="error" description={error} />}
                <div className="infinite-container">
                  <InfiniteScroll
                    initialLoad={false}
                    pageStart={0}
                    loadMore={this.loadContactMore}
                    hasMore={!this.state.loading && this.state.hasMore}
                    useWindow={false}
                  >
                    <List
                      dataSource={this.state.data}
                      renderItem={item => (
                        <List.Item key={item._id}>
                          <List.Item.Meta
                            avatar={<Avatar src={item.avatar} />}
                            title={item.name}
                            description={item.email}
                          />
                          {item.flagSendContact ? (
                            ''
                          ) : item.flagRequestContact ? (
                            <Button.Group className="btn-accept">
                              <Button value={item._id} onClick={this.handleRejectContact}>
                                {t('user:button.delete')}
                              </Button>
                              <Button type="primary" value={item._id} onClick={this.acceptContact}>
                                {t('user:button.accept')}
                              </Button>
                            </Button.Group>
                          ) : (
                            <Button type="primary" value={item._id} htmlType="submit" onClick={this.addContact}>
                              {t('contact:send_request_contact.button_add')}
                            </Button>
                          )}
                        </List.Item>
                      )}
                    />
                  </InfiniteScroll>
                </div>
              </div>
            ) : (
              <div className="title-contact">{t('contact:send_request_contact.no_data')}</div>
            )}
          </TabPane>
        </Tabs>
      </React.Fragment>
    );
  }
}

AddContact = Form.create()(AddContact);

export default withNamespaces(['auth', 'contact'])(withRouter(AddContact));
