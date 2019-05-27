import React from 'react';
import 'antd/dist/antd.css';
import { Layout, Menu, Icon, Button, Dropdown, message } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { deleteRoom, checkAdminOfRoom } from '../../api/room';
import history from '../../history';
import ChatBox from './ChatBox';
const { Sider } = Layout;

class RoomDetail extends React.Component {
  state = {
    isAdmin: true,
    roomId: '',
  };

  handleDeleteRoom = () => {
    const roomId = this.props.match.params.id;
    deleteRoom({ roomId })
      .then(res => {
        message.success(res.data.success);
        history.goBack();
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  };

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <Layout>
          <ChatBox />
          <Sider className="sidebar-chat">
            <Dropdown
              overlay={
                <Menu className="menu-detail-room">
                  <Menu.Item className="item-setting">
                    {this.state.isAdmin && <Button onClick={this.handleDeleteRoom}>{t('button.delete-room')}</Button>}
                    <Button onClick={this.outBox}>{t('button.left-room')}</Button>
                  </Menu.Item>
                </Menu>
              }
            >
              <Icon type="setting" className="icon-setting-room" theme="outlined" />
            </Dropdown>
          </Sider>
        </Layout>
      </React.Fragment>
    );
  }
}

export default withNamespaces(['listRoom'])(withRouter(RoomDetail));
