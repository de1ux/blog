import * as React from 'react';
import { RouteProps } from 'react-router';

interface DistortionProps {
    text: string;
}

interface DistortionState {
}

export class Distortion extends React.Component<DistortionProps & RouteProps, DistortionState> {
    public readonly state: DistortionState = {};

    render() {
        return <div>
            <canvas
            {this.props.text}
        </div>;
    }
}
