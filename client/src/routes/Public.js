import React from 'react'
import {Route} from 'react-router-dom'
import Main from '../components/layouts/Main'

const PublicRoute = ({component: Component, ...rest}) => (
    <Route {...rest} render={props => (
        <Main {...props}>
            <Component {...props}/>
        </Main>
    )}/>
);

export default PublicRoute;
