export interface ICountByTumorType
{
    tumorType: string;
    tumorTypeCount: number;
    variantCount: number;
}

export interface IMutation
{
    chromosome: string;
    countsByTumorType: ICountByTumorType[],
    endPosition: number,
    hugoGeneSymbol: string,
    mutationStatus: string,
    pathogenic: string,
    penetrance: string,
    referenceAllele: string,
    startPosition: number,
    variantAllele: string
}
