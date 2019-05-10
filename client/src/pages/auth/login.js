import React from 'react';
import Main from './../../components/layouts/Main';
import 'antd/dist/antd.css';
import { getapiLogin } from './../../api/auth.js';
import {
  Form, Icon, Input, Button, Alert
} from 'antd';
import './../../css/auth/login.css';

class Home extends React.Component {
  // State and props in properties
  state = {
    email: '',
    password: '',
    error: '',
    isError: false,
  }

  handlecheckLogin = (e) => {
    const { email, password } = this.state;
    const _this = this;

    getapiLogin({
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
    const { isError } = this.state;
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
      <Main>
        <Form className="login-form">
          <h2> Welcome to Summoner's Rift  </h2>
          { errorHTML }
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
            <a className="login-form-forgot" href="#">Forgot password</a>
            <br/>
            <Button
              className="login-form-button"
              type="primary"
              value="Log in"
              onClick={this.handlecheckLogin} > Login
            </Button>
            Or <a href="#">register now!</a>
          </Form.Item>
        </Form>
      </Main>
    );
  }
}

export default Home;
