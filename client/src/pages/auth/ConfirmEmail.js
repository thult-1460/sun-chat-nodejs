import React, {Component} from 'react';
import { Row, Col, Icon } from 'antd';
import {confirmEmail} from './../../api/auth';
import { Link } from 'react-router-dom';
import Loading from './../../components/Loading';
import Notifications, { notify } from 'react-notify-toast';

export default class ConfirmEmail extends Component {

    state = {
        confirming: true
    }

    componentDidMount = () => {
        let myColor = { background: '#0E1717', text: "#FFFFFF" };

        confirmEmail(this.props.match.params).then(res => res.data)
        .then(data => {
            this.setState({ confirming: false })
            notify.show(data.msg, "custom", 3000, myColor)
        })
        .catch(err => {
            this.setState({ confirming: false })

            if (err.response.data.error) {
                notify.show(err.response.data.error, "custom", 3000, myColor)
            } else {
                notify.show(err.response.data.msg, "custom", 3000, myColor)
            }
        });
    }

    render = () =>
        <div className='confirm'>
            <Notifications />

            { this.state.confirming
            ? <Loading />
            :   <div style={{ textAlign: 'center', margin: '150px auto'}}>
                   <Link to="/login">Log in!</Link>
                </div>
            }
        </div>
}
