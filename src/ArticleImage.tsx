import * as React from 'react';

export class ArticleImage extends React.PureComponent<{}> {
    render() {
        return (
            <img {...this.props} style={{maxWidth: '400px', border: '1px solid #d2d2d2'}} />
        );
    }
}
