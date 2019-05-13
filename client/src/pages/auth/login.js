import React, {Fragment} from 'react';
import 'antd/dist/antd.css';
import { getApiLogin } from './../../api/auth.js';
import {
  Form, Icon, Input, Button, Alert, Checkbox
} from 'antd';
import {PrivateIcon} from './../../components/PrivateIcon';
import {Link} from 'react-router-dom';

class LoginPage extends React.Component {

  state = {
    email: '',
    password: '',
    error: '',
    isError: false,
    message: ''
  }

  componentDidMount() {
    if (this.props.history.location.state !== '') {
      this.setState({
        message: this.props.history.location.state
      })
    }
  }

  handleCheckLogin = (e) => {
    const { email, password } = this.state;
    const _this = this;

    getApiLogin({
      email: email,
      password: password,
    }).then(res => {
      if (res.data.token !== undefined) {
        localStorage.setItem('token', res.data.token);
        window.location.href = "/";
      } else {
        _this.setState({
          isError: true,
          error: 'Invalid email or password.',
        })
      }
    });
  }

  handleChangeUsername = (e) => {
    this.setState({
      email: e.target.value
    })
  }

  handleChangePassword = (e) => {
    this.setState({
      password: e.target.value
    })
  }

  render() {
    const { isError, message } = this.state;
    let errorHTML;

    if (isError) {
      errorHTML = 
        <Form.Item>
          <Alert
            message="Authentication failed"
            description={this.state.error}
            type="error"
            showIcon
          />
        </Form.Item>;
    } else {
      errorHTML = '';
    }
    return (
      <Fragment>
        <div className="form">
          <Form className="login-form">
            <h2 className="logo"><Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} /></h2>
            { errorHTML }
            {typeof message === 'string' && message !== '' && 
              <Form.Item>
                <Alert
                  description={message}
                  type="success"
                  showIcon
                />
              </Form.Item>
            }
            <Form.Item>
              <Input prefix={<Icon type="user" />}
                placeholder="Email address"
                type="text"
                onChange={this.handleChangeUsername} />
            </Form.Item>
            <Form.Item>
              <Input prefix={<Icon type="lock" />}
                placeholder="Your password"
                type="password"
                onChange={this.handleChangePassword} />
            </Form.Item>
            <Form.Item>
                <Checkbox>Remember me</Checkbox>
              <a className="login-form-forgot" href="">Forgot password</a>
              <Button type="primary" htmlType="submit" className="login-form-button" onClick={this.handleCheckLogin}>
                Log in
              </Button>
              Or <Link to="/register">register now!</Link>
            </Form.Item>
          </Form>
        </div>
      </Fragment>
    );
  }
}

export default LoginPage;
