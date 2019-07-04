import React from 'react';
import { withRouter } from 'react-router';
import { Layout, Input, message } from 'antd';
import { UserContext } from '../context/UserContext';

const { Content } = Layout;

class Home extends React.Component {
  static contextType = UserContext;

  componentDidUpdate() {
    if (this.context.my_chat_id !== null) {
      this.props.history.push(`/rooms/${this.context.my_chat_id}`);
    }
  }

  render() {
    return (
      <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
        <div className="list-message">
        </div>
      </Content>
    );
  }
}

export default withRouter(Home);
