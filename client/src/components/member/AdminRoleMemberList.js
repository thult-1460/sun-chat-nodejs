import React from 'react';
import { List } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import MemberRow from './MemberRow';
import { SocketContext } from './../../context/SocketContext';

class AdminRoleMemberList extends React.Component {
  static contextType = SocketContext;

  constructor(props) {
    super(props);
    this.state = {
      members: this.props.members,
    };
  }

  componentDidMount() {
    const { socket } = this.context;

    socket.on('update_user_info', res => {
      this.setState(prevState => ({
        members: prevState.members.map(member =>
          member._id === res._id
            ? {
                ...member,
                name: res.name,
                avatar: res.avatar,
              }
            : member
        ),
      }));
    });
  }

  render() {
    const { userId } = this.props;
    const { members } = this.state;

    return (
      <div className="members-content">
        <List
          itemLayout="horizontal"
          dataSource={members}
          renderItem={member => (
            <MemberRow
              key={member._id}
              member={member}
              onDeleteMember={this.props.onDeleteRow}
              onChangeRoleMember={this.props.onChangeRoleRow}
              userId={userId}
            />
          )}
        />
      </div>
    );
  }
}

export default withNamespaces(['member'])(withRouter(AdminRoleMemberList));
