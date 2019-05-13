import React from 'react';
import {withRouter} from 'react-router';
import { Layout, Input } from 'antd'

const { Content } = Layout;

class Home extends React.Component {
    render() {
        return (
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
                <div className="list-message">
                    ...
                    <br />
                    Really
                    <br />...<br />...<br />...<br />
                    long
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />
                    content
                    long
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />...<br />...<br />...
                    <br />...<br />...<br />...<br />
                    content
                </div>
                    <Input.TextArea placeholder="Typing in here !!!" rows={4} style={{resize: 'none'}}/>
            </Content>
        );
    }
}

export default withRouter(Home);
