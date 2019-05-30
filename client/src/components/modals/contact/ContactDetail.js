import React, { Component } from 'react';
import { Avatar } from 'antd';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class ContactDetail extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { t } = this.props;

    return (
      <React.Fragment>
        <h2 className="title-contact-detail">{t('contact:contact_detail.title_contact_detail')}</h2>
        <div className="contact-detail">
          {this.props.contactDetail == null ? (
            <div className="title-contact-empty">{t('contact:contact_detail.title_contact_empty')}</div>
          ) : (
            <div>
              <div className="contact-detail-avatar">
                {this.props.contactDetail.avatar != null ? (
                  <Avatar size={120} src={this.props.contactDetail.avatar} />
                ) : (
                  <Avatar size={120} icon="user" />
                )}
                <h3 className="title-contact">{this.props.contactDetail.name}</h3>
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.username')}: </b>
                {this.props.contactDetail.username}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.email')}: </b>
                {this.props.contactDetail.email}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.full_address')}: </b>
                {this.props.contactDetail.full_address}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.phone_number')}: </b>
                {this.props.contactDetail.phone_number}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.twitter')}: </b>
                {this.props.contactDetail.twitter}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.github')}: </b>
                {this.props.contactDetail.github}
              </div>
              <div className="form-group">
                <b>{t('contact:contact_detail.google')}: </b>
                {this.props.contactDetail.google}
              </div>
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default withNamespaces(['contact'])(withRouter(ContactDetail));
