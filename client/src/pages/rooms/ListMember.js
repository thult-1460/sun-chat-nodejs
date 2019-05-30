import React from 'react';
import { Avatar, Tabs, Button, Input, message, Modal } from 'antd';
import { getMembersOfRoom, deleteMember } from './../../api/room';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import AdminRoleMemberList from './../../components/member/AdminRoleMemberList';
import OtherRoleMemberList from './../../components/member/OtherRoleMemberList';
import ContactDetail from './../../components/modals/contact/ContactDetail';

const TabPane = Tabs.TabPane;

class ListMember extends React.Component {
  state = {
    members: [],
    searchMembers: [],
    searchText: '',
    isAdmin: false,
    userId: '',
    contactDetail: null,
    visible: false,
    showComponent: false,
  };

  componentDidMount() {
    const roomId = this.props.match.params.id;

    getMembersOfRoom(roomId).then(res => {
      this.setState({
        members: res.data.results.members,
        searchMembers: res.data.results.members,
        isAdmin: res.data.results.isAdmin,
        userId: res.data.results.userId,
      });
    });
  }

  handleSearchMember = e => {
    const { members, userId } = this.state;
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
      userId: userId,
    });
  };


  handleDeleteMember = memberId => {
    const {searchMembers, members} = this.state;
    const data = {memberId: memberId, roomId: this.props.match.params.id};

    deleteMember(data)
      .then(res => {
        this.setState(prevState => ({
          searchMembers: prevState.searchMembers.filter(member => member._id != memberId),
          members: prevState.members.filter(member => member._id != memberId),
        }));
        message.success(res.data.success);
      })
      .catch(error => {
        message.error(error.response.data.error);
      });
  }

  showContactDetail = e => {
    const userId = e.currentTarget.id;

    for (let i in this.state.members) {
      if (this.state.members[i]._id == userId) {
        this.setState({
          contactDetail: this.state.members[i],
          visible: true,
          showComponent: true,
        });
      }
    }
  };

  handleOk = e => {
    this.setState({
      visible: false,
    });
  };

  handleCancel = e => {
    this.setState({
      visible: false,
      showComponent: false,
    });
  };

  render() {
    const { searchMembers, members, isAdmin, userId } = this.state;
    const { t } = this.props;

    let adminRows = [];
    let memberRows = [];
    let readOnlyRows = [];

    members.map(member => {
      if (member.role == 'admin') {
        adminRows.push(
          <a onClick={this.showContactDetail} id={member._id}>
            <Avatar size={30} key={member._id} src={member.avatar} />
          </a>
        );
      } else if (member.role == 'member') {
        memberRows.push(
          <a onClick={this.showContactDetail} id={member._id}>
            <Avatar size={30} key={member._id} src={member.avatar} />
          </a>
        );
      } else {
        readOnlyRows.push(
          <a onClick={this.showContactDetail} id={member._id}>
            <Avatar size={30} key={member._id} src={member.avatar} />
          </a>
        );
      }
    });
    return (
      <div>
        <h2 className="title-contact">
          {t('list.title')} {this.state.name}
        </h2>
        <Tabs type="card">
          <TabPane tab={t('member')} key="1">
            <OtherRoleMemberList adminRows={adminRows} memberRows={memberRows} readOnlyRows={readOnlyRows} />
            <Modal
              visible={this.state.visible}
              onOk={this.handleOk}
              onCancel={this.handleCancel}
              footer={null}
              width="450px"
            >
              {this.state.showComponent === true ? <ContactDetail contactDetail={this.state.contactDetail} /> : ''}
            </Modal>
          </TabPane>
          {isAdmin && (
            <TabPane tab={t('action.edit_role')} key="2">
              <Input placeholder="Search" onChange={this.handleSearchMember} />
              <AdminRoleMemberList members={searchMembers} onDeleteRow={this.handleDeleteMember} userId={userId} />
              <div className="contact-check-all">
                <Button.Group className="btn-all-accept">
                  <Button type="primary">{t('button.save')}</Button>
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
