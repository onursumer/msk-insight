import _ from "lodash";
import {action, computed, observable} from "mobx";
import {DataFilter, DataFilterType} from "react-mutation-mapper";

import {IGeneFrequencySummary, ITumorTypeFrequencySummary} from "../model/GeneFrequencySummary";
import {
    applyGeneFrequencySummaryHugoSymbolFilter,
    applyGeneFrequencySummaryPenetranceFilter,
    applyTumorTypeFrequencySummaryCancerTypeFilter,
    HUGO_SYMBOL_FILTER_TYPE,
    isKnownTumorType,
    PENETRANCE_FILTER_TYPE, updateDataFilters,
} from "../util/FilterUtils";
import {fetchFrequencySummaryByGene, fetchTumorTypeFrequencySummaryByGene} from "../util/FrequencyDataUtils";
import {DataStatus} from "./DataStatus";

export function isFrequencyDataPending(frequencyStore?: GeneFrequencyStore): boolean {
    return frequencyStore !== undefined && (
        frequencyStore.frequencySummaryDataStatus === "pending" ||
        frequencyStore.tumorTypeFrequenciesDataStatus === "pending"
    );
}

class GeneFrequencyStore
{
    public readonly geneFrequencySummaryFilterAppliers: {
        [type: string]: (filter: DataFilter, geneFrequencySummary: IGeneFrequencySummary) => boolean
    } = {
        [HUGO_SYMBOL_FILTER_TYPE]: applyGeneFrequencySummaryHugoSymbolFilter,
        [PENETRANCE_FILTER_TYPE]: applyGeneFrequencySummaryPenetranceFilter,
    }

    public readonly tumorTypeFrequencySummaryFilterAppliers: {
        [type: string]: (filter: DataFilter, geneFrequencySummary: ITumorTypeFrequencySummary) => boolean
    } = {
        [DataFilterType.CANCER_TYPE]: applyTumorTypeFrequencySummaryCancerTypeFilter,
    }

    @observable
    public geneFrequencySummaryDataFilters: DataFilter[] = [];

    @observable
    public tumorTypeFrequencySummaryDataFilters: DataFilter[] = [];

    @observable
    public frequencySummaryDataStatus: DataStatus = 'pending';

    @observable
    public tumorTypeFrequenciesDataStatus: DataStatus = 'pending';

    @observable
    public geneFrequencySummaryData: IGeneFrequencySummary[] = [];

    @observable
    public tumorTypeFrequencySummaryData: ITumorTypeFrequencySummary[] = [];

    @computed
    public get tumorTypeFrequencyDataGroupedByGene(): {[hugoSymbol: string]: ITumorTypeFrequencySummary[]}
    {
        return _.groupBy(this.tumorTypeFrequencySummaryData, "hugoSymbol");
    }

    @computed
    public get filteredGeneFrequencySummaryData(): IGeneFrequencySummary[]
    {
        return this.geneFrequencySummaryData.filter(s =>
            // should satisfy all filters, otherwise filter out
            !this.geneFrequencySummaryDataFilters
                .map(f => !this.geneFrequencySummaryFilterAppliers[f.type] || this.geneFrequencySummaryFilterAppliers[f.type](f, s))
                .includes(false)
        );
    }

    @computed
    public get knownTumorTypeFrequencySummaryData() {
        return this.tumorTypeFrequencySummaryData.filter(d => isKnownTumorType(d.tumorType));
    }

    @computed
    public get filteredTumorTypeFrequencySummaryData()
    {
        // always filter out unknown
        return this.knownTumorTypeFrequencySummaryData
            .filter(s =>
                // should satisfy all filters, otherwise filter out
                !this.tumorTypeFrequencySummaryDataFilters
                    .map(f => !this.tumorTypeFrequencySummaryFilterAppliers[f.type] ||
                        this.tumorTypeFrequencySummaryFilterAppliers[f.type](f, s))
                    .includes(false)
            );
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
    public updateGeneFrequencySummaryDataFilters(dataFilterId: string, dataFilter?: DataFilter)
    {
        this.geneFrequencySummaryDataFilters = updateDataFilters(
            this.geneFrequencySummaryDataFilters,
            dataFilterId,
            dataFilter
        );
    }

    @action
    public updateTumorTypeFrequencySummaryDataFilters(dataFilterId: string, dataFilter?: DataFilter)
    {
        this.tumorTypeFrequencySummaryDataFilters = updateDataFilters(
            this.tumorTypeFrequencySummaryDataFilters,
            dataFilterId,
            dataFilter
        );
    }
}

export default GeneFrequencyStore;
