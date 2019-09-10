import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    FilterResetPanel,
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
    findAllUniqueCancerTypes,
    totalFilteredSamples
} from "../util/MutationDataUtils";
import CancerTypeSelector from "./CancerTypeSelector";
import MutationStatusSelector from "./MutationStatusSelector";

import {AxisScaleSwitch} from "./AxisScaleSwitch";
import "./InsightMutationMapper.css";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    onInit?: (mutationMapper: InsightMutationMapper) => void;
    onGermlineScaleToggle?: (checked: boolean) => void;
    germlinePercentChecked?: boolean;
    onSomaticScaleToggle?: (checked: boolean) => void;
    somaticPercentChecked?: boolean;
}

const FILTER_UI_STYLE = {
    width: 250,
    paddingBottom: "1rem",
    fontSize: "85%"
};

@observer
export class InsightMutationMapper extends ReactMutationMapper<IInsightMutationMapperProps>
{
    @observable
    public showGermlinePercent = true;

    @observable
    public showSomaticPercent = false;

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
    public get totalFilteredSamples() {
        return totalFilteredSamples(this.store.dataStore.sortedFilteredData, this.cancerTypeFilter);
    }

    @computed
    public get totalSamples() {
        return totalFilteredSamples(this.store.dataStore.allData);
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

    @computed
    protected get plotTopYAxisSymbol() {
        return this.showSomaticPercent ? "%" : "#";
    }

    @computed
    protected get plotBottomYAxisSymbol() {
        return this.showGermlinePercent ? "%" : "#";
    }

    @computed
    protected get plotTopYAxisDefaultMax() {
        return this.showSomaticPercent ? 1 : 5;
    }

    @computed
    protected get plotBottomYAxisDefaultMax() {
        return this.showGermlinePercent ? 1 : 5;
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
            <div className="insight-mutation-filter-panel">
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
                {this.percentToggle}
            </div>
        );
    }

    protected get percentToggle(): JSX.Element | undefined
    {
        return (
            <div className="small" style={{display: "flex", alignItems: "center"}}>
                <span style={{marginLeft: 5, marginRight: 5}}>Somatic: </span>
                <AxisScaleSwitch
                    checked={this.showSomaticPercent}
                    onChange={this.onSomaticScaleToggle}
                />
                <span style={{marginLeft: 5, marginRight: 5}}>Germline: </span>
                <AxisScaleSwitch
                    checked={this.showGermlinePercent}
                    onChange={this.onGermlineScaleToggle}
                />
            </div>
        );
    }

    /**
     * Overriding the parent method to have customized mutation info
     */
    @computed
    protected get mutationTableInfo(): JSX.Element | undefined
    {
        const uniqueMutationCount = this.store.dataStore.allData.length;
        const filteredUniqueMutationCount = this.store.dataStore.sortedFilteredSelectedData.length > 0 ?
            this.store.dataStore.sortedFilteredSelectedData.length : this.store.dataStore.sortedFilteredData.length;

        const mutations =
            <span>
                <strong>
                    {filteredUniqueMutationCount}
                    {uniqueMutationCount !== filteredUniqueMutationCount && `/${uniqueMutationCount}`}
                </strong> {filteredUniqueMutationCount === 1 ? `unique mutation` : `unique mutations`}
            </span>;

        const samples =
            <span>
                <strong>
                    {this.totalFilteredSamples}
                    {this.totalSamples !== this.totalFilteredSamples && `/${this.totalSamples}`}
                </strong> {this.totalFilteredSamples === 1 ? `total sample`: `total samples`}
            </span>;

        const filtering = this.isFiltered ? "based on current filtering": null;

        const info = <span>{mutations} in {samples} {filtering}</span>;

        return this.isFiltered ? (
            <FilterResetPanel
                resetFilters={this.resetFilters}
                filterInfo={info}
                className=""
            />
        ): info;
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

    @action.bound
    private onGermlineScaleToggle(checked: boolean)
    {
        this.showGermlinePercent = checked;

        if (this.props.onGermlineScaleToggle) {
            this.props.onGermlineScaleToggle(checked);
        }
    }

    @action.bound
    private onSomaticScaleToggle(checked: boolean)
    {
        this.showSomaticPercent = checked;

        if (this.props.onSomaticScaleToggle) {
            this.props.onSomaticScaleToggle(checked);
        }
    }
}

export default InsightMutationMapper;
