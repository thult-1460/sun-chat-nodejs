import React from 'react';
import { BrowserRouter as Router, Redirect, Switch } from 'react-router-dom';
import routes from './routes';
import PublicRoute from './Public';
import PrivateRoute from './Private';
import { checkExpiredToken } from './../helpers/common.js';

class Routes extends React.Component {
  render() {
    const authRoute = ['/login', '/register', '/confirm/:id/:active_token', '/forgot-password', '/reset-password'];

    return (
      <Router>
        <Switch>
          {routes.map((route, i) => {
            if (authRoute.indexOf(route.path) >= 0 && checkExpiredToken()) {
              return <Redirect to="/" />;
            }

            if (route.auth) {
              return <PrivateRoute key={i} {...route} />;
            } else {
              return <PublicRoute key={i} {...route} />;
            }
          })}
        </Switch>
      </Router>
    );
  }
}

export default Routes;
