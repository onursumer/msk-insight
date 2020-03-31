import _ from "lodash";
import {CancerTypeFilter} from "react-mutation-mapper";

import {
    ICountByTumorType,
    IExtendedMutation,
    IMutation,
    ITumorTypeDecomposition
} from "../model/Mutation";
import {
    applyMutationStatusFilter,
    containsCancerType,
    matchesMutationStatus,
    MutationStatusFilter,
    MutationStatusFilterValue
} from "./FilterUtils";


export function isGermlineMutation(mutation: IMutation) {
    return mutation.mutationStatus.toLowerCase() === "germline";
}

export function isSomaticMutation(mutation: IMutation) {
    return mutation.mutationStatus.toLowerCase() === "somatic";
}

export function isPathogenicMutation(mutation: IMutation) {
    return mutation.pathogenic === "1";
}

export function findAllUniqueCancerTypes(mutations: Array<Partial<IMutation>>)
{
    return _.uniq(_.flatten(mutations.map(m => (m.countsByTumorType || []).map(c => c.tumorType))));
}

export function fetchMutationsByGene(hugoSymbol: string): Promise<IMutation[]>
{
    return new Promise<IMutation[]>((resolve, reject) => {
        // TODO use the genome nexus API client
        fetch(`https://www.genomenexus.org/signal/mutation?hugoGeneSymbol=${hugoSymbol}`)
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
    // filter out biallelic mutations, since their count is already included in germline mutations
    // we only use biallelic mutations to add frequency values and additional count fields
    return mutations.map(mutation => {
        const isSomatic = isSomaticMutation(mutation);
        const isGermline = isGermlineMutation(mutation);
        const isPathogenic = isPathogenicMutation(mutation);

        const pathogenicGermlineFrequency = (isGermline && isPathogenic) ?
            calculateOverallFrequency(mutation.countsByTumorType): null;
        const biallelicGermlineFrequency = (isGermline && mutation.biallelicCountsByTumorType) ?
            calculateOverallFrequency(mutation.biallelicCountsByTumorType): null;

        const tumorTypeDecomposition: ITumorTypeDecomposition[] = generateTumorTypeDecomposition(mutation.countsByTumorType,
            mutation.biallelicCountsByTumorType,
            mutation.qcPassCountsByTumorType);

        return {
            ...mutation,
            tumorTypeDecomposition,
            somaticFrequency: isSomatic ? calculateOverallFrequency(mutation.countsByTumorType): null,
            germlineFrequency: isGermline ? calculateOverallFrequency(mutation.countsByTumorType): null,
            pathogenicGermlineFrequency,
            biallelicGermlineFrequency,
            biallelicPathogenicGermlineFrequency: isPathogenic ? biallelicGermlineFrequency: null,
            ratioBiallelicPathogenic: isPathogenic && mutation.biallelicCountsByTumorType && mutation.qcPassCountsByTumorType ?
                calculateTotalVariantRatio(mutation.biallelicCountsByTumorType, mutation.qcPassCountsByTumorType): null
        };
    })
}

function generateTumorTypeDecomposition(countsByTumorType: ICountByTumorType[],
                                        biallelicCountsByTumorType?: ICountByTumorType[],
                                        qcPassCountsByTumorType?: ICountByTumorType[])
{
    let biallelicTumorMap: {[tumorType: string] : ICountByTumorType};
    let qcPassTumorMap: {[tumorType: string] : ICountByTumorType};

    if (biallelicCountsByTumorType && qcPassCountsByTumorType) {
        biallelicTumorMap = _.keyBy(biallelicCountsByTumorType, "tumorType");
        qcPassTumorMap = _.keyBy(qcPassCountsByTumorType, "tumorType");
    }

    return countsByTumorType.map(counts => ({
        ...counts,
        frequency: counts.variantCount / counts.tumorTypeCount,
        biallelicRatio: biallelicTumorMap && qcPassTumorMap ?
            calcBiallelicRatio(biallelicTumorMap[counts.tumorType], qcPassTumorMap[counts.tumorType]): null,
        biallelicVariantCount: biallelicTumorMap && biallelicTumorMap[counts.tumorType] ?
            biallelicTumorMap[counts.tumorType].variantCount: 0
    }));
}

export function calcBiallelicRatio(biallelicCountByTumorType?: ICountByTumorType,
                                   qcPassCountByTumorType?: ICountByTumorType)
{
    const ratio = (biallelicCountByTumorType ? biallelicCountByTumorType.variantCount : 0) /
        (qcPassCountByTumorType ? qcPassCountByTumorType.variantCount : 0);

    return _.isNaN(ratio) ? null: ratio;
}

export function calculateTotalFrequency(mutations: IExtendedMutation[],
                                        mutationStatusFilter: MutationStatusFilter,
                                        cancerTypeFilter?: CancerTypeFilter)
{
    let frequency = null;
    const filtered = mutations.filter(mutation => applyMutationStatusFilter(mutationStatusFilter, mutation));

    if (filtered.length > 0) {
        const variantCount = totalFilteredVariants(filtered, cancerTypeFilter);
        const sampleCount = totalFilteredSamples(filtered, cancerTypeFilter);

        frequency = variantCount / sampleCount;
    }

    return frequency;
}

export function calculateTotalBiallelicRatio(mutations: IExtendedMutation[],
                                             pathogenicGermlineFilter: MutationStatusFilter,
                                             biallelicPathogenicGermlineFilter: MutationStatusFilter,
                                             cancerTypeFilter?: CancerTypeFilter)
{
    let ratio = null;

    const pathogenicGermlineMutations = mutations.filter(
        mutation => applyMutationStatusFilter(pathogenicGermlineFilter, mutation));
    const biallelicPathogenicGermlineMutations = mutations.filter(
        mutation => applyMutationStatusFilter(biallelicPathogenicGermlineFilter, mutation));

    if (pathogenicGermlineMutations.length > 0 && biallelicPathogenicGermlineMutations.length > 0) {
        const combinedBiallelicCounts = combinedBiallelicCountsByTumorType(
            biallelicPathogenicGermlineMutations, cancerTypeFilter);
        const combinedQcPassCounts = combinedQcPassCountsByTumorType(
            pathogenicGermlineMutations, cancerTypeFilter);

        ratio = totalVariants(combinedBiallelicCounts) / totalVariants(combinedQcPassCounts);
    }

    return ratio;
}

function combinedBiallelicCountsByTumorType(mutations: IExtendedMutation[], cancerTypeFilter?: CancerTypeFilter)
{
    return combinedCounts(mutations,
        (mutation: IExtendedMutation) => mutation.biallelicCountsByTumorType,
        cancerTypeFilter);
}

function combinedQcPassCountsByTumorType(mutations: IExtendedMutation[], cancerTypeFilter?: CancerTypeFilter)
{
    return combinedCounts(mutations,
        (mutation: IExtendedMutation) => mutation.qcPassCountsByTumorType,
        cancerTypeFilter);
}

function combinedTumorTypeDecompositions(mutations: IExtendedMutation[], cancerTypeFilter?: CancerTypeFilter)
{
    return combinedCounts(mutations,
        (mutation: IExtendedMutation) => mutation.tumorTypeDecomposition,
        cancerTypeFilter);
}

function combinedCounts(mutations: IExtendedMutation[],
                        getCounts: (mutation: IExtendedMutation) => ICountByTumorType[] | undefined,
                        cancerTypeFilter?: CancerTypeFilter)
{
    return _.flatten(mutations.map(mutation =>
        filterCountsByTumorType(getCounts(mutation), cancerTypeFilter)));
}

function filterCountsByTumorType(counts?: ICountByTumorType[], cancerTypeFilter?: CancerTypeFilter)
{
    return counts ? counts.filter(c => containsCancerType(cancerTypeFilter, c.tumorType)) : [];
}

function totalVariants(counts: ICountByTumorType[]) {
    return counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr, 0) || 0;
}

function totalSamples(counts: ICountByTumorType[]) {
    return counts.map(c => c.tumorTypeCount).reduce((acc, curr) => acc + curr, 0) || 0;
}

export function totalFilteredVariants(mutations: IExtendedMutation[], cancerTypeFilter?: CancerTypeFilter) {
    return totalVariants(
        combinedTumorTypeDecompositions(mutations, cancerTypeFilter)
    );
}

export function totalFilteredSamples(mutations: IExtendedMutation[], cancerTypeFilter?: CancerTypeFilter) {
    return mutations.length > 0 ? totalSamples(
        filterCountsByTumorType(mutations[0].tumorTypeDecomposition, cancerTypeFilter)
    ): 0;
}

export function calculateOverallFrequency(counts: ICountByTumorType[]) {
    return totalVariants(counts) / totalSamples(counts);
}

export function calculateTotalVariantRatio(counts1: ICountByTumorType[], counts2: ICountByTumorType[])
{
    return totalVariants(counts1) / totalVariants(counts2);
}

export function calculateMutationRate(mutation: IExtendedMutation,
                                      cancerTypeFilter?: CancerTypeFilter,
                                      mutationStatusFilter?: MutationStatusFilter)
{
    let frequency = 0;

    // if the only active germline filter is biallelic pathogenic germline,
    // then we need to use biallelic counts instead of overall tumor type count
    if (isGermlineMutation(mutation) &&
        containsOnlyBiallelicGermlineFilterValue(mutationStatusFilter))
    {
        const filteredBiallelicTumorTypeCount = mutation.biallelicCountsByTumorType.filter(
            t => containsCancerType(cancerTypeFilter, t.tumorType)
        );

        frequency = calculateOverallFrequency(filteredBiallelicTumorTypeCount);
    }
    else
    {
        const filteredTumorTypeDecomposition = mutation.tumorTypeDecomposition.filter(
            t => containsCancerType(cancerTypeFilter, t.tumorType) &&
                matchesMutationStatus(mutationStatusFilter, mutation, t)
        );

        frequency = calculateOverallFrequency(filteredTumorTypeDecomposition);
    }

    return 100 * frequency;
}

export function getVariantCount(mutation: IExtendedMutation,
                                tumorTypeDecomposition: ITumorTypeDecomposition,
                                cancerTypeFilter?: CancerTypeFilter,
                                mutationStatusFilter?: MutationStatusFilter)
{
    let count = 0;

    if (containsCancerType(cancerTypeFilter, tumorTypeDecomposition.tumorType) &&
        matchesMutationStatus(mutationStatusFilter, mutation, tumorTypeDecomposition))
    {
        // if the only active germline filter is biallelic pathogenic germline,
        // then we need to use biallelic variant count instead of variant count
        if (isGermlineMutation(mutation) &&
            containsOnlyBiallelicGermlineFilterValue(mutationStatusFilter))
        {
            count = tumorTypeDecomposition.biallelicVariantCount;
        }
        else {
            count = tumorTypeDecomposition.variantCount;
        }
    }

    return count;
}

function containsOnlyBiallelicGermlineFilterValue(mutationStatusFilter?: MutationStatusFilter)
{
    return (
        mutationStatusFilter &&
        _.every(mutationStatusFilter.values,
                v => v === MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE ||
                    v === MutationStatusFilterValue.SOMATIC)
    );
}
