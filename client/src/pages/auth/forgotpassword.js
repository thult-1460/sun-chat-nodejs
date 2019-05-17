import React, { Fragment } from 'react';
import 'antd/dist/antd.css';
import { sendMailResetPassword } from './../../api/auth.js';
import { Form, Icon, Input, Button, Alert } from 'antd';
import { PrivateIcon } from './../../components/PrivateIcon';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { authValidate } from './../../config/validate';

class ForgotPassword extends React.Component {
  // State and props in properties
  state = {
    is_reset: false,
    error: '',
    errors: {},
  };

  rules = {
    email: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.email.required') },
        {
          pattern: '^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+.)?[a-zA-Z]+.)?(sun-asterisk).com$',
          message: this.props.t('validate.email.regex'),
        },
        {
          max: authValidate.email.maxLength,
          message: this.props.t('validate.email.length', { max: authValidate.email.maxLength }),
        },
      ],
    },
  };

  handleResetPassword = e => {
    const { email } = this.props.form.getFieldsValue();

    this.props.form.validateFields((err, values) => {
      if (!err) {
        sendMailResetPassword({
          email: email,
        })
          .then(res => {
            this.setState({
              is_reset: true,
            });
          })
          .catch(err => {
            this.setState({
              error: err.response.data.error,
              errors: err.response.data.error ? {} : err.response.data,
            });
          });
      }
    });
  };

  render() {
    let { is_reset, error, errors } = this.state;
    const { form, t } = this.props;
    let contentHTML = '';

    if (is_reset === false) {
      contentHTML = (
        <div className="form">
          <Form className="login-form">
            <h2 className="logo">
              <Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} />
            </h2>
            {error && (
              <Form.Item>
                <Alert message="Error" description={error} type="error" showIcon />
              </Form.Item>
            )}
            <Form.Item
              help={
                form.getFieldError('email') ? (
                  form.getFieldError('email')
                ) : errors && errors.email ? (
                  <span className="error-message-from-server">{errors.email}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('email', this.rules.email)(
                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder={t('email')} />
              )}
            </Form.Item>
            <Form.Item>
              <Button className="login-form-button" type="primary" value="Log in" onClick={this.handleResetPassword}>
                {t('reset_password')}
              </Button>
              {t('or')} <a href="/register">{t('register')}</a>
            </Form.Item>
          </Form>
        </div>
      );
    } else {
      contentHTML = (
        <div className="form">
          <Form className="login-form">
            <h1> {t('check_mail')} </h1>
            <a href="/"> {t('go_home')} </a>
          </Form>
        </div>
      );
    }
    return <Fragment>{contentHTML}</Fragment>;
  }
}

ForgotPassword = Form.create()(ForgotPassword);

export default withNamespaces(['auth'])(withRouter(ForgotPassword));
