import React, { Fragment } from 'react';
import { register } from './../../api/auth';
import { Form, Icon, Input, Button, Alert } from 'antd';
import Loading from './../../components/Loading';
import { withRouter } from 'react-router';
import { authValidate } from './../../config/validate';
import { PrivateIcon } from './../../components/PrivateIcon';
import { Link } from 'react-router-dom';
import Notifications, { notify } from 'react-notify-toast';
import { withNamespaces } from 'react-i18next';
const FormItem = Form.Item;

class RegisterPage extends React.Component {
  state = {
    isLoading: false,
    sendingEmail: false,
    errors: {},
    error: '',
  };

  validateToNextPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['password_confirmation'], { force: true });
    }

    callback();
  };

  compareToFirstPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback(this.props.t('validate.password_confirmation.dont_match'));
    } else {
      callback();
    }
  };

  rules = {
    name: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.name.required') },
        {
          max: authValidate.name.maxLength,
          message: this.props.t('validate.name.length', {
            min: authValidate.name.minLength,
            max: authValidate.name.maxLength,
          }),
        },
        {
          min: authValidate.name.minLength,
          message: this.props.t('validate.name.length', {
            min: authValidate.name.minLength,
            max: authValidate.name.maxLength,
          }),
        },
      ],
    },
    username: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.username.required') },
        {
          max: authValidate.username.maxLength,
          message: this.props.t('validate.username.length', {
            min: authValidate.username.minLength,
            max: authValidate.username.maxLength,
          }),
        },
        {
          min: authValidate.username.minLength,
          message: this.props.t('validate.username.length', {
            min: authValidate.username.minLength,
            max: authValidate.username.maxLength,
          }),
        },
      ],
    },
    email: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.email.required') },
        {
          pattern: '^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+.)?[a-zA-Z]+.)?(sun-asterisk)\\.com$',
          message: this.props.t('validate.email.regex'),
        },
        {
          max: authValidate.email.maxLength,
          message: this.props.t('validate.email.length', { max: authValidate.email.maxLength }),
        },
      ],
    },
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
        { validator: this.compareToFirstPassword },
      ],
    },
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  onChange = e => {
    const fieldName = e.target.id;
    let { errors } = this.state;

    if (fieldName in errors) {
      errors[fieldName] = '';
      this.setState({ errors });
    }
  };

  onSubmit = e => {
    e.preventDefault();
    this.setState({ sendingEmail: true });
    const { username, name, email, password, password_confirmation } = this.props.form.getFieldsValue();
    const newUser = { username, name, email, password, password_confirmation };

    let myColor = { background: '#0E1717', text: '#FFFFFF' };

    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ isLoading: true });
        register(newUser)
          .then(res => res.data)
          .then(data => {
            this.setState({
              sendingEmail: false,
              isLoading: false,
            });
            notify.show(data.msg, 'custom', 5000, myColor);
            this.props.form.resetFields();
          })
          .catch(err => {
            if (err.response.data.error) {
              this.setState({
                error: err.response.data.error,
                isLoading: false,
              });
            } else {
              this.setState({
                errors: err.response.data,
                isLoading: false,
              });
            }
          });
      }
    });
  };

  render() {
    const { errors, isLoading, error } = this.state;
    const { form, t } = this.props;

    return (
      <Fragment>
        <Notifications />

        <div className="form" style={{ height: 560 }}>
          {isLoading && <Loading />}
          {error && <Alert message="Error" type="error" description={error} closable />}
          <Form layout="horizontal" onSubmit={this.onSubmit} onChange={this.onChange}>
            <h2 className="logo">
              <Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} />
            </h2>
            <FormItem
              help={
                form.getFieldError('name') ? (
                  form.getFieldError('name')
                ) : errors && errors.name ? (
                  <span className="error-message-from-server">{errors.name}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('name', this.rules.name)(
                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder={t('name')} />
              )}
            </FormItem>
            <FormItem
              help={
                form.getFieldError('username') ? (
                  form.getFieldError('username')
                ) : errors && errors.username ? (
                  <span className="error-message-from-server">{errors.username}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('username', this.rules.username)(
                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder={t('username')} />
              )}
            </FormItem>
            <FormItem
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
            </FormItem>
            <FormItem
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
                <Input
                  prefix={<Icon type="lock" style={{ fontSize: 13 }} />}
                  type="password"
                  placeholder={t('password')}
                />
              )}
            </FormItem>
            <FormItem
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
                <Input
                  prefix={<Icon onBlur={this.handleConfirmBlur} type="lock" style={{ fontSize: 13 }} />}
                  type="password"
                  placeholder={t('password_confirmation')}
                />
              )}
            </FormItem>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="login-form-button">
                {t('register')}
              </Button>
              {t('or')} <Link to="/login">{t('login')} !</Link>
            </Form.Item>
          </Form>
        </div>
      </Fragment>
    );
  }
}

RegisterPage = Form.create()(RegisterPage);

export default withNamespaces(['auth'])(withRouter(RegisterPage));
