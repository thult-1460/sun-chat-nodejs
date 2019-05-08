import React from 'react';
import Main from './../components/layouts/Main';
import {getData} from './../api/example';

class Home extends React.Component {
    state = {
        greeting: ''
    }

    componentDidMount() {
        getData().then(res => {
            this.setState({
                greeting: res.data.sayHi
            });
        });
    }

    render() {
        return (
            <Main>
                <h1>{this.state.greeting}</h1>
            </Main>
        );
    }
}

export default Home;
