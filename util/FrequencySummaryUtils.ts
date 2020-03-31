import {
    FrequencySummaryCategory,
    IGeneFrequencySummary,
    ITumorTypeFrequencySummary
} from "../model/GeneFrequencySummary";

export function transformFrequencySummaryByGene(frequencySummaryByGene: any[]): IGeneFrequencySummary[]
{
    return frequencySummaryByGene.map(summary => ({
        hugoSymbol: summary.Hugo_Symbol,
        penetrance: summary.penetrance.split(","),
        sampleCount: Number(summary.num_samples),
        frequencies: extractFrequencies(summary)
    }));
}

export function transformTumorTypeFrequenciesByGene(tumorTypeFrequenciesByGene: any[]): ITumorTypeFrequencySummary[]
{
    return tumorTypeFrequenciesByGene.map(summary => ({
        tumorType: summary.Proposed_level,
        hugoSymbol: summary.Hugo_Symbol,
        penetrance: summary.penetrance.split(","),
        sampleCount: Number(summary.num_samples),
        frequencies: extractFrequencies(summary)
    }));
}

export function extractFrequencies(summary: any)
{
    return [
        {
            category: FrequencySummaryCategory.SOMATIC_DRIVER,
            frequency: Number(summary.somatic_driver_rate)
        },
        {
            category: FrequencySummaryCategory.PATHOGENIC_GERMLINE,
            frequency: Number(summary.pathogenic_germline_rate)
        },
        {
            category: FrequencySummaryCategory.PERCENT_BIALLELIC,
            frequency: Number(summary.percent_biallelic)
        },
    ];
}