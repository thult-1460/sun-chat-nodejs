import React from 'react';
import { Spin } from 'antd';

export default () => (
    <div className="page-loading">
        <Spin tip="Loading..." />
    </div>
)
