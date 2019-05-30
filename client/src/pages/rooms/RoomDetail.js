import React from 'react';
import 'antd/dist/antd.css';
import { Layout, Typography, Row, Col, message } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { getInforRoom } from '../../api/room';
import ChatBox from '../../components/room/ChatBox';
import HeaderOfRoom from '../../components/room/HeaderOfRoom';
const { Sider, Content } = Layout;
const { Text } = Typography;

class RoomDetail extends React.Component {
  state = {
    isAdmin: false,
    roomId: '',
    roomInfo: '',
  };

  componentWillReceiveProps(nextProps) {
    const roomId = nextProps.match.params.id;
    getInforRoom(roomId)
      .then(res => {
        this.setState({
          roomInfo: res.data.roomInfo,
          isAdmin: res.data.isAdmin,
        });
      })
      .catch(error => {
        message.error(error.response.data.err);
      });
  }

  render() {
    const { t } = this.props;
    const { roomInfo, isAdmin } = this.state;
    return (
      <React.Fragment>
        <Layout>
          <Content />
          <HeaderOfRoom data={roomInfo} isAdmin={isAdmin} />
          <Layout>
            <ChatBox />
            <Sider className="sidebar-chat">
              <Row type="flex" justify="start" className="title-desc-chat-room">
                <Col span={24}>
                  <Text strong> {t('title.room_des')} </Text>
                </Col>
              </Row>
              <div className="content-desc-chat-room">{roomInfo.desc}</div>
            </Sider>
          </Layout>
        </Layout>
      </React.Fragment>
    );
  }
}

export default withNamespaces(['room'])(withRouter(RoomDetail));
