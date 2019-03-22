import * as React from 'react';
import * as Prism from 'prismjs';

require('../node_modules/prismjs/themes/prism-tomorrow.css');
require('../node_modules/prismjs/components/prism-go.min');
require('../node_modules/prismjs/components/prism-yaml.min');
require('../node_modules/prismjs/components/prism-protobuf.min');
require('../node_modules/prismjs/components/prism-bash.min');
require('../node_modules/prismjs/components/prism-typescript.min');
require('../node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min');

interface CodeProps {
    value: string;
    language: string;
}

export class ArticleCode extends React.PureComponent<CodeProps> {
    private codeRef = React.createRef<HTMLPreElement>();

    componentDidMount() {
        if (!this.codeRef.current) {
            return;
        }
        Prism.highlightElement(this.codeRef.current);
    }

    render() {
        return (
            <div>
                <pre className={`line-numbers language-${this.props.language}`}
                     style={{
                         fontSize: '14px'
                     }}
                     ref={this.codeRef}>
                    <code>{this.props.value}</code>
                </pre>
            </div>
        );
    }
}
