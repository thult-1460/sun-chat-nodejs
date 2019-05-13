import React, {Fragment} from 'react';
import {register} from './../../api/auth';
import {
  Form, Icon, Input, Button, Alert
} from 'antd';
import Loading from './../../components/Loading';
import {withRouter} from 'react-router';
import {authValidate} from './../../config/validate';
import {PrivateIcon} from './../../components/PrivateIcon';
import {Link} from 'react-router-dom';
const FormItem = Form.Item

class RegisterPage extends React.Component {
    state = {
        isLoading: false,
        errors: {},
        error: ''
    }

    rules = {
        name: {
            validateFirst: true,
            rules: [
                { required: true, message: 'Please fill out Name field' },
                { max: authValidate.name.maxLength, message: 'Name must be ' + authValidate.name.minLength + ' to ' + authValidate.name.maxLength + ' characters'},
                { min: authValidate.name.minLength, message: 'Name must be ' + authValidate.name.minLength + ' to ' + authValidate.name.maxLength + ' characters'}
            ]
        },
        username: {
            validateFirst: true,
            rules: [
                { required: true, message: 'Please fill out Username field' },
                { max: authValidate.username.maxLength, message: 'Username must be ' + authValidate.username.minLength + ' to ' + authValidate.username.maxLength + ' characters'},
                { min: authValidate.username.minLength, message: 'Username must be ' + authValidate.username.minLength + ' to ' + authValidate.username.maxLength + ' characters'}
            ],
        },
        email: {
            validateFirst: true,
            rules: [
                { required: true, message: 'Please fill out Email field' },
                { pattern: '^[a-zA-Z0-9_.+-]+@(?:(?:[a-zA-Z0-9-]+\.)?[a-zA-Z]+\.)?(sun-asterisk)\.com$', message: 'Email must be from Sun Asterisk INC'},
                { max: authValidate.email.maxLength, message: 'The email field may not be greater than ' + authValidate.email.maxLength + '.'},
            ]
        },
        password: {
            validateFirst: true,
            rules: [
                { required: true, message: 'Please fill out Password field' },
                { max: authValidate.password.maxLength, message: 'Password must be ' + authValidate.password.minLength + ' to ' + authValidate.password.maxLength + ' characters'},
                { min: authValidate.password.minLength, message: 'Password must be ' + authValidate.password.minLength + ' to ' + authValidate.password.maxLength + ' characters'},
                {validator: this.validateToNextPassword},
            ],
        },
        password_confirmation: {
            validateFirst: true,
            rules: [
                {required: true, message: 'Please fill out Password Confirmation field' },
                {validator: this.compareToFirstPassword},
            ],
        }
    }
    

    handleConfirmBlur = (e) => {
        const value = e.target.value;
        this.setState({ confirmDirty: this.state.confirmDirty || !!value });
    }

    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('password')) {
            callback('Please make sure that confirm password is same as password.');
        } else {
            callback();
        }
    }

    validateToNextPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['password_confirmation'], { force: true });
        }
        
        callback();
    }

    onSubmit = e => {
        e.preventDefault();
        const {username, name, email, password, password_confirmation} = this.props.form.getFieldsValue();
        const newUser = {username, name, email, password, password_confirmation};

        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.setState({isLoading: true});
                register(newUser)
                    .then(res => {
                        this.props.history.push('/login', res.data.success)
                    })
                    .catch(err => {
                        if (err.response.data.error) {
                            this.setState({
                                error: err.response.data.error,
                                isLoading: false
                            })
                        } else {
                            this.setState({
                                errors: err.response.data,
                                isLoading: false
                            });
                        }
                    })
            }
        });
    };

    render() {
        const {
            errors,
            isLoading,
            error
        } = this.state
        const {form} = this.props;

        return (
            <Fragment>
                <div className="form" style={{height: 560}}>
                    {isLoading && 
                        <Loading />
                    }
                    {error &&
                        <Alert
                            message="Error"
                            type="error"
                            description={error}
                            closable
                        />
                    }
                    <Form layout="horizontal" onSubmit={this.onSubmit}>
                        <h2 className="logo"><Icon style={{ fontSize: 100, color: '#40A9FF' }} theme="outlined" component={PrivateIcon} /></h2>
                        <FormItem 
                            help={
                                form.getFieldError('name')
                                ? form.getFieldError('name')
                                : (errors && errors.name
                                    ? <span className='error-message-from-server'>{errors.name}</span> : ''
                                )}
                        >
                            {form.getFieldDecorator('name', this.rules.name)(
                                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder='Name' />
                            )}
                        </FormItem>
                        <FormItem 
                            help={
                                form.getFieldError('username')
                                ? form.getFieldError('username')
                                : (errors && errors.username
                                    ? <span className='error-message-from-server'>{errors.username}</span> : ''
                                )}
                        >
                            {form.getFieldDecorator('username', this.rules.username)(
                                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder='Username' />
                            )}
                        </FormItem>
                        <FormItem 
                            help={
                                form.getFieldError('email')
                                ? form.getFieldError('email')
                                : (errors && errors.email
                                    ? <span className='error-message-from-server'>{errors.email}</span> : ''
                                )}
                        >
                            {form.getFieldDecorator('email', this.rules.email)(
                                <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder='Email'/>
                            )}
                        </FormItem>
                        <FormItem 
                            help={
                                form.getFieldError('password')
                                ? form.getFieldError('password')
                                : (errors && errors.password
                                    ? <span className='error-message-from-server'>{errors.password}</span> : ''
                                )}
                        >
                            {form.getFieldDecorator('password', this.rules.password)(
                                <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type='password' placeholder='Password' />
                            )}
                        </FormItem>
                        <FormItem 
                            help={
                                form.getFieldError('password_confirmation')
                                ? form.getFieldError('password_confirmation')
                                : (errors && errors.password_confirmation
                                    ? <span className='error-message-from-server'>{errors.password_confirmation}</span> : ''
                                )}
                        >
                            {form.getFieldDecorator('password_confirmation', this.rules.password_confirmation)(
                                <Input prefix={<Icon onBlur={this.handleConfirmBlur}  type="lock" style={{ fontSize: 13 }} />} type='password' placeholder='Password Confirmation' />
                            )}
                        </FormItem>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" className="login-form-button">
                            Register
                          </Button>
                          Or <Link to="/login">Log in!</Link>
                        </Form.Item>
                    </Form>
                </div>
            </Fragment>
        );
    }
}

RegisterPage = Form.create()(RegisterPage);

export default withRouter(RegisterPage);
