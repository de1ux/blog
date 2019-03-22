import Card from '@material-ui/core/Card/Card';
import CardContent from '@material-ui/core/CardContent/CardContent';
import CardHeader from '@material-ui/core/CardHeader/CardHeader';
import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';
import { RouteProps } from 'react-router';
import { ArticleCode } from './ArticleCode';
import { ArticleImage } from './ArticleImage';
import { loadPostFromLocation, Post } from './Posts';

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
                <CardHeader style={{fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'}} title={this.state.post.humanTitle}/>
                <CardContent style={{fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', fontSize: '16px'}}>
                    <ReactMarkdown renderers={{
                        'code': ArticleCode,
                        'image': ArticleImage
                    }} source={this.state.post.text}/>
                </CardContent>
            </div>}
        </Card>;
    }
}
