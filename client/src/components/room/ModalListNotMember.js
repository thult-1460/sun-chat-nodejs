import React, { PureComponent } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import 'antd/dist/antd.css';
import {getListContactNotMember, loadMessages} from '../../api/room';
import { addMembers } from '../../api/room';
import {Form, Input, Modal, Checkbox, Select, Avatar, List, message, Badge, Icon} from 'antd';
import { getUserAvatarUrl } from './../../helpers/common';

class ModalListNotMember extends PureComponent {
  data = [];

  state = {
    checkedList: [],
    checkedAll: false,
    selectedList: [],
    modalVisible: false,
  };
  constructor(props) {
    super(props);
  }

  fetchData(subName = '') {
    const roomId = this.props.match.params.id;

    getListContactNotMember({ roomId, subName })
      .then(res => {
        this.data = res.data;
        this.setState({
          checkedList: [],
          checkedAll: false,
          selectedList: [],
        });
      })
      .catch(err => {
        message.error(err.response.data.error);
      });
  }

  componentDidMount() {
    this.fetchData();
  }

  resetListSelect() {
    var selectedList = [],
      arrSelect = this.props.form.getFieldsValue();

    this.state.checkedList.map(item => {
      selectedList[item] = arrSelect[item];
    });
    this.setState({
      selectedList,
    });
  }

  handleCancelSubmit = () => {
    this.changeStateModal();
  };

  handleSubmit = () => {
    var { checkedList, selectedList } = this.state;

    if (checkedList.length) {
      var users = [];

      checkedList.map(item => {
        users.push({
          _id: item,
          role: selectedList[item],
        });
      });

      addMembers({roomId: this.props.match.params.id, users: users})
        .then(res => {
          if (res.data.success) {
            message.success(res.data.message);
            this.fetchData();
          } else {
            message.error(res.data.message);
          }

          this.changeStateModal();
        })
        .catch(err => {
          message.error(err.response.data.error);
      });
    }
  };

  handleCheckAll = e => {
    var checkedList = [],
      checkedAll = false;

    if (e.target.checked) {
      this.data.map(item => {
        checkedList.push(item._id);
      });
      checkedAll = true;
    }

    this.setState({
      checkedList,
      checkedAll,
    });

    this.resetListSelect();
  };

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
  };

  handleSearch = e => {
    this.fetchData(e.target.value.trim());
  };

  handleSelectRole = () => {
    this.resetListSelect();
  };

  changeStateModal = () => {
    const { modalVisible } = this.state;
    this.setState({
      modalVisible: !modalVisible
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.roomId && prevProps.roomId !== this.props.match.params.id) {
      this.fetchData();
    }
  }

  render() {
    const { t, form } = this.props;
    const { checkedList, checkedAll, modalVisible } = this.state;

    return (
      <div>
        <Badge className="header-icon adding-member-icon" type="primary">
          <a href="javascript:;" onClick={this.changeStateModal}>
            <Icon type="plus-circle" />
          </a>
        </Badge>
      <Modal
        destroyOnClose
        title={t('room:title.add_member')}
        visible={modalVisible}
        onOk={this.handleSubmit}
        onCancel={this.handleCancelSubmit}
        okText={t('room:button.add_member')}
        cancelText={t('room:button.cancel')}
        width="750px"
      >
        <React.Fragment>
            <div>
              <Checkbox onChange={this.handleCheckAll} checked={checkedAll}>
                {t('user:button.check_all')}
              </Checkbox>
              <Input.Search
                placeholder="Search name/email"
                style={{ width: 400, float: 'right' }}
                onChange={this.handleSearch}
              />
              {this.data.length > 0 ? (
              <div className="infinite-container" style={{ height: '400px', overflow: 'auto' }}>
                <Checkbox.Group onChange={this.handleCheckBox} value={checkedList}>
                  <List
                    style={{ padding: '5px' }}
                    dataSource={this.data}
                    renderItem={item => (
                      <List.Item key={item._id}>
                        <Checkbox className="item-checkbox" value={item._id} key={item._id} />
                        <List.Item.Meta
                          avatar={<Avatar src={getUserAvatarUrl(item.avatar)} />}
                          title={<a href="https://ant.design">{item.name}</a>}
                          description={item.email}
                        />
                        <Form.Item>
                          {form.getFieldDecorator(item._id, {
                            initialValue: '1',
                          })(
                            <Select style={{ width: 130 }} onBlur={this.handleSelectRole}>
                              <Select.Option value="0" key={item._id}>
                                {t('member:role.admin')}
                              </Select.Option>
                              <Select.Option value="1" key={item._id}>
                                {t('member:role.member')}
                              </Select.Option>
                              <Select.Option value="2" key={item._id}>
                                {t('member:role.readonly')}
                              </Select.Option>
                            </Select>
                          )}
                        </Form.Item>
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
      </div>
    );
  }
}

ModalListNotMember = Form.create()(ModalListNotMember);

export default withNamespaces(['room', 'contact'])(withRouter(ModalListNotMember));
