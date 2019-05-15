import React, { Component } from 'react';
import i18n from './../i18n';
import ReactCountryFlag from 'react-country-flag';
import { withNamespaces } from 'react-i18next';
import { Button } from 'antd';
import Http from './../utils/Http';
const ButtonGroup = Button.Group;

class ChangeLanguage extends Component {
  changeLanguage = lang => {
    i18n.changeLanguage(lang);
    return new Http().get('/language/' + lang).then(res => {
      window.location.reload();
    });
  };

  render() {
    let resources = Object.keys(i18n.options.resources);
    let renderHtml =
      resources.length > 0 &&
      resources.map((resource, key) => {
        let icon = '';
        switch (resource) {
          case 'vi':
            icon = 'vn';
            break;
          case 'en':
            icon = 'us';
            break;
          default:
            break;
        }

        return (
          <Button
            key={key}
            type={localStorage.getItem('i18nextLng') === resource ? 'danger' : ''}
            onClick={() => this.changeLanguage(resource)}
          >
            <ReactCountryFlag code={icon} svg />
          </Button>
        );
      });

    return <ButtonGroup>{renderHtml}</ButtonGroup>;
  }
}

export default withNamespaces()(ChangeLanguage);
