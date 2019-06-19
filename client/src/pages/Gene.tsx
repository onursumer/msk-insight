import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import {
    annotateMutations,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    Mutation,
    MutationMapper,
    resolveDefaultsForMissingValues
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


@observer
class Gene extends React.Component<IGeneProps>
{
    @observable
    private annotatedMutations: Mutation[] = [];

    @observable
    private insightMutations: IMutation[] = [];

    @observable
    private insightStatus: DataStatus = 'pending';

    @observable
    private annotationStatus: DataStatus = 'pending';

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
                    rate: f.frequency
                }));
            }
        }

        return rates;
    }

    public render()
    {
        return this.insightStatus === 'pending' || this.annotationStatus === 'pending' ? (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        ): (
            <div style={{fontSize: "0.95rem", paddingBottom: "1.5rem"}}>
                <MutationMapper
                    hugoSymbol={this.hugoSymbol}
                    data={this.annotatedMutations}
                    showTranscriptDropDown={true}
                    mutationRates={this.mutationRates}
                />
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

        fetchVariantAnnotationsIndexedByGenomicLocation(mutations, ["annotation_summary", "hotspots"], "mskcc")
            .then(this.handleVariantAnnotationDataLoad)
            .catch(this.handleVariantAnnotationDataError)
    }

    @action.bound
    private handleInsightDataError(reason: any) {
        this.insightStatus = 'error';
    }

    @action.bound
    private handleVariantAnnotationDataLoad(indexedVariantAnnotations: {[genomicLocation: string]: any})
    {
        this.annotationStatus = 'complete';

        const mutations = annotateMutations(this.insightMutations, indexedVariantAnnotations);
        resolveDefaultsForMissingValues(mutations);

        this.annotatedMutations = mutations as Mutation[];
    }

    @action.bound
    private handleVariantAnnotationDataError(reason: any) {
        this.annotationStatus = 'error';
    }
}

export default Gene;
