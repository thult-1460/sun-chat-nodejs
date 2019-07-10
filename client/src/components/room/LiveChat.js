import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { withNamespaces } from 'react-i18next';
import './../../scss/live_chat.scss';
import { Button } from 'antd';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaAngleLeft, FaAngleRight, FaUserPlus, FaUserSlash } from 'react-icons/fa';
import { MdAddToQueue } from 'react-icons/md';
import { Icon } from'antd';

class LiveChat extends Component {
  state = {
    leftOn: true,
    rightOn: true,
    cameraOn: true,
    microOn: true,
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
  }

  changeMicro = () => {
    this.setState({
      microOn: !this.state.microOn,
    });
  }

  changeCamera = () => {
    this.setState({
      cameraOn: !this.state.cameraOn,
    });
  }

  render = () => {
    const { leftOn, rightOn, microOn, cameraOn } = this.state;
    return  (
      <div id="live-chat">
        <video controls>
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg" />
        </video>
        <div id="top-right-column" className="block">
          <div className="show-or-hide" data-right="1" onClick={this.showOrHide.bind(this)}>
            { rightOn ? <FaAngleRight /> : <FaAngleLeft /> }
          </div>
          <div className="list-block">
            <div className={rightOn ? '' : 'hide'}>
              <video controls>
                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                <source src="https://www.w3schools.com/html/mov_bbb.ogg" type="video/ogg" />
              </video>
            </div>
            <div className={rightOn ? '' : 'hide'} id="add-participant">
              <Button>
                <MdAddToQueue />
              </Button>
            </div>
          </div>
        </div>
        <div id="top-left-column" className="block">
          <div className="show-or-hide" data-right="0" onClick={this.showOrHide.bind(this)} style={{margin: !leftOn ? '0 0 0 0' : ''}}>
            { leftOn ? <FaAngleLeft /> : <FaAngleRight /> }
          </div>
          <div className="list-block">
            <div className={leftOn ? '' : 'hidden'}>
              <img src="https://s3.amazonaws.com/uifaces/faces/twitter/imomenui/128.jpg" />
              <div className="add-member"><FaUserPlus /></div>
              <div className="remove-person"><FaUserSlash /></div>
            </div>
          </div>
        </div>
        <div id="bottom-chat">
          <div id="option-center">
            <div id="action-micro">
              <Button onClick={this.changeMicro}>
                { microOn ? <FaMicrophone /> : <FaMicrophoneSlash/> }
                <span className="tooltip-text">Turn on/off microphone</span>
              </Button>
            </div>
            <div id="hangup">
              <Button>
                <Icon type="phone" />
                <span className="tooltip-text">Hangup</span>
              </Button>
            </div>
            <div id="action-camera">
              <Button onClick={this.changeCamera}>
                { cameraOn ? <FaVideo /> : <FaVideoSlash /> }
                <span className="tooltip-text">Turn on/off camera</span>
              </Button>
            </div>
          </div>
          <div id="share-screen">
            <Button>Share screen</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withNamespaces(['live-chat'])(withRouter(LiveChat));
