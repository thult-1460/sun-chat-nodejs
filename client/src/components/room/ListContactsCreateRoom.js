import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import { List, Avatar, Button, message, Spin, Alert, Checkbox, Select, Form, Input } from 'antd';
import { getLimitListContacts } from '../../api/contact';
import { ROLES } from '../../config/member';
import { roomConfig } from '../../config/roomConfig';

const CheckboxGroup = Checkbox.Group;
const Option = Select.Option;
const Search = Input.Search;

class ListContactCreateRoom extends Component {
  state = {
    contacts: [],
    error: '',
    limit: roomConfig.LIMIT_CONTACT,
    checkAll: false,
    indeterminate: false,
    allItemId: [],
    checkedList: [],
    role: ROLES.member.value,
  };

  componentDidMount() {
    const { limit } = this.state;

    getLimitListContacts(limit)
      .then(res => {
        const { contacts, allItemId } = this.state;
        res.data.result.map(item => {
          contacts.push(item);
          allItemId.push(item.members[0].user._id);
        });
        this.setState({
          contacts: contacts
        });
      })
      .catch(err => {
        if (err.response) {
          this.setState({
            error: err.response.data.error,
          });
        }
      });
  }

  setAvatar(avatar) {
    if (avatar) {
      return <Avatar src={avatar} />;
    }

    return <Avatar icon="user" size="large" />;
  }

  handleCheckBox = checkedList => {
    const { allItemId } = this.state;
    const roles = this.props.form.getFieldsValue()

    this.setState({
      checkedList,
      indeterminate: checkedList.length && checkedList.length < allItemId.length,
      checkAll: checkedList.length === allItemId.length,
    });

    let members = checkedList.map(obj => ({
      user: obj,
      role: roles[obj]
    }));

    this.props.getMembers(members);
  };

  handleCheckAll = e => {
    const { allItemId } = this.state;
    const roles = this.props.form.getFieldsValue()
    let checkedValues = e.target.checked ? allItemId : [];

    this.setState({
      checkedList: checkedValues,
      indeterminate: false,
      checkAll: e.target.checked,
    });

    let members = checkedValues.map(obj => ({
      user: obj,
      role: roles[obj]
    }));

    this.props.getMembers(members);
  };

  handleSelectRole = value => {
    const roles = this.props.form.getFieldsValue()

    if (this.state.checkedList.length > 0) {
      let members = this.state.checkedList.map(obj => ({
        user: obj,
        role: roles[obj]
      }));

      this.props.getMembers(members);
    }
  }

  render() {
    const { t, form } = this.props;
    const { error, checkedList, indeterminate, checkAll, contacts } = this.state;

    return (
      <React.Fragment>
        {contacts.length > 0 ? (
          <div>
            {error && <Alert message={t('user:error_title')} type="error" description={error} />}
            <Checkbox indeterminate={indeterminate} onChange={this.handleCheckAll} checked={checkAll}>
              {t('button.check_all')}
            </Checkbox>
            <Search
              placeholder="input search text"
              onSearch={value => console.log(value)}
              style={{ width: 400, float: 'right' }}
            />
            <div className="infinite-container" style={{ height: '400px', overflow: 'auto'}}>
              <CheckboxGroup onChange={this.handleCheckBox} value={checkedList}>
                <List
                  style={{padding: '5px'}}
                  dataSource={contacts}
                  renderItem={item => (
                    <List.Item key={item._id}>
                      <Checkbox
                        className="item-checkbox"
                        value={item.members[0].user._id}
                        key={item.members[0].user._id}
                      />
                      <List.Item.Meta
                        avatar={this.setAvatar(item.members[0].user.avatar)}
                        title={<a href="https://ant.design">{item.members[0].user.name}</a>}
                        description={item.members[0].user.email}
                      />
                      <Form.Item>
                      {form.getFieldDecorator(item.members[0].user._id, {
                        initialValue: "1",
                      })(
                        <Select style={{ width: 130 }} onBlur={this.handleSelectRole}>
                          <Option value="0" key={item.members[0].user._id}>Quan tri vien</Option>
                          <Option value="1" key={item.members[0].user._id}>Thanh vien</Option>
                          <Option value="2" key={item.members[0].user._id}>Chi doc</Option>
                        </Select>
                      )}
                      </Form.Item>
                    </List.Item>
                  )}
                >
                </List>
              </CheckboxGroup>
              <p style={{textAlign: 'center'}}>{t('contact:list_contact.limit_contact', {
                limit: roomConfig.LIMIT_CONTACT
              })}</p>
            </div>
          </div>
        ) : (
          <div className="title-contact">{t('contact:list_contact.no_contact')}</div>
        )}
      </React.Fragment>
    );
  }
}

ListContactCreateRoom = Form.create()(ListContactCreateRoom);

export default withNamespaces(['user', 'contact'])(withRouter(ListContactCreateRoom));
