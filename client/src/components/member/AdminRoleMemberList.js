import React from 'react';
import { List } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import MemberRow from './MemberRow';

class AdminRoleMemberList extends React.Component {
  render() {
    const { members } = this.props;

    return (
      <div className="members-content">
        <List
          itemLayout="horizontal"
          dataSource={members}
          renderItem={member => <MemberRow key={member._id} member={member} onDeleteMember={this.props.onDeleteRow} />}
        />
      </div>
    );
  }
}

export default withNamespaces(['member'])(withRouter(AdminRoleMemberList));
