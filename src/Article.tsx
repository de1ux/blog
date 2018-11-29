import { Card, CardContent, CardHeader } from '@material-ui/core';
import * as React from 'react';
import { RouteProps } from 'react-router';
import { Code } from './Code';
import { loadPostFromLocation, Post } from './Posts';
import ReactMarkdown = require('react-markdown');

interface ArticleProps {
}

interface ArticleState {
    post?: Post;
}

export class Article extends React.Component<ArticleProps & RouteProps, ArticleState> {
    public readonly state: ArticleState = {
        post: undefined
    };

    componentDidMount() {
        if (this.props.location === undefined) {
            alert('Failed to get location');
            return;
        }
        loadPostFromLocation(this.props.location.pathname).then((post: Post) => {
            this.setState({post: post});
        }).catch((reason: string) => {
            alert(reason);
        });
    }

    render() {
        return <Card>
            {this.state.post && <div>
                <CardHeader style={{fontFamily: 'Montserrat'}} title={this.state.post.humanTitle}/>
                <CardContent style={{fontFamily: 'Montserrat', fontSize: '16px'}}>
                    <ReactMarkdown renderers={{'code': Code}} source={this.state.post.text}/>
                </CardContent>
            </div>}
        </Card>;
    }
}
