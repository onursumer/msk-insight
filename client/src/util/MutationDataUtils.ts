import _ from "lodash";

import {
    ICountByTumorType,
    IExtendedMutation,
    IMutation,
    ITumorTypeDecomposition
} from "../../../server/src/model/Mutation";

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
    // filter out biallelic mutations, since their count is already included in germline mutations
    // we only use biallelic mutations to add frequency values and additional count fields
    return mutations.map(mutation => {
        const isSomatic = mutation.mutationStatus.toLowerCase() === "somatic";
        const isGermline = mutation.mutationStatus.toLowerCase() === "germline";
        const isPathogenic = mutation.pathogenic === "1";

        const pathogenicGermlineFrequency = (isGermline && isPathogenic) ?
                calculateOverallFrequency(mutation.countsByTumorType) : 0;
        const biallelicGermlineFrequency = (isGermline && mutation.biallelicCountsByTumorType) ?
            calculateOverallFrequency(mutation.biallelicCountsByTumorType) : 0;

        const tumorTypeDecomposition: ITumorTypeDecomposition[] = generateTumorTypeDecomposition(mutation.countsByTumorType,
            mutation.biallelicCountsByTumorType,
            mutation.qcPassCountsByTumorType);

        return {
            ...mutation,
            tumorTypeDecomposition,
            somaticFrequency: isSomatic ? calculateOverallFrequency(mutation.countsByTumorType) : 0,
            germlineFrequency: isGermline ? calculateOverallFrequency(mutation.countsByTumorType) : 0,
            pathogenicGermlineFrequency,
            biallelicGermlineFrequency,
            biallelicPathogenicGermlineFrequency: isPathogenic ? biallelicGermlineFrequency : 0,
            ratioBiallelicPathogenic: isPathogenic && mutation.biallelicCountsByTumorType && mutation.qcPassCountsByTumorType ?
                calculateTotalVariantRatio(mutation.biallelicCountsByTumorType, mutation.qcPassCountsByTumorType) : 0
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
            calcBiallelicRatio(biallelicTumorMap[counts.tumorType], qcPassTumorMap[counts.tumorType]): 0
    }));
}

function calcBiallelicRatio(biallelicCountByTumorType?: ICountByTumorType,
                            qcPassCountByTumorType?: ICountByTumorType)
{
    const ratio = (biallelicCountByTumorType ? biallelicCountByTumorType.variantCount : 0) /
        (qcPassCountByTumorType ? qcPassCountByTumorType.variantCount : 0);

    return ratio || 0;
}

function totalVariants(counts: ICountByTumorType[]) {
    return counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr) || 0;
}

function totalSamples(counts: ICountByTumorType[]) {
    return counts.map(c => c.tumorTypeCount).reduce((acc, curr) => acc + curr) || 0;
}

function calculateOverallFrequency(counts: ICountByTumorType[]) {
    return totalVariants(counts) / totalSamples(counts);
}

function calculateTotalVariantRatio(counts1: ICountByTumorType[], counts2: ICountByTumorType[])
{
    return totalVariants(counts1) / totalVariants(counts2);
}