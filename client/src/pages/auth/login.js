import React, { Fragment } from 'react';
import 'antd/dist/antd.css';
import { getApiLogin } from './../../api/auth.js';
import { Form, Icon, Input, Button, Alert, Checkbox } from 'antd';
import { PrivateIcon } from './../../components/PrivateIcon';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class LoginPage extends React.Component {
  state = {
    email: '',
    password: '',
    error: '',
    isError: false,
  };

  handleCheckLogin = e => {
    const { email, password } = this.state;
    const { t } = this.props;
    const _this = this;

    getApiLogin({
      email: email,
      password: password,
    })
      .then(res => {
        if (res.data.token !== undefined) {
          localStorage.setItem('token', res.data.token);
          window.location.href = '/';
        } else {
          _this.setState({
            isError: true,
            error: t('invalid_account'),
          });
        }
      })
      .catch(function(error) {
        if (error.response) {
          _this.setState({
            isError: true,
            error: error.response.data.message,
          });
        }
      });
  };

  handleChangeUsername = e => {
    this.setState({
      email: e.target.value,
    });
  };

  handleChangePassword = e => {
    this.setState({
      password: e.target.value,
    });
  };

  render() {
    const { isError } = this.state;
    const { t } = this.props;

    return (
      <Fragment>
        <div className="form">
          <Form className="login-form">
            <h2 className="logo">
              <Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} />
            </h2>
            {isError && (
              <Form.Item>
                <Alert message={t('login_error')} description={this.state.error} type="error" showIcon />
              </Form.Item>
            )}
            <Form.Item>
              <Input
                prefix={<Icon type="user" />}
                placeholder="Email address"
                type="text"
                onChange={this.handleChangeUsername}
              />
            </Form.Item>
            <Form.Item>
              <Input
                prefix={<Icon type="lock" />}
                placeholder="Your password"
                type="password"
                onChange={this.handleChangePassword}
              />
            </Form.Item>
            <Form.Item>
              <Checkbox>{t('remember_me')}</Checkbox>
              <a className="login-form-forgot" href="/forgot-password">
                {t('forgot_password')}
              </a>
              <Button type="primary" htmlType="submit" className="login-form-button" onClick={this.handleCheckLogin}>
                {t('login')}
              </Button>
              {t('or')} <a href="/register">{t('register')}</a>
            </Form.Item>
          </Form>
        </div>
      </Fragment>
    );
  }
}

LoginPage = Form.create()(LoginPage);

export default withNamespaces(['auth'])(withRouter(LoginPage));
