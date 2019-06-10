import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import MutationMapper from "../components/MutationMapper";
import {fetchMutationsByGene} from "../util/MutationDataUtils";

interface IGeneProps
{
    match: {
        params: {
            hugoSymbol: string;
        }
    };
}

@observer
class Gene extends React.Component<IGeneProps>
{
    @computed
    private get hugoSymbol() {
        return this.props.match.params.hugoSymbol;
    }

    public render()
    {
        return (
            <div>
                <MutationMapper
                    hugoSymbol={this.hugoSymbol}
                    dataPromise={fetchMutationsByGene(this.hugoSymbol)}
                />
            </div>
        );
    }
}

export default Gene;
