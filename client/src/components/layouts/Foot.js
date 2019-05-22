import React from 'react';
import { Layout } from 'antd';
import { checkExpiredToken } from './../../helpers/common';
const { Footer } = Layout;

export default () => checkExpiredToken() && <Footer style={{ textAlign: 'center' }}>Sun Chat ©2018 Section 3</Footer>;
