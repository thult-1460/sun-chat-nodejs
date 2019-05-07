import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
    state = {
        greeting: ''
    }

    componentDidMount() {
        axios.get('http://localhost:3001/users/hello')
            .then(result => this.setState({greeting: result.data.sayHi}))
    }

    render() {
        return (
            <div className="App">
              <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                  Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="http://localhost:3001"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h1>{this.state.greeting}</h1>
                </a>
              </header>
            </div>
        );
    }
}

export default App;
