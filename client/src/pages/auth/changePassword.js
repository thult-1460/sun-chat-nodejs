import React, { Fragment } from 'react';
import { apiChangePassword } from './../../api/auth';
import { Form, Icon, Input, Button, Alert, message } from 'antd';
import Loading from './../../components/Loading';
import { withRouter } from 'react-router';
import { authValidate } from './../../config/validate';
import { withNamespaces } from 'react-i18next';
const FormItem = Form.Item;

class ChangePasswordForm extends React.Component {
  state = {
    error: '',
    errors: {},
    success: '',
    isError: false,
    isLoading: false,
  };

  rules = {
    current_password: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.current_password.required') },
        {
          max: authValidate.password.maxLength,
          message: this.props.t('validate.current_password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
        {
          min: authValidate.password.minLength,
          message: this.props.t('validate.current_password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
      ],
    },
    new_password: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('validate.new_password.required') },
        {
          max: authValidate.password.maxLength,
          message: this.props.t('validate.new_password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
        {
          min: authValidate.password.minLength,
          message: this.props.t('validate.new_password.length', {
            min: authValidate.password.minLength,
            max: authValidate.password.maxLength,
          }),
        },
        {
          validator: (rule, value, callback) => {
            const form = this.props.form;
            if (value && value === form.getFieldValue('current_password')) {
              callback(this.props.t('validate.new_password.match_password'));
            } else {
              callback();
            }
          },
        },
      ],
    },
    confirm_password: {
      validateFirst: true,
      rules: [
        {
          required: true,
          message: this.props.t('validate.password_confirmation.required'),
        },
        {
          validator: (rule, value, callback) => {
            const form = this.props.form;
            if (value && value !== form.getFieldValue('new_password')) {
              callback(this.props.t('validate.password_confirmation.dont_match'));
            } else {
              callback();
            }
          },
        },
      ],
    },
  };

  handleConfirmBlur = e => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
  };

  onSubmit = e => {
    e.preventDefault();
    const { current_password, new_password, confirm_password } = this.props.form.getFieldsValue();
    const changePassword = { current_password, new_password, confirm_password };

    this.props.form.validateFields((err, values) => {
      if (err) {
        return;
      }
      this.setState({ isLoading: true });
      apiChangePassword(changePassword)
        .then(res => {
          this.props.history.push('/', res.data.success);
          message.success(res.data.success);
        })
        .catch(err => {
          const { data: errors } = err.response;
          const { error = '' } = errors;

          this.setState({
            error,
            errors: error ? {} : errors,
            isLoading: false,
          });
        });
    });
  };

  render() {
    const { errors, isLoading, error } = this.state;
    const { form, t } = this.props;

    return (
      <Fragment>
        <div className="form form_change_password">
          <Form layout="horizontal" onSubmit={this.onSubmit}>
            {isLoading && <Loading />}
            {error && <Alert message="Error" type="error" description={error} />}
            <FormItem
              help={
                form.getFieldError('current_password') ? (
                  form.getFieldError('current_password')
                ) : errors && errors.current_password ? (
                  <span className="error-message-from-server">{errors.current_password}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('current_password', this.rules.current_password)(
                <Input
                  prefix={<Icon type="lock" className="icon_input" />}
                  type="password"
                  placeholder={t('current_password')}
                />
              )}
            </FormItem>
            <FormItem
              help={
                form.getFieldError('new_password') ? (
                  form.getFieldError('new_password')
                ) : errors && errors.new_password ? (
                  <span className="error-message-from-server">{errors.new_password}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('new_password', this.rules.new_password)(
                <Input
                  prefix={<Icon type="lock" className="icon_input" />}
                  type="password"
                  placeholder={t('new_password')}
                />
              )}
            </FormItem>
            <FormItem
              help={
                form.getFieldError('confirm_password') ? (
                  form.getFieldError('confirm_password')
                ) : errors && errors.confirm_password ? (
                  <span className="error-message-from-server">{errors.confirm_password}</span>
                ) : (
                  ''
                )
              }
            >
              {form.getFieldDecorator('confirm_password', this.rules.confirm_password)(
                <Input
                  prefix={<Icon onBlur={this.handleConfirmBlur} type="lock" className="icon_input" />}
                  type="password"
                  placeholder={t('password_confirmation')}
                />
              )}
            </FormItem>
            <FormItem>
              <Button type="primary" htmlType="submit" className="login-form-button">
                {t('save')}
              </Button>
            </FormItem>
          </Form>
        </div>
      </Fragment>
    );
  }
}

ChangePasswordForm = Form.create()(ChangePasswordForm);

export default withNamespaces(['auth'])(withRouter(ChangePasswordForm));
