import React, { Component } from 'react';
import { getUser } from '../api/user';

export const UserContext = React.createContext();

class Provider extends Component {
  constructor(props) {
    super(props);

    this.state = {
      info: {},
    };
  }

  componentDidMount() {
    getUser()
      .then(res => {
        this.setState({
          info: res.data,
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
