import * as React from "react";
import Link from 'next/link'

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
                <Link href={`/gene/${this.props.hugoSymbol.toUpperCase()}`}>
                    <a>{this.props.hugoSymbol}</a>
                </Link>
            </span>
        );
    }
}

export default Gene;
