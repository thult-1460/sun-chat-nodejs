import React from 'react';
import 'antd/dist/antd.css';
import { Input, Button, Alert, Icon, Form } from 'antd';
import { getUser, updateUser } from './../../api/user';
import { authValidate } from './../../config/validate';
import { withNamespaces } from 'react-i18next';

const FormItem = Form.Item;

class Profile extends React.Component {
  rules = {
    name: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('auth:validate.name.required') },
        {
          max: authValidate.name.maxLength,
          message: this.props.t('auth:validate.name.length', {
            min: authValidate.name.minLength,
            max: authValidate.name.maxLength,
          }),
        },
        {
          min: authValidate.name.minLength,
          message: this.props.t('auth:validate.name.length', {
            min: authValidate.name.minLength,
            max: authValidate.name.maxLength,
          }),
        },
      ],
    },
    username: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('auth:validate.username.required') },
        {
          max: authValidate.username.maxLength,
          message: this.props.t('auth:validate.username.length', {
            min: authValidate.username.minLength,
            max: authValidate.username.maxLength,
          }),
        },
        {
          min: authValidate.username.minLength,
          message: this.props.t('auth:validate.username.length', {
            min: authValidate.username.minLength,
            max: authValidate.username.maxLength,
          }),
        },
      ],
    },
    email: {
      validateFirst: true,
      rules: [
        { required: true, message: this.props.t('auth:validate.email.required') },
        {
          pattern: '^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+.)?[a-zA-Z]+.)?(sun-asterisk)\\.com$',
          message: this.props.t('auth:validate.email.regex'),
        },
        {
          max: authValidate.email.maxLength,
          message: this.props.t('auth:validate.email.length', { max: authValidate.email.maxLength }),
        },
      ],
    },
  };

  messages = {
    load_to_fail_user_info: this.props.t('user:message.load_to_fail_user_info'),
    update_to_fail_user: this.props.t('user:message.update_to_fail_user'),
    update_to_success_user: this.props.t('user:message.update_to_success_user'),
    request_not_processed: this.props.t('user:message.request_not_processed'),
  };

  state = {
    notice: '',
    errors: {},
    update: false,
    success: false,
  };

  setValueFormItem = async res => {
    this.props.form.setFieldsValue({
      name: res.name,
      email: res.email,
      username: res.username,
      twitter: res.twitter,
      github: res.github,
      google: res.google,
      address: res.full_address,
      phone: res.phone_number,
    });
  };

  componentDidMount() {
    getUser()
      .then(res => {
        this.setState({
          update: false,
          success: false,
        });

        this.setValueFormItem(res.data.user);
      })
      .catch(error => {
        this.setState({
          notice: this.messages.load_to_fail_user_info,
          success: false,
        });

        return Promise.reject(error);
      });
  }

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { name, email, username, twitter, github, google, address, phone } = this.props.form.getFieldsValue();
        const user = { name, email, username, twitter, github, google, address, phone };

        this.setState({
          update: true,
        });

        updateUser(user)
          .then(res => {
            if (res.data.success) {
              this.setState({
                notice: this.messages.update_to_success_user,
                errors: {},
                success: true,
              });
            } else {
              this.setState({
                notice: this.messages.load_to_fail_user_info,
                errors: res.data,
                success: false,
              });
            }
          })
          .catch(error => {
            this.setState({
              notice: this.messages.request_not_processed,
              success: false,
            });

            return Promise.reject(error);
          });
      }
    });
  };

  render() {
    const { errors } = this.state;
    const { form, t } = this.props;

    return (
      <Form>
        <div className="area-edit-profile">
          <p className="font30">{this.props.t('user:label.title_update_info')}</p>
          {this.state.update && <Alert message={this.state.notice} type={this.state.success ? 'success' : 'error'} />}
          <div>
            <label className="bold">{this.props.t('user:label.name')}</label>
            <FormItem
              name="name"
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
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.email')}</label>
            <FormItem
              name="email"
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
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.user_name')}</label>
            <FormItem
              name="username"
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
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.twitter')}</label>
            <FormItem name="twitter">{form.getFieldDecorator('twitter')(<Input />)}</FormItem>
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.github')}</label>
            <FormItem name="github">{form.getFieldDecorator('github')(<Input />)}</FormItem>
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.google')}</label>
            <FormItem name="google">{form.getFieldDecorator('google')(<Input />)}</FormItem>
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.address')}</label>
            <FormItem name="address">{form.getFieldDecorator('address')(<Input />)}</FormItem>
          </div>
          <div>
            <label className="bold">{this.props.t('user:label.phone')}</label>
            <FormItem name="phone">{form.getFieldDecorator('phone')(<Input />)}</FormItem>
          </div>
          <Button className="button-submit" onClick={this.handleSubmit}>
            {this.props.t('user:button.update_info')}
          </Button>
        </div>
      </Form>
    );
  }
}

Profile = Form.create()(Profile);
export default withNamespaces(['auth', 'user'])(Profile);
