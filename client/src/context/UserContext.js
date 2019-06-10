import React, { Component } from 'react';
import { getUser } from '../api/user';

export const UserContext = React.createContext();

class Provider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      info: {},
      my_chat_id: {},
    };
  }

  componentDidMount() {
    getUser()
      .then(res => {
        this.setState({
          info: res.data.user,
          my_chat_id: res.data.my_chat_id,
        });
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }

  render() {
    return (
      <UserContext.Provider
        value={{
          ...this.state,
        }}
      >
        {this.props.children}
      </UserContext.Provider>
    );
  }
}

export const UserConsumer = UserContext.Consumer;
export const UserProvider = Provider;
export default UserContext;
