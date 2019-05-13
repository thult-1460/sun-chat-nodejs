import React from 'react';
import Foot from './Foot';
import Head from './Head';
import Sidebar from './Sidebar';
import { Layout } from 'antd'

export default ({ children }) => (
    <React.Fragment>
        <Layout>
            <Sidebar />
            <Layout style={{ marginLeft: 200 }}>
                <Head /> { children }
                <Foot />
            </Layout>
        </Layout>
    </React.Fragment>
)
