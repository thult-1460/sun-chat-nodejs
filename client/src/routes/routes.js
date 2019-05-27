import Home from '../pages/index';
import Login from '../pages/auth/login';
import NotFound from '../pages/404/index';
import Profile from '../pages/setting/profile';
import Register from '../pages/auth/register';
import ListContactRequest from '../components/modals/contact/ListContactRequest';
import ConfirmEmail from '../pages/auth/ConfirmEmail';
import ChangePassword from '../pages/auth/changePassword';
import ForgotPassword from '../pages/auth/forgotpassword.js';
import ResetPassword from '../pages/auth/resetpassword.js';
import ListContacts from '../components/modals/contact/ListContacts';
import RoomDetail from '../components/room/RoomDetail';
import AddContact from '../components/modals/contact/AddContact';

const routes = [
  {
    path: '/change-password',
    exact: true,
    auth: true,
    component: ChangePassword,
  },
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
  {
    path: '/room/:id',
    exact: true,
    auth: true,
    component: RoomDetail,
  },
  {
    path: '/contacts',
    exact: true,
    auth: true,
    component: ListContacts,
  },
  {
    path: '/setting/profile',
    exact: true,
    auth: true,
    component: Profile,
  },
  // change password
  {
    path: '/forgot-password',
    exact: true,
    auth: false,
    component: ForgotPassword,
  },
  {
    path: '/reset-password',
    exact: true,
    auth: false,
    component: ResetPassword,
  },
  {
    path: '/send-request-contact',
    exact: true,
    auth: true,
    component: AddContact,
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
