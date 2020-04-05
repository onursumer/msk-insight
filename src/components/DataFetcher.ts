import {
    DefaultMutationMapperDataFetcher,
    indexAnnotationsByGenomicLocation
} from "react-mutation-mapper";

import {
    VariantAnnotation
} from "genome-nexus-ts-api-client"

import {IMutation} from "../model/Mutation";

export class DataFetcher extends DefaultMutationMapperDataFetcher {
    public async fetchVariantAnnotationsIndexedByGenomicLocation(
        mutations: Array<Partial<IMutation>>,
        fields: string[] = ['annotation_summary'],
        isoformOverrideSource: string = 'uniprot'
    ): Promise<{ [genomicLocation: string]: VariantAnnotation }> {
        if (mutations.length > 0 && mutations[0].hugoGeneSymbol) {
            const gene = mutations[0].hugoGeneSymbol;
            const response = await fetch(`/data/variantAnnotation/${gene.toLowerCase()}.json`);
            const variantAnnotations = await response.json();

            return indexAnnotationsByGenomicLocation(variantAnnotations);
        }
        else {
            return {};
        }
    }
}