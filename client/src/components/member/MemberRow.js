import React from 'react';
import { List, Avatar, Icon, Button, Popconfirm } from 'antd';
import { Select } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { ROLES } from './../../config/member';
import { getUserAvatarUrl } from './../../helpers/common';
const Option = Select.Option;

class MemberRow extends React.Component {
  onChangeRoleMember = nextRole => {
    const { member } = this.props;
    this.props.onChangeRoleMember(member._id, nextRole);
  };

  handleDeleteMember = () => {
    const { member } = this.props;
    this.props.onDeleteMember(member._id);
  };

  render() {
    const { member, t, userId } = this.props;
    let roleRows = [];

    for (var key in ROLES) {
      roleRows.push(
        <Option key={key} value={ROLES[key].value}>
          {t(ROLES[key].title)}
        </Option>
      );
    }

    return (
      <List.Item id="list-member-item">
        <List.Item.Meta
          avatar={<Avatar size={35} src={getUserAvatarUrl(member.avatar)} />}
          title={member.name}
          description={member.email}
        />
        {userId != member._id ? (
          <div>
            <Select defaultValue={ROLES[member.role].value} style={{ width: 120 }} onChange={this.onChangeRoleMember}>
              {roleRows}
            </Select>
            <Popconfirm
              title={t('delete_member.question_confirm', { name: member.name })}
              onConfirm={this.handleDeleteMember}
              okText={t('button.yes')}
              cancelText={t('button.no')}
            >
              <Button className="delete-member">
                <Icon type="close" />
              </Button>
            </Popconfirm>
          </div>
        ) : (
          ''
        )}
      </List.Item>
    );
  }
}

export default withNamespaces(['member'])(withRouter(MemberRow));
