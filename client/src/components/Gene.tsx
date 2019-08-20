import * as React from "react";
import {Link} from "react-router-dom";

import Penetrance, {comparePenetrance} from "./Penetrance";

interface IGeneProps
{
    hugoSymbol: string;
    penetrance: string[];
    hugoSymbolClassName?: string;
    penetranceClassName?: string;
}

class Gene extends React.Component<IGeneProps>
{
    public render()
    {
        return (
            <React.Fragment>
                <span className={this.props.hugoSymbolClassName || "pull-left ml-3"}>
                    <Link to={`/gene/${this.props.hugoSymbol.toUpperCase()}`}>
                        {this.props.hugoSymbol}
                    </Link>
                </span>
                <span className={this.props.penetranceClassName || "pull-right mr-3"}>
                    {this.props.penetrance
                        .sort(comparePenetrance)
                        .map(p => <Penetrance key={p} value={p} />)}
                </span>
            </React.Fragment>
        );
    }
}

export default Gene;
