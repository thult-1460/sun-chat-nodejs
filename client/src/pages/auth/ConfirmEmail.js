import React, { Component } from 'react';
import { confirmEmail } from './../../api/auth';
import { Link } from 'react-router-dom';
import Loading from './../../components/Loading';
import Notifications, { notify } from 'react-notify-toast';
import { Button, Alert } from 'antd';
import { resendEmail } from './../../api/auth.js';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';
let myColor = { background: '#0E1717', text: '#FFFFFF' };

class ConfirmEmail extends Component {
  state = {
    confirming: true,
    isResendEmail: false,
    userId: '',
    activeToken: '',
    isLoading: false,
    isErr: false,
    error: '',
  };

  componentDidMount = () => {
    confirmEmail(this.props.match.params)
      .then(res => res.data)
      .then(data => {
        this.setState({ confirming: false });
        notify.show(data.msg, 'custom', 3000, myColor);
      })
      .catch(err => {
        this.setState({ confirming: false });

        if (err.response.data.resend_email) {
          this.setState({
            isResendEmail: true,
            userId: err.response.data.user_id,
            activeToken: err.response.data.active_token,
          });
        }

        if (err.response.data.error) {
          notify.show(err.response.data.error, 'custom', 3000, myColor);
        } else {
          notify.show(err.response.data.msg, 'custom', 3000, myColor);
        }
      });
  };

  reSendActiveEmail = () => {
    this.setState({
      isLoading: true,
    });

    const { userId, activeToken } = this.state;
    resendEmail({ _id: userId, active_token: activeToken })
      .then(res => {
        this.setState({
          isLoading: false,
          isResendEmail: false,
        });
        notify.show(res.data.message, 'custom', 5000, myColor);
      })
      .catch(error => {
        this.setState({
          isLoading: false,
          isErr: true,
          error: error.response.data.error,
        });
      });
  };

  render() {
    const { t } = this.props;
    return (
      <div className="confirm">
        {this.state.isLoading && <Loading />}
        <Notifications />
        {this.state.isErr && (
          <Alert message={t('resend_active_mail_error')} type="error" description={this.state.error} />
        )}
        {this.state.isResendEmail ? (
          <div style={{ textAlign: 'center', margin: '150px auto' }}>
            <Button onClick={this.reSendActiveEmail}> {t('resend_active_mail')}</Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: '150px auto' }}>
            <Link to="/login">{t('login')}</Link>
          </div>
        )}
      </div>
    );
  }
}
export default withNamespaces(['auth'])(withRouter(ConfirmEmail));
