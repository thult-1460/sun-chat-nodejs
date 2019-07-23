import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { Form, Input, Icon, Button, Select, DatePicker, message, Alert } from 'antd';
import { createTask } from './../../api/task.js';
import { config as taskConfig } from './../../config/task.js';

const { TextArea } = Input;
const { Option } = Select;
const { MonthPicker, RangePicker } = DatePicker;

let assignees = [];

class CreateTaskForm extends React.Component {
  state = {
    assigneesError: '',
    filterMembers: [],
    selectedAssignees: [],
  };

  handleSubmit = e => {
    const { roomId, t } = this.props;
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

          createTask(roomId, values)
            .then(res => {
              message.success(t('messages.create.success'));

              // Reset form and hidden modal
              this.props.hideCreateTaskModal(res.data.task_info);
              this.props.resetNewTask();
              this.setState({
                selectedAssignees: [],
                assigneesError: '',
              });
              this.props.form.resetFields();
            })
            .catch(error => {
              message.error(t('messages.create.failed'));
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
    if (nextProps.roomId != this.props.roomId) {
      this.setState({
        filterMembers: nextProps.members,
        selectedAssignees: [],
      });
      this.props.form.resetFields();
    }
  }

  componentDidMount() {
    this.setState({
      filterMembers: this.props.members,
    });
  }

  render() {
    const { roomId, t } = this.props;
    const members = this.state.filterMembers;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    let membersHTML = [];

    members.map(member => {
      membersHTML.push(
        <Option value={member._id} key={member._id}>
          {member.name}
        </Option>
      );
    });

    return (
      <Form onSubmit={this.handleSubmit}>
        <p> {t('title.content')} (*) </p>
        <Form.Item>
          {getFieldDecorator('content', {
            rules: [{ required: true, message: t('validate.content') }],
          })(<TextArea rows={4} />)}
        </Form.Item>
        <p> {t('title.pick_time')} (*) </p>
        <Form.Item>
          {getFieldDecorator('range-time-picker', {
            rules: [{ type: 'array', required: true, message: t('validate.time') }],
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
            {t('title.create')}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default withRouter(withNamespaces(['task'])(Form.create({ name: 'create_task_content' })(CreateTaskForm)));
