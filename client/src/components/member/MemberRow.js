import React from 'react';
import { List, Avatar, Icon, Button, Popconfirm } from 'antd';
import { Select } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { ROLES } from './../../config/member';
import { deleteMember } from '../../api/room';
const Option = Select.Option;

class MemberRow extends React.Component {
  handleDeleteMember = () => {
    const { member } = this.props;
    this.props.onDeleteMember(member._id);
  };

  render() {
    const { member, t } = this.props;
    let roleRows = [];

    for (var key in ROLES) {
      roleRows.push(
        <Option key={key} value={ROLES[key].value}>
          {t(ROLES[key].title)}
        </Option>
      );
    }

    return (
      <List.Item>
        <List.Item.Meta
          avatar={<Avatar size={35} src={member.avatar} />}
          title={member.name}
          description={member.email}
        />
        <div>
          <Select defaultValue={ROLES[member.role].value} style={{ width: 120 }}>
            {roleRows}
          </Select>
        </div>
        <Popconfirm
          title={t('delete_member.question_confirm', { name: member.name })}
          onConfirm={this.handleDeleteMember}
          okText={t('delete_member.yes')}
          cancelText={t('delete_member.no')}
        >
          <Button className="delete-member">
            <Icon type="close" />
          </Button>
        </Popconfirm>
      </List.Item>
    );
  }
}

export default withNamespaces(['member'])(withRouter(MemberRow));
