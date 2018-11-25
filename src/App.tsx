import { Card, CardContent, CardHeader } from '@material-ui/core';
import * as React from 'react';
import { Code } from './Code';
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
            <Card>
                <CardHeader title={'Building a webapp for pod logs: gRPC with Typescript and Go'}/>
                <CardContent>
                    <ReactMarkdown renderers={{'code': Code}} source={this.state.text}/>
                </CardContent>
            </Card>
        );
    }
}
