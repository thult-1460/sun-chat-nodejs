import React from 'react';
import { getInfoRoomWithInvitionCode, sendJoinRoomRequest } from './../../api/room.js';
import { Avatar, Button, Row, Col, Alert } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { INVATATION_STATUS } from './../../config/room.js';

class JoinInvation extends React.Component {
  state = {
    room: {},
    isSendRequest: false,
    error: '',
    message: '',
  };

  handleJoinRoomRequest = () => {
    const { _id: roomId } = this.state.room;
    const { t } = this.props;
    const data = {
      roomId: roomId,
    };

    sendJoinRoomRequest(data)
      .then(res => {
        let { status } = res.data;

        if (status == INVATATION_STATUS.cant_join) {
          this.setState({
            error: t('invitation.cant_join'),
          });
        } else {
          this.setState({
            isSendRequest: true,
            message: res.data.message,
          });
        }
      })
      .catch(err => {
        this.setState({
          error: err.response.data.error,
        });
      });
  };

  componentDidMount = () => {
    const { invitation_code } = this.props.match.params;
    const { t } = this.props;

    getInfoRoomWithInvitionCode(invitation_code)
      .then(res => {
        let { status } = res.data;

        switch (status) {
          case INVATATION_STATUS.in_room:
            this.setState({
              isSendRequest: true,
              message: t('joined'),
            });

            break;
          case INVATATION_STATUS.have_request_before:
            this.setState({
              isSendRequest: true,
              message: t('invitation.have_request_before'),
            });

            break;
          default:
            let roomInfo = res.data.room;

            this.setState({
              room: roomInfo,
            });

            break;
        }
      })
      .catch(err => {
        this.setState({
          error: err.response.data.error,
        });
      });
  };

  render() {
    const { name, avatar_url } = this.state.room;
    const { isSendRequest, error, message } = this.state;
    const { t } = this.props;

    return (
      <div className="invatation">
        <Row>
          <Col span={12} offset={6}>
            {error ? (
              <Alert className="btn-join-room" description={error} type="error" showIcon />
            ) : isSendRequest ? (
              <Alert className="btn-join-room" description={message} type="success" showIcon />
            ) : (
              <div>
                <Avatar src={avatar_url} shape="square" size={64} />
                <span> {name} </span>
                <div className="btn-join-room">
                  <Button type="primary" onClick={this.handleJoinRoomRequest}>
                    {t('join')}
                  </Button>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    );
  }
}

export default withNamespaces(['room'])(withRouter(JoinInvation));
