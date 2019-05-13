import React from 'react'
import {Route, Redirect} from 'react-router-dom'
import Main from '../components/layouts/Main'
import {checkExpiredToken} from './../helpers/common';

const PrivateRoute = ({component: Component, ...rest}) => (
    <Route {...rest} render={props => (
        checkExpiredToken() ? (
            <Main {...props}>
                <Component {...props}/>
            </Main>
        ) : (
            <Redirect to={{
                pathname: '/login',
                state: {from: props.location}
            }}/>
        )
    )}/>
);

export default PrivateRoute;
