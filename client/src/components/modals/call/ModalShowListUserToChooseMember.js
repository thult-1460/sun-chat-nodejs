import React, { PureComponent } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import {Form, Input, Modal, Checkbox, Avatar, List, message} from 'antd';
import { getUserAvatarUrl } from '../../../helpers/common';

class ModalShowListUserToChooseMember extends PureComponent {
  state = {
    checkedList: [],
    listUser: null,
  }

  constructor(props) {
    super(props);
  }

  handleSubmit = () => {
    let { checkedList } = this.state;
    if (checkedList.length) {
      let users = [];

      checkedList.map(item => {
        users.push({
          _id: item,
        });
      });
      this.props.inviteMember(users);
      this.props.closeModalListNotMember();
    }
  }

  handleCancelSubmit = () => {
    this.props.closeModalListNotMember();
  }

  handleSearch = e => {
    const { listUserToChooseMember } = this.props;
    let text = e.target.value.trim();
    let listUser = listUserToChooseMember.filter(function (item) {
      return (item.name.toLowerCase()).includes(text.toLowerCase());
    });

    this.setState({
      listUser: listUser ? listUser : null,
    });
  }

  handleCheckBox = checkedList => {

    this.setState({
      checkedList,
    }, () => {

      var selectedList = [],
        arrSelect = this.props.form.getFieldsValue();

      this.state.checkedList.map(item => {
        selectedList[item] = arrSelect[item];
      });
      this.setState({
        selectedList,
      });
    });
  }

  render() {
    const { t, listUserToChooseMember } = this.props;
    let { checkedList, listUser } = this.state;
    
    if (!listUser) {
      listUser = listUserToChooseMember;
    }

    return (
      <Modal
          destroyOnClose
          title={t('room:title.add_member')}
          visible={true}
          onOk={this.handleSubmit}
          onCancel={this.handleCancelSubmit}
          okText={t('room:button.add_member')}
          cancelText={t('room:button.cancel')}
          width="750px"
        >
          <React.Fragment>
            <div id="list-not-live-member">
              <Input.Search
                placeholder="Search name/email"
                style={{ width: 400, float: 'right' }}
                onChange={this.handleSearch}
              />
              {listUser ? (
                <div className="infinite-container" style={{ height: '400px', overflow: 'auto' }}>
                  <Checkbox.Group onChange={this.handleCheckBox} value={checkedList}>
                    <List
                      style={{ padding: '5px' }}
                      dataSource={listUser}
                      renderItem={item => (
                        <List.Item key={item._id}>
                          <Checkbox className="item-checkbox" value={item._id} key={item._id} />
                          <List.Item.Meta
                            avatar={<Avatar src={getUserAvatarUrl(item.avatar)} />}
                            title={<a href="https://ant.design">{item.name}</a>}
                            description={item.email}
                          />
                        </List.Item>
                      )}
                    />
                  </Checkbox.Group>
                </div>
              ) : (
                <div id="no-contact">{t('contact:list_contact.no_contact')}</div>
              )}
            </div>
          </React.Fragment>
      </Modal>
    );
  }
}

ModalShowListUserToChooseMember = Form.create()(ModalShowListUserToChooseMember);

export default withNamespaces(['room', 'contact'])(withRouter(ModalShowListUserToChooseMember));
