import * as React from 'react';
import ReactMarkdown = require('react-markdown');

let a = require('../articles/asd.md');

interface AppProps {
}

interface AppState {
    text: string;
}

export class App extends React.Component<AppProps, AppState> {

    public readonly state: AppState = {
        text: '',
    };

    componentDidMount() {
        fetch(a).then((res) => res.text().then((text) => {
            this.setState({text: text});
        }));
    }

    render() {
        return (
            <ReactMarkdown source={this.state.text}/>
        );
    }
}
