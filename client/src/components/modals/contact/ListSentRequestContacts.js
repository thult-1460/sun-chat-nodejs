import React from 'react';
import 'antd/dist/antd.css';
import InfiniteScroll from 'react-infinite-scroller';
import { getListSentRequestContacts, deleteSentRequestContact } from '../../../api/contact';
import { List, Avatar, Button, Form, message } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import '../../../scss/contact.scss';
import { SocketContext } from './../../../context/SocketContext';
import { getUserAvatarUrl } from './../../../helpers/common';

class ListSentRequestContacts extends React.Component {
  static contextType = SocketContext;

  state = {
    data: [],
    loading: false,
  };

  fetchData = () => {
    getListSentRequestContacts()
      .then(res => {
        let { data } = this.state;
        data = data.concat(res.data.result);
        this.setState({
          data,
          loading: false,
        });
      })
      .catch(err => {
        this.setState({
          loading: false,
        });
      });
  };

  componentDidMount() {
    this.fetchData();

    const { socket } = this.context;
    socket.on('add_to_list_sent_requests', res => {
      this.setState(previousState => ({
        data: [...previousState.data, res]
      }));
    });

    socket.on('remove_from_list_sent_requests', res => {
      this.setState({data: this.state.data.filter(function(person) {
          return person._id !== res
        })});
    });
  }

  handleCancelRequest = e => {
    const requestSentContactId = e.target.value;
    deleteSentRequestContact({ requestSentContactId })
      .then(res => {
        message.success(res.data.success);
      })
      .catch(error => {
        this.setState({
          error: error.response.data.error,
        });
      });
  };

  render() {
    const { t } = this.props;

    return (
      <React.Fragment>
        {this.state.data.length > 0 ? (
          <div className="search-by-name">
            <div className="infinite-container">
                <List
                  dataSource={this.state.data}
                  renderItem={item => (
                    <List.Item key={item._id}>
                      <List.Item.Meta
                        avatar={<Avatar src={getUserAvatarUrl(item.avatar)} />}
                        title={item.name}
                        description={item.email}
                      />
                        <Button
                          type="primary"
                          value={item._id}
                          htmlType="submit"
                          onClick={this.handleCancelRequest}
                        >
                          {t('contact:send_request_contact.button_cancel')}
                        </Button>
                    </List.Item>
                  )}
                />
            </div>
          </div>
        ) : (
          <div className="title-contact">{t('contact:sent_request_contact.no_request_sent_contact')}</div>
        )}
      </React.Fragment>
    );
  }
}

ListSentRequestContacts = Form.create()(ListSentRequestContacts);

export default withRouter(withNamespaces(['auth', 'contact'])(ListSentRequestContacts));
