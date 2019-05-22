import React from 'react';
import { BrowserRouter as Router, Redirect, Switch } from 'react-router-dom';
import routes from './routes';
import PublicRoute from './Public';
import PrivateRoute from './Private';
import { checkExpiredToken } from './../helpers/common.js';

class Routes extends React.Component {
  render() {
    return (
      <Router>
        <Switch>
          {routes.map((route, i) => {
            if (route.auth) {
              return <PrivateRoute key={i} {...route} />;
            }
          })}
          {routes.map((route, i) => {
            if (!route.auth) {
              if (checkExpiredToken() && route.path !== '') {
                return <Redirect to="/" key={i}/>;
              } else {
                return <PublicRoute key={i} {...route} />;
              }
            }
          })}
        </Switch>
      </Router>
    );
  }
}

export default Routes;
