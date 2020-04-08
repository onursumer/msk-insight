import _ from 'lodash';
import {
    AggregatedHotspots,
    DefaultMutationMapperDataFetcher,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations,
    indexAnnotationsByGenomicLocation
} from "react-mutation-mapper";

import {
    MyVariantInfo,
    VariantAnnotation
} from "genome-nexus-ts-api-client"

import {IMutation} from "../model/Mutation";

export class DataFetcher extends DefaultMutationMapperDataFetcher {
    public async fetchVariantAnnotationsIndexedByGenomicLocation(
        mutations: Array<Partial<IMutation>>
    ): Promise<{ [genomicLocation: string]: VariantAnnotation }> {
        let indexedVariantAnnotations = {};

        if (mutations.length > 0 && mutations[0].hugoGeneSymbol) {
            const gene = mutations[0].hugoGeneSymbol;
            const response = await fetch(`/data/variantAnnotation/${gene.toLowerCase()}.json`);
            const variantAnnotations = await response.json();

            indexedVariantAnnotations = indexAnnotationsByGenomicLocation(variantAnnotations);
        }

        return indexedVariantAnnotations;
    }

    public async fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
        mutations: Array<Partial<IMutation>>
    ): Promise<{ [genomicLocation: string]: MyVariantInfo }> {
        let indexedMyVariantAnnotations = {};

        const indexedVariantAnnotations = await this.fetchVariantAnnotationsIndexedByGenomicLocation(mutations);

        if (!_.isEmpty(indexedVariantAnnotations)) {
            indexedMyVariantAnnotations = getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(
                indexedVariantAnnotations);
        }

        return indexedMyVariantAnnotations;
    }

    public async fetchAggregatedHotspotsData(
        mutations: Array<Partial<IMutation>>
    ): Promise<AggregatedHotspots[]> {
        if (mutations.length > 0 && mutations[0].hugoGeneSymbol) {
            const gene = mutations[0].hugoGeneSymbol;
            const response = await fetch(`/data/hotspot/${gene.toLowerCase()}.json`);

            return await response.json();
        }
        else {
            return [];
        }
    }
}