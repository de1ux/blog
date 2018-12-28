import * as React from 'react';
import { createRef } from 'react';

interface ToysState {
    height: number;
    width: number;
}

interface ToysProps {
    parent: HTMLDivElement | null;
}

export class Toys extends React.Component<ToysProps, ToysState> {
    private canvasRef = createRef<HTMLCanvasElement>();

    constructor(props: ToysProps) {
        super(props);
        this.state = {
            height: 0,
            width: 0,
        };
    }

    componentDidMount() {
        if (this.props.parent === null) {
            return;
        }
        console.log(this.props.parent.clientWidth);
        this.setState({
            height: parent.innerHeight,
            width: parseInt(window.getComputedStyle(this.props.parent!!).width!!.replace('px', ''))
        });

        let ctx = this.canvasRef.current!!.getContext('2d')!!;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(200, 200);
        ctx.stroke();
    }

    render() {
        return (
            <canvas style={{
                position: 'absolute'
            }} ref={this.canvasRef} height={this.state.height} width={this.state.width}/>
        );
    }
}
