import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col } from 'antd';
import { loadMessages, sendMessage } from './../../api/room.js';
import { SocketContext } from './../../context/SocketContext';
import { withNamespaces } from 'react-i18next';
import moment from 'moment';

const { Content } = Layout;

class ChatBox extends React.Component {
  static contextType = SocketContext;

  state = {
    messages: [],
  };

  componentDidMount() {
    const roomId = this.props.match.params.id;

    loadMessages(roomId).then(res => {
      this.setState({
        messages: res.data.messages,
      });
    });

    // Listen 'send_new_msg' event from server
    const socket = this.context.socket;
    socket.on('send_new_msg', res => {
      const messages = this.state.messages;
      messages.push(res.message);

      this.setState({
        messages: messages,
      });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId !== this.props.roomId) {
      loadMessages(this.props.roomId).then(res => {
        this.setState({
          messages: res.data.messages,
        });
      });
    }
  }

  formatMsgTime(timeInput) {
    const { t } = this.props;
    const time = new Date(timeInput);

    return moment(time).format(t('format_time'));
  }

  handleSendMessage = e => {
    if (e.key == undefined || e.key == 'Enter') {
      const roomId = this.props.match.params.id;
      const msgElement = document.getElementById('msg-content');
      let data = {
        content: msgElement.value,
      };
      if (msgElement.value !== '') {
        sendMessage(roomId, data).then(res => {
          msgElement.value = '';
        });
      }
    }
  };

  render() {
    const { t } = this.props;

    return (
      <Content className="chat-room">
        <div className="list-message">
          {this.state.messages.map(message => (
            <Row key={message._id}>
              <Col span={22}>
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={message.user_info.avatar} />}
                    title={<p>{message.user_info.name}</p>}
                    description={message.content}
                  />
                </List.Item>
              </Col>
              <Col span={2} className="message-time">
                <h4> {this.formatMsgTime(message.updatedAt)} </h4>
              </Col>
              <hr />
            </Row>
          ))}
        </div>
        <div className="box-button">
          <Button type="link" size={'small'}>
            {t('to')}
          </Button>
          <Button style={{ float: 'right' }} type="primary" onClick={this.handleSendMessage}>
            {t('send')}
          </Button>
        </div>
        <Input.TextArea
          placeholder={t('type_msg')}
          rows={4}
          style={{ resize: 'none' }}
          id="msg-content"
          onKeyDown={this.handleSendMessage}
        />
      </Content>
    );
  }
}

export default withNamespaces(['message'])(withRouter(ChatBox));
