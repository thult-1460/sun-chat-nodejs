import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import Main from '../components/layouts/Main';
import { checkExpiredToken } from './../helpers/common';
import { UserProvider } from '../context/UserContext.js';
import { SocketProvider } from './../context/SocketContext';

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      checkExpiredToken() ? (
        <UserProvider>
          <SocketProvider>
            <Main {...props}>
              <Component {...props} />
            </Main>
          </SocketProvider>
        </UserProvider>
      ) : (
        <Redirect
          to={{
            pathname: '/login',
            state: { from: props.location },
          }}
        />
      )
    }
  />
);

export default PrivateRoute;
