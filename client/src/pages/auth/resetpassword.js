import React, { Fragment } from 'react';
import 'antd/dist/antd.css';
import { resetPassword } from './../../api/auth.js';
import { Form, Icon, Input, Button, Alert } from 'antd';
import queryString from 'query-string';
import { PrivateIcon } from './../../components/PrivateIcon';
import { authValidate } from './../../config/validate';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class ResetPassword extends React.Component {
  // State and props in properties
  state = {
    message: '',
    error: '',
    errors: {},
  };

  rules = {
    password: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.password.required') },
        {
          max: authValidate.password.maxLength,
          message: this.props.t('validate.password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
        {
          min: authValidate.password.minLength,
          message: this.props.t('validate.password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
        { validator: this.validateToNextPassword },
      ],
    },
    password_confirmation: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.password_confirmation.required') },
        {
          validator: (rule, value, callback) => {
            const form = this.props.form;
            if (value && value !== form.getFieldValue('password')) {
              callback(this.props.t('validate.password_confirmation.dont_match'));
            } else {
              callback();
            }
          },
        },
      ],
    },
  };

  handleResetPassword = e => {
    const url = this.props.location.search;
    const params = queryString.parse(url);
    const { password, password_confirmation } = this.props.form.getFieldsValue();
    const _this = this;

    this.props.form.validateFields((err, values) => {
      if (!err) {
        resetPassword({
          password: password,
          password_confirmation: password_confirmation,
          token: params['token'],
        })
          .then(res => {
            this.setState({
              message: res.data.message,
            });
          })
          .catch(function(err) {
            _this.setState({
              error: err.response.data.error,
              errors: err.response.data.error ? {} : err.response.data,
            });
          });
      }
    });
  };

  render() {
    const { message, errors, error } = this.state;
    const { form, t } = this.props;

    return (
      <Fragment>
        <div className="form">
          <Form className="login-form">
            <h2 className="logo">
              <Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} />
            </h2>
            {error ? (
              <Form.Item>
                <Alert message="Error" description={error} type="error" showIcon />
              </Form.Item>
            ) : (
              ''
            )}
            {typeof message === 'string' && message !== '' ? (
              <div>
                <Form.Item>
                  <Alert description={message} type="success" showIcon />
                </Form.Item>
                <Form.Item>
                  <a href="/login">{t('login')}</a>
                </Form.Item>
              </div>
            ) : (
              <div>
                <Form.Item
                  help={
                    form.getFieldError('password') ? (
                      form.getFieldError('password')
                    ) : errors && errors.password ? (
                      <span className="error-message-from-server">{errors.password}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('password', this.rules.password)(
                    <Input.Password
                      prefix={<Icon type="lock" style={{ fontSize: 13 }} />}
                      type="password"
                      placeholder={t('password')}
                    />
                  )}
                </Form.Item>
                <Form.Item
                  help={
                    form.getFieldError('password_confirmation') ? (
                      form.getFieldError('password_confirmation')
                    ) : errors && errors.password_confirmation ? (
                      <span className="error-message-from-server">{errors.password_confirmation}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('password_confirmation', this.rules.password_confirmation)(
                    <Input.Password
                      prefix={<Icon type="lock" style={{ fontSize: 13 }} />}
                      type="password"
                      placeholder={t('password_confirmation')}
                    />
                  )}
                </Form.Item>
                <Form.Item>
                  <Button
                    className="login-form-button"
                    type="primary"
                    value="Log in"
                    onClick={this.handleResetPassword}
                  >
                    {t('reset_password')}
                  </Button>
                  {t('or')} <a href="/register">{t('register')}</a>
                </Form.Item>
              </div>
            )}
          </Form>
        </div>
      </Fragment>
    );
  }
}

ResetPassword = Form.create()(ResetPassword);

export default withNamespaces(['auth'])(withRouter(ResetPassword));
