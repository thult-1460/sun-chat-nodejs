import React from 'react';
import 'antd/dist/antd.css';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { Form, Input, Icon, Button, Select, DatePicker, message, Alert, Modal } from 'antd';
import { editTask } from './../../api/task.js';
import { config as taskConfig } from './../../config/task.js';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { MonthPicker, RangePicker } = DatePicker;

let assignees = [];

class ModalEditTask extends React.Component {
  state = {
    assigneesError: '',
    filterMembers: [],
    selectedAssignees: [],
  };

  handleSubmit = e => {
    const { roomId, t, task } = this.props;
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      if (!err) {
        if (assignees.length == 0) {
          this.setState({
            assigneesError: t('validate.assignees'),
          });
        } else {
          values['start'] = values['range-time-picker'][0];
          values['due'] = values['range-time-picker'][1];
          values['assignees'] = assignees;

          editTask(roomId, task.id, values)
            .then(res => {
              message.success(t('messages.edit.success'));

              // Reset form and hidden modal
              this.props.hiddenModal();
              this.props.updateEditedTaskIntoList(res.data.task_info);
              this.props.form.resetFields();
              this.setState({
                assigneesError: '',
              });
            })
            .catch(error => {
              message.error(t('messages.edit.failed'));
            });
        }
      }
    });
  };

  handleChangeAssignees = value => {
    assignees = value;

    this.setState({
      selectedAssignees: value,
    });
  };

  handleSearch = value => {
    const { members } = this.props;
    let filterMembers = [];

    members.map(member => {
      if (member.name.includes(value)) {
        filterMembers.push(member);
      }
    });

    this.setState({
      filterMembers: filterMembers,
    });
  };

  componentWillReceiveProps(nextProps) {
    this.setState({
      filterMembers: nextProps.members,
      selectedAssignees: nextProps.task.assignees,
    });

    assignees = nextProps.task.assignees;
  }

  componentDidMount() {
    this.setState({
      filterMembers: this.props.members,
    });
  }

  render() {
    const { roomId, t, task } = this.props;
    const members = this.state.filterMembers;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    let membersHTML = [];

    members.map(member => {
      membersHTML.push(
        <Option value={member._id.toString()} key={member._id}>
          {member.name}
        </Option>
      );
    });

    return (
      <Modal
        title={t('title.edit')}
        visible={this.props.visibleModal}
        onCancel={this.props.hiddenModal}
        width="35%"
        footer={null}
      >
        <Form onSubmit={this.handleSubmit}>
          <Form.Item>
            {getFieldDecorator('content', {
              rules: [{ required: true, message: t('validate.content') }],
              initialValue: task.content,
            })(<TextArea rows={4} />)}
          </Form.Item>
          <p> {t('title.pick_time')} (*) </p>
          <Form.Item>
            {getFieldDecorator('range-time-picker', {
              rules: [{ type: 'array', required: true, message: t('validate.time') }],
              initialValue: [moment(task.start), moment(task.due)],
            })(<RangePicker showTime format={t('format_date')} />)}
          </Form.Item>

          <p> {t('title.assignees')} (*) </p>
          {this.state.assigneesError != '' && <Alert message={this.state.assigneesError} type="error" showIcon />}
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Please select"
            defaultValue={[]}
            value={this.state.selectedAssignees}
            filterOption={false}
            onChange={this.handleChangeAssignees}
            onSearch={this.handleSearch}
          >
            {membersHTML}
          </Select>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="create-task-modal">
              {t('title.edit')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}

export default withRouter(withNamespaces(['task'])(Form.create({ name: 'create_task_content' })(ModalEditTask)));
