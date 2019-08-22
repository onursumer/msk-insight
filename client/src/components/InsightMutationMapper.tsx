import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
    ProteinImpactTypeSelector
} from "react-mutation-mapper";

import {FrequencySummaryCategory} from "../util/ColumnHelper";
import {
    CANCER_TYPE_FILTER_ID,
    findCancerTypeFilter,
    findMutationStatusFilter,
    findMutationTypeFilter,
    getMutationStatusFilterOptions,
    MUTATION_STATUS_FILTER_ID,
    MUTATION_STATUS_FILTER_TYPE,
    MutationStatusFilterValue,
    onDropdownOptionSelect,
    PROTEIN_IMPACT_TYPE_FILTER_ID
} from "../util/FilterUtils";
import {
    calculateTotalBiallelicRatio,
    calculateTotalFrequency,
    findAllUniqueCancerTypes
} from "../util/MutationDataUtils";
import CancerTypeSelector from "./CancerTypeSelector";
import MutationStatusSelector from "./MutationStatusSelector";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    onInit?: (mutationMapper: InsightMutationMapper) => void;
}

const DROPDOWN_STYLE = {
    width: 220,
    paddingBottom: "0.3rem"
};

export const MUTATION_RATE_HELPER = {
    [FrequencySummaryCategory.SOMATIC_DRIVER]: {
        title: "% Somatic Mutant",
        description: "Includes only likely driver mutations",
    },
    [FrequencySummaryCategory.PATHOGENIC_GERMLINE]: {
        title: "% Pathogenic Germline"
    },
    [FrequencySummaryCategory.PERCENT_BIALLELIC]: {
        title: "% Biallelic",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor"
    }
};

@observer
export class InsightMutationMapper extends ReactMutationMapper<IInsightMutationMapperProps>
{
    @computed
    public get cancerTypes() {
        return findAllUniqueCancerTypes(this.props.data || []).sort();
    }

    @computed
    public get cancerTypesOptions() {
        return this.cancerTypes.map(t => ({value: t}));
    }

    @computed
    public get cancerTypeFilter() {
        return findCancerTypeFilter(this.store.dataStore.dataFilters);
    }

    @computed
    public get mutationStatusFilter() {
        return findMutationStatusFilter(this.store.dataStore.dataFilters);
    }

    @computed
    public get mutationTypeFilter() {
        return findMutationTypeFilter(this.store.dataStore.dataFilters);
    }

    constructor(props: IInsightMutationMapperProps)
    {
        super(props);

        if (props.onInit) {
            props.onInit(this);
        }
    }

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null
    {
        return (
            <div>
                <h5
                    style={{marginTop: "1rem"}}
                >
                    Filters
                </h5>
                <div className="small">
                    <div style={DROPDOWN_STYLE}>
                        <CancerTypeSelector
                            filter={this.cancerTypeFilter}
                            options={this.cancerTypesOptions}
                            onSelect={this.onCancerTypeSelect}
                        />
                    </div>
                    <div style={DROPDOWN_STYLE}>
                        <MutationStatusSelector
                            filter={this.mutationStatusFilter}
                            options={getMutationStatusFilterOptions()}
                            onSelect={this.onMutationStatusSelect}
                        />
                    </div>
                    <div style={DROPDOWN_STYLE}>
                        <ProteinImpactTypeSelector
                            filter={this.mutationTypeFilter}
                            onSelect={this.onProteinImpactTypeSelect}
                        />
                    </div>
                </div>
            </div>
        );
    }

    @computed
    protected get mutationRates()
    {
        // TODO pick only likely driver ones, not all somatic mutations
        const somaticFilter = {
            type: MUTATION_STATUS_FILTER_TYPE,
            values: [MutationStatusFilterValue.SOMATIC]
        };

        const pathogenicGermlineFilter = {
            type: MUTATION_STATUS_FILTER_TYPE,
            values: [MutationStatusFilterValue.PATHOGENIC_GERMLINE]
        };

        const biallelicPathogenicGermlineFilter = {
            type: MUTATION_STATUS_FILTER_TYPE,
            values: [MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]
        };

        const sortedFilteredData = this.store.dataStore.sortedFilteredData;

        const somaticFrequency = calculateTotalFrequency(
            sortedFilteredData, somaticFilter, this.cancerTypeFilter);
        const pathogenicGermlineFrequency = calculateTotalFrequency(
            sortedFilteredData, pathogenicGermlineFilter, this.cancerTypeFilter);
        const biallelicRatio = calculateTotalBiallelicRatio(
            sortedFilteredData, pathogenicGermlineFilter, biallelicPathogenicGermlineFilter, this.cancerTypeFilter);

        return [
            {
                ...MUTATION_RATE_HELPER[FrequencySummaryCategory.SOMATIC_DRIVER],
                rate: somaticFrequency * 100
            },
            {
                ...MUTATION_RATE_HELPER[FrequencySummaryCategory.PATHOGENIC_GERMLINE],
                rate: pathogenicGermlineFrequency * 100
            },
            {
                ...MUTATION_RATE_HELPER[FrequencySummaryCategory.PERCENT_BIALLELIC],
                rate: biallelicRatio * 100
            }
        ];
    }

    @action.bound
    protected onCancerTypeSelect(selectedCancerTypeIds: string[], allValuesSelected: boolean)
    {
        onDropdownOptionSelect(selectedCancerTypeIds,
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.CANCER_TYPE,
            CANCER_TYPE_FILTER_ID);
    }

    @action.bound
    protected onMutationStatusSelect(selectedMutationStatusIds: string[], allValuesSelected: boolean)
    {
        onDropdownOptionSelect(selectedMutationStatusIds,
            allValuesSelected,
            this.store.dataStore,
            MUTATION_STATUS_FILTER_TYPE,
            MUTATION_STATUS_FILTER_ID);
    }

    @action.bound
    protected onProteinImpactTypeSelect(selectedMutationTypeIds: string[], allValuesSelected: boolean)
    {
        onDropdownOptionSelect(selectedMutationTypeIds.map(v => v.toLowerCase()),
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.PROTEIN_IMPACT_TYPE,
            PROTEIN_IMPACT_TYPE_FILTER_ID);
    }
}

export default InsightMutationMapper;
