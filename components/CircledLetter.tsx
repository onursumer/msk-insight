import * as React from "react";

export interface ICircledLetterProps
{
    color: string;
    letter: string;
}

class CircledLetter extends React.Component<ICircledLetterProps>
{
    public render() {
        return (
            <span className="fa-stack" style={{fontSize: "0.5rem"}}>
                <i className="fa fa-circle fa-stack-2x" style={{color: this.props.color}}/>
                <strong className="fa-stack-1x fa-inverse">{this.props.letter}</strong>
            </span>
        )
    }
}

export default CircledLetter;
