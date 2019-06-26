import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import {IMutation} from "../../../server/src/model/Mutation";
import MutationMapper from "../components/MutationMapper";
import {DataStatus} from "../store/DataStatus";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {fetchMutationsByGene} from "../util/MutationDataUtils";
import {loaderWithText} from "../util/StatusHelper";

interface IGeneProps
{
    hugoSymbol: string;
    frequencyStore?: GeneFrequencyStore;
}

@observer
class Gene extends React.Component<IGeneProps>
{
    @observable
    private insightMutations: IMutation[] = [];

    @observable
    private insightStatus: DataStatus = 'pending';

    @computed
    private get hugoSymbol() {
        return this.props.hugoSymbol;
    }

    private get loader() {
        return loaderWithText("Fetching Insight mutations...");
    }

    public render()
    {
        return (
            <div
                style={{
                    fontSize: "0.95rem",
                    paddingBottom: "1.5rem",
                }}
            >
                {
                    this.insightStatus === 'pending' ? this.loader : (
                        <MutationMapper
                            hugoSymbol={this.hugoSymbol}
                            data={this.insightMutations}
                            frequencyStore={this.props.frequencyStore}
                        />
                    )
                }
            </div>
        );
    }

    public componentDidMount()
    {
        fetchMutationsByGene(this.hugoSymbol)
            .then(this.handleInsightDataLoad)
            .catch(this.handleInsightDataError);
    }

    @action.bound
    private handleInsightDataLoad(mutations: IMutation[])
    {
        this.insightStatus = 'complete';
        this.insightMutations = mutations;
    }

    @action.bound
    private handleInsightDataError(reason: any) {
        this.insightStatus = 'error';
    }
}

export default Gene;
