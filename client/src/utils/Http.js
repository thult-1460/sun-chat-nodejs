import axios from 'axios';
import systemConfig from './../config/configServer';

const DEFAULT_CONFIG = {
  baseURL: systemConfig.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': localStorage.getItem('i18nextLng') || systemConfig.LOCALE,
    'X-Requested-With': 'XMLHttpRequest',
  },
  // enable credentials to send cookie to server.
  //withCredentials: true,
};

export const statusCode = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export default class Http {
  constructor(config = {}) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
  }

  authenticated() {
    const storedData = localStorage.getItem('token'); // get token from localstorage
    if (storedData) {
      this.config.headers.authorization = storedData;
    }

    return this;
  }

  get(url, params, config = {}) {
    return this.executeRequest(url, { ...config, params });
  }

  post(url, data, config = {}) {
    return this.executeRequest(url, { method: 'post', ...config, data });
  }

  patch(url, data, config = {}) {
    return this.executeRequest(url, { method: 'patch', ...config, data });
  }

  put(url, data, config = {}) {
    return this.executeRequest(url, { method: 'put', ...config, data });
  }

  delete(url, data, config = {}) {
    return this.executeRequest(url, { method: 'delete', ...config, data });
  }

  executeRequest(url, config) {
    const finalHeaderConfig = { ...this.config.headers, ...config.headers };
    const finalConfig = { ...this.config, url, ...config, headers: { ...finalHeaderConfig } };

    return axios
      .request(finalConfig)
      .then(response => {
        return Promise.resolve(response);
      })
      .catch(error => {
        if (error.response && error.response.status === statusCode.UNAUTHORIZED) {
          if (url !== '/login') {
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      });
  }
}
