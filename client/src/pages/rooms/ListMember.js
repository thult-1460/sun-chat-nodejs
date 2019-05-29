import React from 'react';
import { Avatar, Tabs, Button, Input } from 'antd';
import { getMembersOfRoom } from './../../api/room.js';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import AdminRoleMemberList from './../../components/member/AdminRoleMemberList';
import OtherRoleMemberList from './../../components/member/OtherRoleMemberList';

const TabPane = Tabs.TabPane;

class ListMember extends React.Component {
  state = {
    members: [],
    searchMembers: [],
    searchText: '',
    isAdmin: false,
  };

  componentDidMount() {
    const { t } = this.props;
    const roomId = this.props.match.params.id;

    getMembersOfRoom(roomId).then(res => {
      this.setState({
        members: res.data.results.members,
        searchMembers: res.data.results.members,
        isAdmin: res.data.results.isAdmin,
      });
    });
  }

  handleSearchMember = e => {
    const { members } = this.state;
    const searchContent = e.target.value.toLowerCase();
    const searchMembers = [];

    members.map(function(member) {
      let name = member.name.toLowerCase();

      if (name.indexOf(searchContent) >= 0) {
        searchMembers.push(member);
      }
    });

    this.setState({
      searchMembers: searchMembers,
    });
  };

  render() {
    const { searchMembers, members, isAdmin } = this.state;
    const { t } = this.props;

    let adminRows = [];
    let memberRows = [];
    let readOnlyRows = [];

    members.map(member => {
      if (member.role == 'admin') {
        adminRows.push(<Avatar size={30} key={member._id} src={member.avatar} />);
      } else if (member.role == 'member') {
        memberRows.push(<Avatar size={30} key={member._id} src={member.avatar} />);
      } else {
        readOnlyRows.push(<Avatar size={30} key={member._id} src={member.avatar} />);
      }
    });
    return (
      <div>
        <h2 className="title-contact">{t('list.title')}</h2>
        <Tabs type="card">
          <TabPane tab={t('member')} key="1">
            <OtherRoleMemberList adminRows={adminRows} memberRows={memberRows} readOnlyRows={readOnlyRows} />
          </TabPane>
          {isAdmin && (
            <TabPane tab={t('action.edit_role')} key="2">
              <Input placeholder="Search" onChange={this.handleSearchMember} />
              <AdminRoleMemberList members={searchMembers} />
              <div className="contact-check-all">
                <Button.Group className="btn-all-accept">
                  <Button type="primary">{t('save')}</Button>
                </Button.Group>
              </div>
            </TabPane>
          )}
        </Tabs>
      </div>
    );
  }
}

export default withNamespaces(['member'])(withRouter(ListMember));
