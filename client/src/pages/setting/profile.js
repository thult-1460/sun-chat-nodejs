import React from 'react';
import 'antd/dist/antd.css';
import { Input, Button, Alert, Icon, Form, Upload, message, Row, Col } from 'antd';
import { getUser, updateUser } from './../../api/user';
import { authValidate, avatarValidate } from './../../config/validate';
import avatarConfig from './../../config/avatar';
import { withNamespaces } from 'react-i18next';
import { getUserAvatarUrl } from './../../helpers/common';

const FormItem = Form.Item;
const resizeBase64 = require('resize-base64');

function getBase64(img, callback) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result));
  reader.readAsDataURL(img);
}

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
        { message: this.props.t('auth:validate.email.required') },
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
    errors: {},
    changedAvatar: false,
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
      avatar: res.avatar,
    });
  };

  componentDidMount() {
    getUser()
      .then(res => {
        this.setState({
          imageUrl: res.data.user.avatar,
        });

        this.setValueFormItem(res.data.user);
      })
      .catch(error => {
        message.error(this.messages.load_to_fail_user_info);

        return Promise.reject(error);
      });
  }

  handleSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        const { name, email, username, twitter, github, google, address, phone } = this.props.form.getFieldsValue();
        const avatar = resizeBase64(this.state.imageUrl, avatarConfig.AVATAR.USER.WIDTH, avatarConfig.AVATAR.USER.HEIGHT)

        let user;

        if (this.state.changedAvatar) {
          user = { name, email, username, twitter, github, google, address, phone, avatar };
        } else {
          user = { name, email, username, twitter, github, google, address, phone };
        }

        updateUser(user)
          .then(res => {
            if (res.data.success) {
              this.setState({
                errors: {},
              });
              message.success(this.messages.update_to_success_user);
            } else {
              this.setState({
                errors: res.data,
              });
              message.error(this.messages.load_to_fail_user_info);
            }
          })
          .catch(error => {
            message.warning(this.messages.request_not_processed);

            return Promise.reject(error);
          });
      }
    });
  };

  handleChange = info => {
    const types = avatarValidate.IMG_TYPES;

    if (types.every(type => info.file.type !== type)) {
      message.error(
        this.props.t('user:validate.img_type', {
          types: avatarValidate.IMG_TYPES.join(', '),
        })
      );

      return;
    }

    if (info.file.size / 1024 / 1024 > avatarValidate.IMG_MAX_SIZE) {
      message.error(
        this.props.t('user:validate.img_size', {
          max: avatarValidate.IMG_MAX_SIZE,
        })
      );

      return;
    }

    getBase64(info.fileList[info.fileList.length - 1].originFileObj, imageUrl =>
      this.setState({
        imageUrl,
        changedAvatar: true,
      })
    );
  };

  render() {
    const { errors, imageUrl, changedAvatar } = this.state;
    const { form, t } = this.props;
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">{t('user:label.upload')}</div>
      </div>
    );

    return (
      <Form>
        <div className="area-edit-profile">
          <p className="font30">{t('user:label.title_update_info')}</p>
          <Row className="form-profile">
            <Col span={16} offset={3}>
              <Row>
                <Col offset={11}>
                  <FormItem
                    name="avatar"
                    help={
                      form.getFieldError('avatar') ? (
                        form.getFieldError('avatar')
                      ) : errors && errors.name ? (
                        <span className="error-message-from-server">{errors.avatar}</span>
                      ) : (
                        ''
                      )
                    }
                  >
                    {form.getFieldDecorator('avatar')(
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        beforeUpload={() => false}
                        onChange={this.handleChange}
                      >
                        {imageUrl ? (
                          <img
                            src={changedAvatar ? imageUrl : getUserAvatarUrl(imageUrl)}
                            alt="avatar"
                            className="profile-avatar"
                          />
                        ) : (
                          uploadButton
                        )}
                      </Upload>
                    )}
                  </FormItem>
                </Col>
              </Row>
              <Row>
                <label className="bold">{t('user:label.name')}</label>
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
              </Row>
              <Row>
                <label className="bold">{t('user:label.email')}</label>
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
              </Row>
              <Row>
                <label className="bold">{t('user:label.user_name')}</label>
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
              </Row>
              <Row>
                <label className="bold">{t('user:label.twitter')}</label>
                <FormItem
                  name="twitter"
                  help={
                    form.getFieldError('twitter') ? (
                      form.getFieldError('twitter')
                    ) : errors && errors.username ? (
                      <span className="error-message-from-server">{errors.twitter}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('twitter')(
                    <Input
                      prefix={<Icon type="twitter" style={{ fontSize: 13 }} />}
                      placeholder={t('user:label.twitter')}
                    />
                  )}
                </FormItem>
              </Row>
              <Row>
                <label className="bold">{t('user:label.github')}</label>
                <FormItem
                  name="github"
                  help={
                    form.getFieldError('github') ? (
                      form.getFieldError('github')
                    ) : errors && errors.username ? (
                      <span className="error-message-from-server">{errors.github}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('github')(
                    <Input
                      prefix={<Icon type="github" style={{ fontSize: 13 }} />}
                      placeholder={t('user:label.github')}
                    />
                  )}
                </FormItem>
              </Row>
              <Row>
                <label className="bold">{t('user:label.google')}</label>
                <FormItem
                  name="google"
                  help={
                    form.getFieldError('google') ? (
                      form.getFieldError('google')
                    ) : errors && errors.username ? (
                      <span className="error-message-from-server">{errors.twitter}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('google')(
                    <Input
                      prefix={<Icon type="google" style={{ fontSize: 13 }} />}
                      placeholder={t('user:label.google')}
                    />
                  )}
                </FormItem>
              </Row>
              <Row>
                <label className="bold">{t('user:label.address')}</label>
                <FormItem
                  name="address"
                  help={
                    form.getFieldError('address') ? (
                      form.getFieldError('address')
                    ) : errors && errors.username ? (
                      <span className="error-message-from-server">{errors.address}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('address')(
                    <Input
                      prefix={<Icon type="home" style={{ fontSize: 13 }} />}
                      placeholder={t('user:label.address')}
                    />
                  )}
                </FormItem>
              </Row>
              <Row>
                <label className="bold">{t('user:label.phone')}</label>
                <FormItem
                  name="phone"
                  help={
                    form.getFieldError('phone') ? (
                      form.getFieldError('phone')
                    ) : errors && errors.username ? (
                      <span className="error-message-from-server">{errors.phone}</span>
                    ) : (
                      ''
                    )
                  }
                >
                  {form.getFieldDecorator('phone')(
                    <Input
                      prefix={<Icon type="phone" style={{ fontSize: 13 }} />}
                      placeholder={t('user:label.phone')}
                    />
                  )}
                </FormItem>
              </Row>
              <Row>
                <Col offset={11}>
                  <Button className="button-submit" onClick={this.handleSubmit}>
                    {this.props.t('user:button.update_info')}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      </Form>
    );
  }
}

Profile = Form.create()(Profile);
export default withNamespaces(['auth', 'user'])(Profile);
