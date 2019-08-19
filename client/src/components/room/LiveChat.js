import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import './../../scss/live_chat.scss';
import { Button, message } from 'antd';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaAngleLeft,
  FaAngleRight,
  FaUserPlus,
  FaUserSlash,
} from 'react-icons/fa';
import { MdAddToQueue } from 'react-icons/md';
import { Icon } from 'antd';
import { checkMember, acceptMember, leaveLiveChat } from './../../api/call';
import { getUserAvatarUrl } from './../../helpers/common';
import { SocketContext } from './../../context/SocketContext';
import { withUserContext } from './../../context/withUserContext';

class LiveChat extends Component {
  static contextType = SocketContext;
  socket = this.context.socket;
  state = {
    checkDisplayLayout: null,
    leftOn: true,
    rightOn: true,
    cameraOn: true,
    microOn: true,
    isCaller: false,

    listMember: [],
    listOfferPerson: [],
  };

  componentDidMount() {
    const { roomId, liveChatId } = this.props.match.params;

    if (window.location.search.split('main-member=')[1]) {
      this.socket.emit('regist-live-chat', { roomId: roomId, liveId: liveChatId, master: false });

      this.acceptMember({ roomId, liveChatId });
      this.setState({
        checkDisplayLayout: true,
      });
    } else {
      this.checkMember({ roomId, liveChatId });
    }

    this.socket.on('change-offer-list', res => {
      const roomId = this.props.match.params.roomId;
      const { listMember, listOfferPerson, isCaller } = this.state;

      if (res.roomId && roomId === res.roomId) {
        const listKeyMember = listMember.map(item => {
          return item.id;
        });

        const listKeyOffer = listOfferPerson.map(item => {
          return item.id;
        });

        if (isCaller && listKeyOffer.concat(listKeyMember).indexOf(res.userId) === -1) {
          listOfferPerson.push({
            id: res.userId,
            avatar: res.info.avatar,
            name: res.info.name,
          });

          this.setState({
            listOfferPerson: listOfferPerson,
          });
        }
      } else if (res.userGiveUp) {
        this.memberGetOut(res.userGiveUp);
        this.removePersonOffer(res.userGiveUp);
      }
    });

    this.socket.on('be-accepted-by-master', res => {
      this.socket.emit('join-live-chat', liveChatId);

      this.setState({
        checkDisplayLayout: res.accepted,
      });
    });

    this.socket.on('list-member-live-chat', ({ listMember, offerId }) => {
      let members = [];

      listMember.forEach(function(item) {
        members.push({
          id: item.user_id,
          cameraView: '',
        });
      });

      this.setState({
        listMember: members,
      });

      this.removePersonOffer(offerId);
    });
  }

  checkMember({ roomId, liveChatId }) {
    checkMember({ roomId, liveChatId }).then(res => {
      let enable = false;
      const { status, isCaller } = res.data;

      if (status) {
        enable = true;
        let listMember = this.state.listMember;
        listMember.push({
          id: this.props.userContext.info._id,
          cameraView: '',
        });

        this.socket.emit('join-live-chat', liveChatId);

        this.setState({
          listMember: listMember,
          isCaller: isCaller,
        });
      }

      this.setState({
        checkDisplayLayout: enable,
      });

      this.socket.emit('regist-live-chat', { roomId: roomId, liveId: liveChatId, master: this.state.isCaller });
    });
  }

  removePersonOffer(userId) {
    const { listOfferPerson } = this.state;
    const listKeyOffer = listOfferPerson.map(item => {
      return item.id;
    });
    let position = listKeyOffer.indexOf(userId);

    if (position !== -1) {
      listOfferPerson.splice(position, position ? position : 1);

      this.setState({
        listOfferPerson: listOfferPerson,
      });
    }
  }

  memberGetOut(userId) {
    const { listMember } = this.state;
    const listKey = listMember.map(item => {
      return item.id;
    });
    let position = listKey.indexOf(userId);

    if (position !== -1) {
      listMember.splice(position, position ? position : 1);

      this.setState({
        listMember: listMember,
      });
    }
  }

  showOrHide = e => {
    if (e.currentTarget.dataset.right > 0) {
      this.setState({
        rightOn: !this.state.rightOn,
      });
    } else {
      this.setState({
        leftOn: !this.state.leftOn,
      });
    }
  };

  changeMicro = () => {
    this.setState({
      microOn: !this.state.microOn,
    });
  };

  changeCamera = () => {
    this.setState({
      cameraOn: !this.state.cameraOn,
    });
  };

  rejectPerson = e => {
    this.removePersonOffer(e.currentTarget.dataset.id);
  };

  addMember = e => {
    const { roomId, liveChatId } = this.props.match.params;
    const memberId = e.currentTarget.dataset.id;

    if (memberId) {
      let param = { roomId, liveChatId, memberId };
      this.acceptMember(param);
    }
  };

  acceptMember(param) {
    acceptMember(param).then(res => {
      if (!res.data.success) {
        message.error(res.data.message);
      }
    });
  }

  leaveLiveChat = () => {
    const { roomId, liveChatId } = this.props.match.params;
    const userId = this.props.userContext.info._id;

    leaveLiveChat(userId, { roomId: roomId, liveId: liveChatId })
      .then(res => {
        if (res.data.success) {
          window.close();
        } else {
          message.error(res.data.message);
        }
      })
      .catch(res => {
        message.error(res.message);
      });
  };

  render = () => {
    const { checkDisplayLayout, leftOn, rightOn, microOn, cameraOn, listOfferPerson, listMember, isCaller } = this.state;
    let waiting = '';

    if (checkDisplayLayout === false) {
      waiting = (
        <div id="waiting-accept">
          <div id="top-div" />
          <div id="tmp-video">
            <h1 id="notice">Wait master of live chat accept.....</h1>
          </div>
        </div>
      );
    }

    return (
      <div id="live-chat">
        {checkDisplayLayout ? (
          <div>
            <video className="video" controls>
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
              <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg" />
            </video>
            <div id="top-right-column" className="block">
              <div className="show-or-hide" data-right="1" onClick={this.showOrHide.bind(this)}>
                {rightOn ? (
                  <div>
                    <FaAngleRight />
                    <FaAngleRight />
                  </div>
                ) : (
                  <div>
                    <FaAngleLeft />
                    <FaAngleLeft />
                  </div>
                )}
              </div>
              <div className="list-block">
                {listMember.map(member => {
                  return (
                    <div key={member.id} className={rightOn ? '' : 'hide'}>
                      <video controls>
                        <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                        <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg" />
                      </video>
                      <span className="person-name">{member.name}</span>
                    </div>
                  );
                })}

                <div className={isCaller ? '' : 'hide'} id="add-participant">
                  <Button>
                    <MdAddToQueue />
                  </Button>
                </div>
              </div>
            </div>
            <div id="top-left-column" className="block">
              {isCaller && listOfferPerson.length > 0 && (
                <div
                  className="show-or-hide"
                  data-right="0"
                  onClick={this.showOrHide.bind(this)}
                  style={{ margin: !leftOn ? '0 0 0 0' : '' }}
                >
                  {leftOn ? (
                    <div>
                      <FaAngleLeft />
                      <FaAngleLeft />
                    </div>
                  ) : (
                    <div>
                      <FaAngleRight />
                      <FaAngleRight />
                    </div>
                  )}
                </div>
              )}
              <div className="list-block">
                {isCaller && listOfferPerson.map(person => {
                  return (
                    <div key={person.id} className={leftOn ? 'person' : 'person hidden'}>
                      <img src={getUserAvatarUrl(person.avatar)} />
                      <div>
                        <span className="person-name">{person.name}</span>
                        <div className="add-member" data-id={person.id} onClick={this.addMember.bind(this)}>
                          <FaUserPlus />
                        </div>
                        <div className="remove-person" data-id={person.id} onClick={this.rejectPerson.bind(this)}>
                          <FaUserSlash />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div id="bottom-chat">
              <div id="option-center">
                <div id="action-micro">
                  <Button onClick={this.changeMicro}>
                    {microOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                    <span className="tooltip-text">Turn on/off microphone</span>
                  </Button>
                </div>
                <div id="hangup">
                  <Button onClick={this.leaveLiveChat}>
                    <Icon type="phone" />
                    <span className="tooltip-text">Hangup</span>
                  </Button>
                </div>
                <div id="action-camera">
                  <Button onClick={this.changeCamera}>
                    {cameraOn ? <FaVideo /> : <FaVideoSlash />}
                    <span className="tooltip-text">Turn on/off camera</span>
                  </Button>
                </div>
              </div>
              <div id="share-screen">
                <Button>Share screen</Button>
              </div>
            </div>
          </div>
        ) : (
          waiting
        )}
      </div>
    );
  };
}

export default withNamespaces(['live-chat'])(withUserContext(LiveChat));
