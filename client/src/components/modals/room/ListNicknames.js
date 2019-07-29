import React from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import { Avatar, Form, Input, Table } from 'antd';
import { getUserAvatarUrl } from './../../../helpers/common';
import { SocketContext } from './../../../context/SocketContext';
import { withUserContext } from './../../../context/withUserContext';

class ListNicknames extends React.Component {
  static contextType = SocketContext;

  constructor(props) {
    super(props);
  }

  setAvatar(avatar) {
    if (avatar) {
      return <Avatar src={getUserAvatarUrl(avatar)} />;
    }

    return <Avatar icon="user" size="large" />;
  }

  render() {
    const { t } = this.props;
    const members = this.props.members.filter(member => member._id !== this.props.userContext.info._id);
    const { getFieldDecorator } = this.props;
    const columns = [
      {
        title: '',
        key: 'avatar',
        width: 83,
        dataIndex: 'avatar',
        render: avatar => this.setAvatar(avatar),
      },
      {
        title: t('user:label.name'),
        width: 170,
        dataIndex: 'name',
      },
      {
        title: t('user:label.nickname'),
        dataIndex: 'nickname',
        render: (nickname, member) => (
          <Form.Item name="nickname" className="form-nickname">
            {getFieldDecorator(member._id, {
              initialValue: (member.nickname !== undefined && member.nickname.room_id !== null) ? nickname.nickname : undefined,
            })(<Input />)}
          </Form.Item>
        ),
      },
    ];

    return (
      <React.Fragment>
        <Table
          columns={columns}
          dataSource={members}
          scroll={{ y: 300 }}
          pagination={false}
          rowKey={members => members._id}
        />
      </React.Fragment>
    );
  }
}

export default withRouter(withNamespaces(['contact', 'user'])(withUserContext(ListNicknames)));
