import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    groupDataByProteinImpactType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
    ProteinImpactTypeBadgeSelector
} from "react-mutation-mapper";

import {
    CANCER_TYPE_FILTER_ID,
    findCancerTypeFilter,
    findMutationStatusFilter,
    findMutationTypeFilter,
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

const FILTER_UI_STYLE = {
    width: 250,
    paddingBottom: "1rem",
    fontSize: "85%"
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

    @computed
    public get mutationsGroupedByProteinImpactType() {
        return groupDataByProteinImpactType(this.store.dataStore);
    }

    @computed
    public get mutationCountsByProteinImpactType() {
        const map: {[proteinImpactType: string] : number} = {};

        Object.keys(this.mutationsGroupedByProteinImpactType)
            .forEach(proteinImpactType => {
                const g = this.mutationsGroupedByProteinImpactType[proteinImpactType];
                map[g.group] = g.data.length;
            });

        return map;
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
                <div style={FILTER_UI_STYLE}>
                    <MutationStatusSelector
                        filter={this.mutationStatusFilter}
                        onSelect={this.onMutationStatusSelect}
                        rates={this.mutationRatesByMutationStatus}
                    />
                </div>
                <div style={FILTER_UI_STYLE}>
                    <ProteinImpactTypeBadgeSelector
                        filter={this.mutationTypeFilter}
                        counts={this.mutationCountsByProteinImpactType}
                        onSelect={this.onProteinImpactTypeSelect}
                    />
                </div>
                <div style={FILTER_UI_STYLE}>
                    <CancerTypeSelector
                        filter={this.cancerTypeFilter}
                        options={this.cancerTypesOptions}
                        onSelect={this.onCancerTypeSelect}
                    />
                </div>
            </div>
        );
    }

    @computed
    public get mutationRatesByMutationStatus() {
        // TODO pick only likely driver ones, not all somatic mutations
        const somaticFilter = {
            type: MUTATION_STATUS_FILTER_TYPE,
            values: [MutationStatusFilterValue.SOMATIC]
        };

        const benignGermlineFilter = {
            type: MUTATION_STATUS_FILTER_TYPE,
            values: [MutationStatusFilterValue.BENIGN_GERMLINE]
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
        const benignGermlineFrequency = calculateTotalFrequency(
            sortedFilteredData, benignGermlineFilter, this.cancerTypeFilter);
        const pathogenicGermlineFrequency = calculateTotalFrequency(
            sortedFilteredData, pathogenicGermlineFilter, this.cancerTypeFilter);
        const biallelicRatio = calculateTotalBiallelicRatio(
            sortedFilteredData, pathogenicGermlineFilter, biallelicPathogenicGermlineFilter, this.cancerTypeFilter);

        return {
            [MutationStatusFilterValue.SOMATIC]: somaticFrequency * 100,
            [MutationStatusFilterValue.BENIGN_GERMLINE]: benignGermlineFrequency * 100,
            [MutationStatusFilterValue.PATHOGENIC_GERMLINE]: pathogenicGermlineFrequency * 100,
            [MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]: biallelicRatio * 100,
        };
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
