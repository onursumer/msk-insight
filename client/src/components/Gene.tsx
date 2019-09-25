import * as React from "react";
import {Link} from "react-router-dom";

interface IGeneProps
{
    hugoSymbol: string;
    className?: string;
}

class Gene extends React.Component<IGeneProps>
{
    public render()
    {
        return (
            <span className={this.props.className || "pull-left ml-3"}>
                <Link to={`/gene/${this.props.hugoSymbol.toUpperCase()}`}>
                    {this.props.hugoSymbol}
                </Link>
            </span>
        );
    }
}

export default Gene;
