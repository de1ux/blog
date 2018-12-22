import * as React from 'react';
import { createRef } from 'react';
import Prism = require('prismjs');

require('../node_modules/prismjs/themes/prism-tomorrow.css');
require('../node_modules/prismjs/components/prism-go.min');
require('../node_modules/prismjs/components/prism-yaml.min');
require('../node_modules/prismjs/components/prism-protobuf.min');
require('../node_modules/prismjs/components/prism-bash.min');
require('../node_modules/prismjs/plugins/line-numbers/prism-line-numbers.min');

interface CodeProps {
    value: string;
    language: string;
}

export class Code extends React.PureComponent<CodeProps> {
    private codeRef = createRef<HTMLPreElement>();

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
