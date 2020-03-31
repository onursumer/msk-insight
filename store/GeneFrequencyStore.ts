import _ from "lodash";
import {action, computed, observable} from "mobx";

import {IGeneFrequencySummary, ITumorTypeFrequencySummary} from "../model/GeneFrequencySummary";
import {fetchFrequencySummaryByGene, fetchTumorTypeFrequencySummaryByGene} from "../util/FrequencyDataUtils";
import {DataStatus} from "./DataStatus";

class GeneFrequencyStore
{
    @observable
    public frequencySummaryDataStatus: DataStatus = 'pending';

    @observable
    public tumorTypeFrequenciesDataStatus: DataStatus = 'pending';

    @observable
    public geneFrequencySummaryData: IGeneFrequencySummary[] = [];

    @observable
    public tumorTypeFrequencySummaryData: ITumorTypeFrequencySummary[] = [];


    @observable
    public filterText: string|undefined;

    @computed
    public get tumorTypeFrequencyDataGroupedByGene(): {[hugoSymbol: string]: ITumorTypeFrequencySummary[]}
    {
        return _.groupBy(this.tumorTypeFrequencySummaryData, "hugoSymbol");
    }

    constructor() {
        const geneFrequencySummaryDataPromise: Promise<IGeneFrequencySummary[]> =
            fetchFrequencySummaryByGene();

        geneFrequencySummaryDataPromise
            .then(data => {
                this.geneFrequencySummaryData = data;
                this.frequencySummaryDataStatus = 'complete';
            })
            .catch(() => {
                this.geneFrequencySummaryData = [];
                this.frequencySummaryDataStatus = 'error';
            });

        const tumorTypeFrequencySummaryDataPromise: Promise<ITumorTypeFrequencySummary[]> =
            fetchTumorTypeFrequencySummaryByGene();

        tumorTypeFrequencySummaryDataPromise
            .then(data => {
                this.tumorTypeFrequencySummaryData = data;
                this.tumorTypeFrequenciesDataStatus = 'complete';
            })
            .catch(() => {
                this.tumorTypeFrequencySummaryData = [];
                this.tumorTypeFrequenciesDataStatus = 'error';
            });
    }

    @action
    public filterFrequenciesByGene(input: string) {
        this.filterText = input;
    }
}

export default GeneFrequencyStore;
