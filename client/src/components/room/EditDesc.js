import React, { Component } from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
import { editDescOfRoom } from '../../api/room';
import { Button, Input, message } from 'antd';
const { TextArea } = Input;

class EditDesc extends Component {
  state = {
    desc: this.props.roomDesc,
  }
  handleChangeDesc = (e) => {
    this.setState({ desc: e.target.value })
  }

  handleBack = () => {
    this.props.handleVisible();
  }

  handleEdit = () => {
    const { desc } = this.state;
    const roomId = this.props.roomId;

    editDescOfRoom(roomId, { desc })
      .then(res => {
        message.success(res.data.message);
        this.props.handleVisible();
      })
      .catch(err => {
        if (err.response.data.error) {
          message.error(err.response.data.error);
        }
      });
  }

  render() {
    const { t } = this.props;
    return (
      <React.Fragment>
        <h2 className="title-contact">
          {t('title.edit-desc-of-room')}
        </h2>
        <TextArea rows={12} defaultValue={this.state.desc} onChange={this.handleChangeDesc} size="large" />
        <Button.Group className="btn-group-edit-desc-of-room" >
          <Button type="primary" onClick={this.handleEdit}>
            {t('button.submit')}
          </Button>
          <Button onClick={this.handleBack}>
            {t('button.back')}
          </Button>
        </Button.Group>
      </React.Fragment>
    );
  }
}

export default withNamespaces('room')(withRouter(EditDesc));
