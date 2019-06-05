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
  static defaultProps = {
    limit: roomConfig.LIMIT_CONTACT,
  };

  state = {
    contacts: [],
    error: '',
    checkAll: false,
    indeterminate: false,
    allItemId: [],
    checkedList: [],
    role: ROLES.member.value,
    searchText: '',
  };

  fetchData = (searchText) => {
    getLimitListContacts(this.props.limit, searchText)
      .then(res => {
        const { contacts, allItemId } = this.state;
        res.data.result.map(item => {
          contacts.push(item);
          allItemId.push(item._id);
        });
        this.setState({
          contacts,
          searchText,
          allItemId,
        });
      })
      .catch(err => {
        if (err.response) {
          this.setState({
            error: err.response.data.error,
          });
        }
      });
  };

  componentDidMount() {
    const { searchText } = this.state;
    this.fetchData(searchText);
  }

  setAvatar(avatar) {
    if (avatar) {
      return <Avatar src={avatar} />;
    }

    return <Avatar icon="user" size="large" />;
  }

  handleSearch(searchText) {
    this.setState({
      contacts: [],
      contactDetail: null,
    });

    this.fetchData(searchText);
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

    let options = Object.values(ROLES).map(role => <Option value={role.value}>{t('member:' + role.title)}</Option>)

    return (
      <React.Fragment>
        {contacts.length > 0 ? (
          <div>
            {error && <Alert message={t('user:error_title')} type="error" description={error} />}
            <Checkbox indeterminate={indeterminate} onChange={this.handleCheckAll} checked={checkAll}>
              {t('button.check_all')}
            </Checkbox>
            <Search
              placeholder={t('contact:list_contact.btn_search_placeholder')}
              onSearch={searchText => this.handleSearch(searchText)}
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
                        value={item._id}
                        key={item._id}
                      />
                      <List.Item.Meta
                        avatar={this.setAvatar(item.avatar)}
                        title={<a href="#">{item.name}</a>}
                        description={item.email}
                      />
                      <Form.Item>
                      {form.getFieldDecorator(item._id, {
                        initialValue: 1,
                      })(
                        <Select style={{ width: 130 }} onBlur={this.handleSelectRole}>
                          {options}
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

export default withNamespaces(['user', 'contact', 'member'])(withRouter(ListContactCreateRoom));
