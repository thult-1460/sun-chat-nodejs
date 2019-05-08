import Home from '../pages/index'
import Login from '../pages/auth/login.js'
import NotFound from '../pages/404/index';

const routes = [
    {
        path: '/',
        exact: true,
        auth: false,
        component: Home
    },
    {
        path: '/login',
        exact: true,
        auth: false,
        component: Login
    },
    //notFound
    {
        path: '',
        exact: true,
        auth: false,
        component: NotFound
    }
];

export default routes;
