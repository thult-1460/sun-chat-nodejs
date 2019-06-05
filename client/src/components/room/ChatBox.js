import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, Button, List, Avatar, Icon, Row, Col } from 'antd';
import { getLastMessages } from './../../api/room.js';
import { SocketContext } from './../../context/SocketContext';
import { withNamespaces } from 'react-i18next';

const { Content } = Layout;

class ChatBox extends React.Component {
  static contextType = SocketContext;

  state = {
    messages: [],
  };

  componentDidMount = () => {
    const roomId = this.props.match.params.id;

    getLastMessages(roomId).then(res => {
      this.setState({
        messages: res.data.messages,
      });
    });
  };

  componentWillReceiveProps(nextProps) {
    getLastMessages(nextProps.roomId).then(res => {
      this.setState({
        messages: res.data.messages,
      });
    });
  }

  formatMsgTime(timeInput) {
    const time = new Date(timeInput);

    return `${parseInt(time.getMonth() + 1)}/${time.getDate()} ${time.getHours()}:${time.getMinutes()}`;
  }

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
          <Button style={{ float: 'right' }} type="primary">
            {t('send')}
          </Button>
        </div>
        <Input.TextArea placeholder={t('type_msg')} rows={4} style={{ resize: 'none' }} />
      </Content>
    );
  }
}

export default withNamespaces(['room'])(withRouter(ChatBox));
