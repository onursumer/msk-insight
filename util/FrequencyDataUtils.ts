import {IGeneFrequencySummary, ITumorTypeFrequencySummary} from "../model/GeneFrequencySummary";
import {
    transformFrequencySummaryByGene,
    transformTumorTypeFrequenciesByGene
} from "./FrequencySummaryUtils";
import {readAsJson} from "./ParseUtils";

export function fetchTumorTypeFrequencySummaryByGene(): Promise<ITumorTypeFrequencySummary[]> {
    return new Promise<ITumorTypeFrequencySummary[]>((resolve, reject) => {
        fetch("/data/signal.cancertype_specific_somatic_germline_stats.txt")
            .then(response => response.text())
            .then(text => readAsJson(text))
            .then(json => resolve(transformTumorTypeFrequenciesByGene(json)))
            .catch(err => reject(err));
    });
}

export function fetchFrequencySummaryByGene(): Promise<IGeneFrequencySummary[]> {
    return new Promise<IGeneFrequencySummary[]>((resolve, reject) => {
        fetch("/data/signal.pancancer_somatic_germline_stats.txt")
            .then(response => response.text())
            .then(text => readAsJson(text))
            .then(json => resolve(transformFrequencySummaryByGene(json)))
            .catch(err => reject(err));
    });
}
