import React from 'react';
import { List, Avatar } from 'antd';
import { Select } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { ROLES } from './../../config/member';

const Option = Select.Option;
class MemberRow extends React.Component {
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
      </List.Item>
    );
  }
}

export default withNamespaces(['member'])(withRouter(MemberRow));
