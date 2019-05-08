import React from 'react'
import {Route, Redirect} from 'react-router-dom'
import Main from '../components/layouts/Main'

const PrivateRoute = ({component: Component, isAuthenticated, ...rest}) => (
    <Route {...rest} render={props => (
        isAuthenticated ? (
            <Main {...props}>
                <Component {...props}/>
            </Main>
        ) : (
            <Redirect to={{
                pathname: '/sign_in',
                state: {from: props.location}
            }}/>
        )
    )}/>
);

export default PrivateRoute;
