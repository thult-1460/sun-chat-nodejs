import Home from '../pages/index'
import Login from '../pages/auth/login'
import NotFound from '../pages/404/index';
import Register from '../pages/auth/register';

const routes = [
    {
        path: '/',
        exact: true,
        auth: true,
        component: Home
    },
    {
        path: '/login',
        exact: true,
        auth: false,
        component: Login
    },
    {
        path: '/register',
        exact: true,
        auth: false,
        component: Register
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
