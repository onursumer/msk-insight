import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import {
    MutationMapper
} from 'react-mutation-mapper';

import {IMutation} from "../../../server/src/model/Mutation";
import {DataStatus} from "../store/DataStatus";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {FrequencySummaryCategory} from "../util/ColumnHelper";
import {fetchMutationsByGene} from "../util/MutationDataUtils";

interface IGeneProps
{
    hugoSymbol: string;
    frequencyStore?: GeneFrequencyStore;
}

export const MUTATION_RATE_HELPER = {
    [FrequencySummaryCategory.SOMATIC_DRIVER]: {
        title: "% Somatic Mutant",
        description: "Includes only likely driver mutations",
    },
    [FrequencySummaryCategory.PATHOGENIC_GERMLINE]: {
        title: "% Pathogenic Germline"
    },
    [FrequencySummaryCategory.PERCENT_BIALLELIC]: {
        title: "% Biallelic",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor"
    }
};

function loaderWithText(text: string) {
    return (
        <div className="text-center">
            <i className="fa fa-spinner fa-pulse fa-2x" />
            <div>{text}</div>
        </div>
    );
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

    @computed
    private get frequencyStore() {
        return this.props.frequencyStore || new GeneFrequencyStore();
    }

    @computed
    private get mutationRates() {
        let rates;

        if (this.frequencyStore.geneFrequencyDataStatus === 'complete') {
            const frequencyData = this.frequencyStore.mutationFrequencyData.find(
                f => f.hugoSymbol === this.hugoSymbol);

            if (frequencyData) {
                rates = frequencyData.frequencies.map(f => ({
                    ...MUTATION_RATE_HELPER[f.category],
                    rate: f.frequency * 100
                }));
            }
        }

        return rates;
    }

    private get insightLoader() {
        return loaderWithText("Fetching Insight mutations...");
    }

    private get mutationMapperLoader() {
        return loaderWithText("Annotating with Genome Nexus...");
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
                    this.insightStatus === 'pending' ? this.insightLoader : (
                        <MutationMapper
                            hugoSymbol={this.hugoSymbol}
                            data={this.insightMutations}
                            showTranscriptDropDown={true}
                            genomeNexusUrl="https://www.genomenexus.org/beta"
                            showOnlyAnnotatedTranscriptsInDropdown={true}
                            filterMutationsBySelectedTranscript={true}
                            mutationRates={this.mutationRates}
                            mainLoadingIndicator={this.mutationMapperLoader}
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
