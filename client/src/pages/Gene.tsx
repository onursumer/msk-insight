import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import {IExtendedMutation} from "../../../server/src/model/Mutation";
import MutationMapper from "../components/MutationMapper";
import {DataStatus} from "../store/DataStatus";
import EnsemblGeneStore from "../store/EnsemblGeneStore";
import {fetchExtendedMutationsByGene} from "../util/MutationDataUtils";
import {loaderWithText} from "../util/StatusHelper";

interface IGeneProps
{
    hugoSymbol: string;
}

@observer
class Gene extends React.Component<IGeneProps>
{
    @observable
    private insightMutations: IExtendedMutation[] = [];

    @observable
    private insightStatus: DataStatus = 'pending';

    @computed
    private get hugoSymbol() {
        return this.props.hugoSymbol;
    }

    @computed
    private get geneStore() {
        return new EnsemblGeneStore(this.hugoSymbol);
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
                    this.insightStatus === 'pending' || this.geneStore.ensemblGeneDataStatus === "pending" ?
                        this.loader :
                        <MutationMapper
                            hugoSymbol={this.hugoSymbol}
                            data={this.insightMutations}
                            ensemblGene={this.geneStore.ensemblGeneData}
                        />
                }
            </div>
        );
    }

    // TODO move data fetching and processing into MutationStore
    public componentDidMount()
    {
        fetchExtendedMutationsByGene(this.hugoSymbol)
            .then(this.handleInsightDataLoad)
            .catch(this.handleInsightDataError);
    }

    @action.bound
    private handleInsightDataLoad(mutations: IExtendedMutation[])
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
