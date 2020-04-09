import _ from 'lodash';
import {
    DefaultMutationMapperDataFetcher,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations
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

        const mutation = mutations.find(m => !_.isEmpty(m.hugoGeneSymbol));

        if (mutation) {
            const gene = mutation.hugoGeneSymbol!;
            // TODO cache last few genes?
            const response = await fetch(`/data/variantAnnotation/${gene.toLowerCase()}.json`);
            indexedVariantAnnotations = await response.json();
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
}
