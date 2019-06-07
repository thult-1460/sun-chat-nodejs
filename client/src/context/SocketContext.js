import React, { Component } from 'react';
import systemConfig from './../config/configServer';
import socketIOClient from 'socket.io-client';

export const SocketContext = React.createContext();

class Provider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: socketIOClient(systemConfig.SOCKET_ENDPOINT),
    };

    this.state.socket.emit('register_id', localStorage.getItem('token'));
  }

  componentWillUnmount() {
    this.state.socket.close();
  }

  render() {
    return <SocketContext.Provider value={this.state}>{this.props.children}</SocketContext.Provider>;
  }
}

export const SocketConsumer = SocketContext.Consumer;
export const SocketProvider = Provider;
export default SocketContext;
