import React from 'react';
import { Layout, Row, Col, Menu, Icon, Badge, Dropdown, Avatar, Popover } from 'antd'
import {checkExpiredToken} from './../../helpers/common';
const { Header } = Layout;

const menu = (
    <Menu>
        <Menu.Item>
            <a>Logout</a>
        </Menu.Item>
    </Menu>
);

const content = (
    <div>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
        <p>Content</p>
    </div>
);

export default () => (
    checkExpiredToken() && <Header style={{ background: '#fff', padding: 0 }}>
        <Row type="flex" justify="end" align="middle">
            <Col span={3}>
                <Badge className="header-icon" dot>
                    <a href="javascript:;">
                        <Icon type="mail" />
                    </a>
                </Badge>
                <Popover content={content} title="Title" trigger="click">
                    <Badge className="header-icon" dot>
                        <a href="#">
                            <Icon type="notification" />
                        </a>
                    </Badge>
                </Popover>
                <Popover content={content} title="Create Room" trigger="click">
                    <Badge className="header-icon">
                        <a href="#">
                            <Icon type="plus-circle" />
                        </a>
                    </Badge>
                </Popover>
                
            </Col>
            <Col span={3}>
                <Dropdown overlay={menu}>
                    <a className="ant-dropdown-link" href="#">
                        <Avatar style={{ verticalAlign: 'middle'}}>Abc</Avatar> 
                        <Icon type="down" />
                    </a>
                </Dropdown>
            </Col>
        </Row>
    </Header>
)
