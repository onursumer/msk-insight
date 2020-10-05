import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import MutationMapper from "../components/MutationMapper";
import {IExtendedMutation} from "../model/Mutation";
import {DataStatus} from "../store/DataStatus";
import EnsemblGeneStore from "../store/EnsemblGeneStore";
import {fetchExtendedMutationsByGene} from "../util/MutationDataUtils";
import {loaderWithText} from "../util/StatusHelper";

interface IGeneProps
{
    hugoSymbol: string;
    cancerTypes?: string[];
}

@observer
class Gene extends React.Component<IGeneProps>
{
    @observable
    private signalMutations: IExtendedMutation[] = [];

    @observable
    private signalStatus: DataStatus = 'pending';

    @computed
    private get hugoSymbol() {
        return this.props.hugoSymbol;
    }

    @computed
    private get geneStore() {
        return new EnsemblGeneStore(this.hugoSymbol);
    }

    private get loader() {
        return loaderWithText("Fetching alterations...");
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
                    this.signalStatus === 'pending' || this.geneStore.ensemblGeneDataStatus === "pending" ?
                        this.loader :
                        <MutationMapper
                            hugoSymbol={this.hugoSymbol}
                            data={this.signalMutations}
                            ensemblGene={this.geneStore.ensemblGeneData}
                            cancerTypes={this.props.cancerTypes}
                        />
                }
            </div>
        );
    }

    // TODO move data fetching and processing into MutationStore
    public componentDidMount()
    {
        fetchExtendedMutationsByGene(this.hugoSymbol)
            .then(this.handleSignalDataLoad)
            .catch(this.handleSignalDataError);
    }

    @action.bound
    private handleSignalDataLoad(mutations: IExtendedMutation[])
    {
        this.signalStatus = 'complete';
        this.signalMutations = mutations;
    }

    @action.bound
    private handleSignalDataError(reason: any) {
        this.signalStatus = 'error';
    }
}

export default Gene;
