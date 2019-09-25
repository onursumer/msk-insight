import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    FilterResetPanel,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
    onFilterOptionSelect,
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
    percentChecked?: boolean;
    onScaleToggle?: (checked: boolean) => void;
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
    public showPercent = true;

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
    protected get plotTopYAxisSymbol() {
        return this.showPercent ? "%" : "#";
    }

    @computed
    protected get plotBottomYAxisSymbol() {
        return this.showPercent ? "%" : "#";
    }

    @computed
    protected get plotTopYAxisDefaultMax() {
        return this.showPercent ? 0 : 5;
    }

    @computed
    protected get plotBottomYAxisDefaultMax() {
        return this.showPercent ? 0 : 5;
    }

    @computed
    protected get plotYMaxLabelPostfix() {
        return this.showPercent ? "%" : "";
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
                    <strong>
                        {this.totalFilteredSamples}
                        {this.totalSamples !== this.totalFilteredSamples && `/${this.totalSamples}`}
                    </strong> {this.totalFilteredSamples === 1 ? `total sample`: `total samples`}
                </div>
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
                        counts={this.store.mutationCountsByProteinImpactType}
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

    /**
     * Override the parent method to get custom controls.
     */
    protected get customControls(): JSX.Element | undefined
    {
        return this.percentToggle;
    }

    protected get percentToggle(): JSX.Element | undefined
    {
        return (
            <div className="small" style={{display: "flex", alignItems: "center"}}>
                <span style={{marginLeft: 10, marginRight: 5}}>Y-Axis: </span>
                <AxisScaleSwitch
                    checked={this.showPercent}
                    onChange={this.onScaleToggle}
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

        const filtering = this.isFiltered ? "based on current filtering": null;

        const info = <span>{mutations} {filtering}</span>;

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
        onFilterOptionSelect(selectedCancerTypeIds,
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.CANCER_TYPE,
            CANCER_TYPE_FILTER_ID);
    }

    @action.bound
    protected onMutationStatusSelect(selectedMutationStatusIds: string[], allValuesSelected: boolean)
    {
        onFilterOptionSelect(selectedMutationStatusIds,
            allValuesSelected,
            this.store.dataStore,
            MUTATION_STATUS_FILTER_TYPE,
            MUTATION_STATUS_FILTER_ID);
    }

    @action.bound
    protected onProteinImpactTypeSelect(selectedMutationTypeIds: string[], allValuesSelected: boolean)
    {
        onFilterOptionSelect(selectedMutationTypeIds.map(v => v.toLowerCase()),
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.PROTEIN_IMPACT_TYPE,
            PROTEIN_IMPACT_TYPE_FILTER_ID);
    }

    @action.bound
    private onScaleToggle(checked: boolean)
    {
        this.lollipopPlotControlsConfig.yMaxInput = undefined;
        this.lollipopPlotControlsConfig.bottomYMaxInput = undefined;

        this.showPercent = checked;

        if (this.props.onScaleToggle) {
            this.props.onScaleToggle(checked);
        }
    }
}

export default InsightMutationMapper;
