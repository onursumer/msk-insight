import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';

import {
    annotateMutations,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    Mutation, resolveDefaultsForMissingValues
} from 'react-mutation-mapper';

import {IMutation} from "../../../server/src/model/Mutation";
import MutationMapper from "../components/MutationMapper";
import {DataStatus} from "../store/DataStatus";
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
        return this.props.match.params.hugoSymbol;
    }

    public render()
    {
        return this.insightStatus === 'pending' || this.annotationStatus === 'pending' ? (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        ): (
            <div>
                <MutationMapper
                    hugoSymbol={this.hugoSymbol}
                    data={this.annotatedMutations}
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
