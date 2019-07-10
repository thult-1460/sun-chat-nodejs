import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { Form, Input, Icon, Button, Select, DatePicker, message, Alert } from 'antd';
import { createTask } from './../../api/task.js';
import { config as taskConfig } from './../../config/task.js';

const { Option } = Select;
const { MonthPicker, RangePicker } = DatePicker;

let id = 0;
let assignees = [];

class CreateTaskForm extends React.Component {
  state = {
    assigneesError: '',
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
          values['users'] = assignees;

          createTask(roomId, values)
            .then(res => {
              message.success(t('messages.create.success'));

              this.setState({
                assigneesError: '',
              });
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
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.roomId != this.props.roomId) {
      this.props.form.resetFields();
    }
  }

  render() {
    const { members, roomId, t } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    let membersHTML = [];

    members.map(member => {
      membersHTML.push(<Option value={member._id}>{member.name}</Option>);
    });

    return (
      <Form onSubmit={this.handleSubmit}>
        <p> {t('title.content')} (*) </p>
        <Form.Item>
          {getFieldDecorator('content', {
            rules: [{ required: true, message: t('validate.content') }],
          })(<Input />)}
        </Form.Item>
        <p> {t('title.pick_time')} (*) </p>
        <Form.Item>
          {getFieldDecorator('range-time-picker', {
            rules: [{ type: 'array', required: true, message: t('validate.time') }],
          })(<RangePicker showTime format={taskConfig.FORMAT_DATE} />)}
        </Form.Item>

        <p> {t('title.assignees')} (*) </p>
        {this.state.assigneesError != '' && <Alert message={this.state.assigneesError} type="error" showIcon />}
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Please select"
          defaultValue={[]}
          onChange={this.handleChangeAssignees}
        >
          {membersHTML}
        </Select>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('title.create')}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default withRouter(withNamespaces(['task'])(Form.create({ name: 'create_task_content' })(CreateTaskForm)));
