import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import ListContactCreateRoom from './ListContactsCreateRoom.js';
import { createRoom, editRoom } from '../../api/room.js';
import { room } from '../../config/room';
import { Row, Col, Card, Form, Input, Icon, Button, Modal, message, Checkbox, Upload, Typography } from 'antd';
import { SocketContext } from './../../context/SocketContext';
import { getRoomAvatarUrl } from './../../helpers/common';
import avatarConfig from './../../config/avatar';

const FormItem = Form.Item;
const { TextArea } = Input;
const { Paragraph } = Typography;
const resizeBase64 = require('resize-base64');

class FormCreateRoom extends Component {
  static contextType = SocketContext;
  static defaultProps = {
    handleModalVisible: () => {},
    invitationURL: room.INVITATION_URL,
    roomInfo: {
      name: '',
      desc: '',
    },
  };

  constructor(props) {
    super(props);

    this.state = {
      previewVisible: false,
      previewImage: '',
      changeAvatar: false,
      fileList: [],
      members: [],
      errors: {},
    };
  }

  invitationType = room.INVITATION_TYPE.NOT_NEED_APPROVAL;
  isChangeLink = false;
  invitationCode = Math.random()
    .toString(36)
    .substring(2, 35);

  rules = {
    name: [
      {
        required: false,
        message: this.props.t('validate.amount_char', {
          min: room.CHAR_MIN,
          max: room.CHAR_MAX,
        }),
        min: room.CHAR_MIN,
        max: room.CHAR_MAX,
      },
    ],
    invitation_code: [
      {
        required: true,
        message: this.props.t('validate.amount_char', {
          min: room.CHAR_MIN,
          max: room.CHAR_MAX,
        }),
        min: room.CHAR_MIN,
        max: room.CHAR_MAX,
      },
      {
        pattern: '^[A-Za-z0-9_-]*$',
        message: this.props.t('validate.format_char'),
      },
    ],
  };

  componentWillReceiveProps(nextProps) {
    const { roomInfo } = nextProps;

    if (nextProps.roomInfo._id != this.props.roomInfo._id) {
      this.invitationType = roomInfo.invitation_type;
      this.invitationCode = roomInfo.invitation_code;
      this.setState({
        fileList: roomInfo.avatar ? [
          {
            uid: '-1',
            url: getRoomAvatarUrl(roomInfo.avatar),
          },
        ] : [],
      });
    }
  }

  handleCancelPreview = () => this.setState({ previewVisible: false });

  handlePreview = file => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  handleChangeAvatar = info => {
    const types = room.IMG_TYPES;

    if (info.file.uid !== '-1') {
      if (types.every(type => info.file.type !== type)) {
        message.error(
          this.props.t('validate.img_type', {
            types: room.IMG_TYPES.join(', '),
          })
        );

        return;
      }

      if (info.file.size / 1024 / 1024 > room.IMG_MAX_SIZE) {
        message.error(
          this.props.t('validate.img_size', {
            max: room.IMG_MAX_SIZE,
          })
        );

        return;
      }
    }

    this.setState({ fileList: info.fileList.slice(-1), changeAvatar: true });
  };

  handleCancelSubmit = () => {
    let { roomInfo } = this.props;

    this.invitationType = roomInfo.invitation_type;
    this.invitationCode = roomInfo.invitation_code;
    this.isChangeLink = false;
    this.setState({
      changeAvatar: false,
      errors: {},
      fileList: roomInfo.avatar ? [
        {
          uid: '-1',
          url: getRoomAvatarUrl(roomInfo.avatar),
        },
      ] : [],
    });
    this.props.handleModalVisible();
  };

  handleError = err => {
    if (err.response.data.error) {
      message.error(err.response.data.error);
    } else {
      this.setState({
        errors: err.response.data,
      });

      if (err.response.data.invitation_code) {
        this.isChangeLink = true;
      }
    }
  };

  handleCreateRoom = room => {
    const { form, handleModalVisible } = this.props;

    createRoom(room)
      .then(response => {
        form.resetFields();
        this.setState({
          fileList: [],
        });
        this.isChangeLink = false;
        message.success(response.data.message);
        handleModalVisible();
      })
      .catch(this.handleError);
  };

  handleEditRoom = (roomId, room) => {
    const { handleModalVisible } = this.props;
    editRoom(roomId, room)
      .then(response => {
        message.success(response.data.message);
        handleModalVisible();
        this.isChangeLink = false;
      })
      .catch(this.handleError);
  };

  handleSubmit = () => {
    const { form, roomInfo } = this.props;
    const { fileList, changeAvatar, members } = this.state;
    const invitationCode = this.invitationCode;

    form.validateFields((err, fieldsValue) => {
      if (err) return;

      let roomVals = { ...fieldsValue, ...{ invitation_type: this.invitationType } };

      if (!fieldsValue.invitation_code) {
        roomVals = { ...roomVals, ...{ invitation_code: invitationCode } };
      }

      if (this.state.fileList.length > 0 && changeAvatar) {
        let avatar = resizeBase64(fileList[0].thumbUrl, avatarConfig.AVATAR.ROOM.WIDTH, avatarConfig.AVATAR.ROOM.HEIGHT);

        roomVals = { ...roomVals, ...{ avatar } };
      }

      if (roomInfo._id === undefined) {
        roomVals = { ...roomVals, ...{ members } };
        this.handleCreateRoom(roomVals);
      } else {
        roomVals.invitation_code = invitationCode;
        roomVals.changeAvatar = this.state.changeAvatar;

        this.handleEditRoom(roomInfo._id, roomVals);
      }
    });
  };

  showFormEditInvitationLinkRoom = flag => {
    this.isChangeLink = flag;
    this.setState({
      errors: {},
    });
  };

  handleEditInvitationLinkRoom = () => {
    const { form } = this.props;

    form.validateFields(['invitation_code'], (err, values) => {
      if (err) return;

      this.invitationCode = values.invitation_code;
    });
  };

  adminApproves = e => {
    this.invitationType = e.target.checked
        ? room.INVITATION_TYPE.NEED_APPROVAL
        : room.INVITATION_TYPE.NOT_NEED_APPROVAL;
  };

  render() {
    const { t, form, modalVisible, invitationURL, roomInfo } = this.props;
    const { previewVisible, previewImage, fileList, errors } = this.state;
    const { isChangeLink, invitationType, invitationCode } = this
    let invitationLink = invitationURL + invitationCode;

    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">{t('title.upload')}</div>
      </div>
    );
    const formInvitationLinkRoom = (
      <Row>
        <Col span={3}>
          <Button type="link">{t('title.link_share')}:</Button>
        </Col>
        <Col span={19}>
          <Input defaultValue={invitationLink} readOnly />
        </Col>
        <Col span={1}>
          <Paragraph style={{ marginTop: '5px' }} copyable={{ text: invitationLink }} />
        </Col>
        <Col span={1}>
          <Button icon="edit" onClick={() => this.showFormEditInvitationLinkRoom(true)} />
        </Col>
      </Row>
    );
    const formEditInvitationLinkRoom = (
      <Row>
        <Col span={3}>
          <Button type="link">{t('link_share')}:</Button>
        </Col>
        <Col span={19} style={{ display: 'flex' }}>
          <span style={{ margin: '7px 0 0 25px', textAlign: 'right' }}>{invitationURL}</span>
          <FormItem
            key="invitation_code"
            style={{ margin: '-4px 5px 0 0' }}
            help={
              form.getFieldError('invitation_code') ? (
                form.getFieldError('invitation_code')
              ) : errors && errors.invitation_code ? (
                <span className="error-message-from-server">{errors.invitation_code}</span>
              ) : (
                ''
              )
            }
          >
            {form.getFieldDecorator('invitation_code', {
              initialValue: this.invitationCode,
              rules: this.rules.invitation_code,
            })(<Input onChange={() => this.setState({ errors: {} })} />)}
          </FormItem>
        </Col>
        <Col span={1}>
          <Button icon="check" onClick={this.handleEditInvitationLinkRoom} />
        </Col>
        <Col span={1}>
          <Button type="link" icon="close" onClick={() => this.showFormEditInvitationLinkRoom(false)} />
        </Col>
      </Row>
    );

    return (
      <Modal
        destroyOnClose
        title={roomInfo._id === undefined ? t('title.create_room') : t('title.edit_room')}
        visible={modalVisible}
        onOk={this.handleSubmit}
        onCancel={this.handleCancelSubmit}
        okText={t('button.submit')}
        cancelText={t('button.cancel')}
        width="750px"
      >
        <Form className="createRoom-form">
          <Row type="flex" justify="end" align="middle">
            <Col span={4}>
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                fileList={fileList}
                onPreview={this.handlePreview}
                beforeUpload={() => false}
                onChange={this.handleChangeAvatar}
              >
                {fileList.length >= 1 ? null : uploadButton}
              </Upload>
              {errors && errors.avatar ? <span className="error-message-from-server">{errors.avatar}</span> : ''}
              <Modal visible={previewVisible} footer={null} onCancel={this.handleCancelPreview}>
                <img alt="{t('avatar')}" style={{ width: '100%' }} src={previewImage} />
              </Modal>
            </Col>
            <Col span={20}>
              <FormItem
                key="name"
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
                {form.getFieldDecorator('name', {
                  initialValue: roomInfo.name,
                  rules: this.rules.name,
                })(<Input placeholder={t('title.room_name')} />)}
              </FormItem>
              <div style={{ margin: '24px 0' }} />
              <FormItem key="desc">
                {form.getFieldDecorator('desc', {
                  initialValue: roomInfo.desc,
                })(<TextArea placeholder={t('title.room_des')} autosize={{ minRows: 2, maxRows: 6 }} />)}
              </FormItem>
            </Col>
            {roomInfo._id === undefined && (
              <Col span={24}>
                <Card title={t('title.add_member')} bordered={false}>
                  <ListContactCreateRoom getMembers={members => this.setState({ members })} />
                </Card>
              </Col>
            )}
          </Row>
          {isChangeLink ? formEditInvitationLinkRoom : formInvitationLinkRoom}
          <Checkbox style={{ margin: '20px 0 0 20px' }} onChange={this.adminApproves} checked={invitationType}>
            {t('title.admin_confirm')}
          </Checkbox>
        </Form>
      </Modal>
    );
  }
}

FormCreateRoom = Form.create()(FormCreateRoom);

export default withNamespaces(['room'])(withRouter(FormCreateRoom));
