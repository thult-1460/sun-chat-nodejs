import React from 'react';
import 'antd/dist/antd.css';
import { Layout, Typography, Row, Col, message, Button, Modal, Input } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { getInforRoom } from '../../api/room';
import ChatBox from '../../components/room/ChatBox';
import HeaderOfRoom from '../../components/room/HeaderOfRoom';
import { roomConfig } from '../../config/roomConfig';

const { Sider, Content } = Layout;
const { Text } = Typography;

class RoomDetail extends React.Component {
  state = {
    isAdmin: false,
    roomId: '',
    roomInfo: '',
    isCopy: false,
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = e => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    this.setState({
      visible: false,
    });
  };

  handleCopyInvitationLink = e => {
    var copyText = document.getElementById('url-invitation');
    copyText.select();
    document.execCommand('copy');

    this.setState({
      isCopy: true,
    });
  };

  fetchData = roomId => {
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
  };

  componentDidMount() {
    const roomId = this.props.match.params.id;
    this.fetchData(roomId);
  }

  componentWillReceiveProps(nextProps) {
    const roomId = nextProps.match.params.id;
    this.fetchData(roomId);
  }

  render() {
    const { t } = this.props;
    const { roomInfo, isAdmin, isCopy } = this.state;
    const invitationURL = `${roomConfig.INVITATION_URL}${roomInfo.invitation_code}`;

    return (
      <React.Fragment>
        <Layout>
          <HeaderOfRoom data={roomInfo} isAdmin={isAdmin} />
          <Layout>
            <ChatBox />
            <Sider className="sidebar-chat">
              <Row type="flex" justify="start" className="title-desc-chat-room">
                <Col span={24}>
                  <Text strong> {t('title.room_des')} </Text>
                  <Button type="primary" block onClick={this.showModal} className="invitation-btn">
                    {t('invitation.title')}
                  </Button>
                  <Modal
                    title="Invitation Link"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    footer={[
                      <Button key="back" onClick={this.handleCancel}>
                        {t('button.back')}
                      </Button>,
                    ]}
                  >
                    <p> {t('invitation.description')} </p>
                    <Input placeholder="Basic usage" value={invitationURL} id="url-invitation" />
                    <Button type="primary" onClick={this.handleCopyInvitationLink} className="copy-btn">
                      {isCopy ? t('button.copied') : t('button.copy')}
                    </Button>
                  </Modal>
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
