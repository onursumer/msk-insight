import _ from "lodash";
import {extractGenomicLocation, genomicLocationString} from "react-mutation-mapper";

import {ICountByTumorType, IExtendedMutation, IMutation} from "../../../server/src/model/Mutation";

export function fetchMutationsByGene(hugoSymbol: string): Promise<IMutation[]>
{
    return new Promise<IMutation[]>((resolve, reject) => {
        fetch(`/api/mutation?hugoSymbol=${hugoSymbol}`)
            .then(response => resolve(response.json()))
            .catch(err => reject(err));
    });
}

export function fetchExtendedMutationsByGene(hugoSymbol: string): Promise<IExtendedMutation[]>
{
    return new Promise<IExtendedMutation[]>((resolve, reject) => {
        fetchMutationsByGene(hugoSymbol)
            .then(mutations => resolve(extendMutations(mutations)))
            .catch(err => reject(err));
    });
}

/**
 * Extends given mutations with frequency and biallelic count information.
 */
export function extendMutations(mutations: IMutation[]): IExtendedMutation[]
{
    const biallelicMutationIndex = _.keyBy(
        mutations.filter(m => m.biallelic === "1" && extractGenomicLocation(m) !== undefined),
        m => genomicLocationString(extractGenomicLocation(m)!));

    // filter out biallelic mutations, since their count is already included in germline mutations
    // we only use biallelic mutations to add frequency values and additional count fields
    return mutations.filter(m => m.biallelic !== "1").map(mutation => {
        const isSomatic = mutation.mutationStatus.toLowerCase() === "somatic";
        const isGermline = mutation.mutationStatus.toLowerCase() === "germline";
        const genomicLocation = extractGenomicLocation(mutation);
        const biallelicMutation = isGermline && genomicLocation ?
            biallelicMutationIndex[genomicLocationString(genomicLocation)] : undefined;

        return {
            ...mutation,
            somaticFrequency: isSomatic ? calculateOverallFrequency(mutation.countsByTumorType) : 0,
            germlineFrequency: isGermline ? calculateOverallFrequency(mutation.countsByTumorType) : 0,
            pathogenicGermlineFrequency:
                (mutation.mutationStatus.toLowerCase() === "germline" && mutation.pathogenic === "1") ?
                    calculateOverallFrequency(mutation.countsByTumorType) : 0,
            biallelicGermlineFrequency: biallelicMutation ? calculateOverallFrequency(biallelicMutation.countsByTumorType) : 0,
            biallelicPathogenicGermlineFrequency: (biallelicMutation && biallelicMutation.pathogenic === "1") ?
                    calculateOverallFrequency(biallelicMutation.countsByTumorType) : 0,
            biallelicCountsByTumorType: biallelicMutation ? biallelicMutation.countsByTumorType : undefined
        };
    })
}

function calculateOverallFrequency(counts: ICountByTumorType[]) {
    const totalVariant = counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr) || 0;
    const totalSamples = counts.map(c => c.tumorTypeCount).reduce((acc, curr) => acc + curr) || 0;

    return totalVariant / totalSamples;
}

