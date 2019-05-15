import Home from '../pages/index';
import Login from '../pages/auth/login';
import NotFound from '../pages/404/index';
import Register from '../pages/auth/register';
import ListContactRequest from '../components/contact/ListContactRequest';
import ConfirmEmail from '../pages/auth/ConfirmEmail';

const routes = [
  {
    path: '/',
    exact: true,
    auth: true,
    component: Home,
  },
  {
    path: '/login',
    exact: true,
    auth: false,
    component: Login,
  },
  {
    path: '/register',
    exact: true,
    auth: false,
    component: Register,
  },
  {
    path: '/confirm/:id/:active_token',
    exact: true,
    auth: false,
    component: ConfirmEmail,
  },
  {
    path: '/my-contact-request',
    exact: true,
    auth: true,
    component: ListContactRequest,
  },
  //notFound
  {
    path: '',
    exact: true,
    auth: false,
    component: NotFound,
  },
];

export default routes;
