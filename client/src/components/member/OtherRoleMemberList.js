import React from 'react';
import { withNamespaces } from 'react-i18next';
import { withRouter } from 'react-router';

class OtherRoleMemberList extends React.Component {
  render() {
    const { t } = this.props;
    const { adminRows, memberRows, readOnlyRows } = this.props;

    return (
      <div className="members-content">
        <div>
          <h4 className="title-role">
            {t('role.admin')}({adminRows.length}){' '}
          </h4>
          {adminRows}
        </div>
        <div className="member">
          <h4 className="title-role">
            {t('role.member')}({memberRows.length}){' '}
          </h4>
          {memberRows}
        </div>
        <div className="member">
          <h4 className="title-role">
            {t('role.readonly')}({readOnlyRows.length}){' '}
          </h4>
          {readOnlyRows}
        </div>
      </div>
    );
  }
}

export default withNamespaces(['member'])(withRouter(OtherRoleMemberList));
