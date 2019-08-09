import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
    ProteinImpactTypeSelector
} from "react-mutation-mapper";

import {
    CANCER_TYPE_FILTER_ID,
    findCancerTypeFilter,
    findMutationStatusFilter,
    findMutationTypeFilter,
    getMutationStatusFilterOptions,
    MUTATION_STATUS_FILTER_ID,
    MUTATION_STATUS_FILTER_TYPE,
    PROTEIN_IMPACT_TYPE_FILTER_ID
} from "../util/FilterUtils";
import {findAllUniqueCancerTypes} from "../util/MutationDataUtils";
import CancerTypeSelector from "./CancerTypeSelector";
import MutationStatusSelector from "./MutationStatusSelector";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    onInit?: (mutationMapper: InsightMutationMapper) => void;
}

const DROPDOWN_STYLE = {
    width: 200,
    paddingBottom: "0.3rem"
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

    @action.bound
    protected onCancerTypeSelect(selectedCancerTypeIds: string[])
    {
        const cancerTypeFilter = {
            id: CANCER_TYPE_FILTER_ID,
            type: DataFilterType.CANCER_TYPE,
            values: selectedCancerTypeIds
        };

        // replace the existing cancer type filter with the current one
        this.store.dataStore.setDataFilters([
            // include all filters except the previous cancer type filter
            ...this.store.dataStore.dataFilters.filter(f => f.id !== CANCER_TYPE_FILTER_ID),
            // include the new cancer type filter
            cancerTypeFilter
        ]);
    }

    @action.bound
    protected onMutationStatusSelect(selectedMutationStatusIds: string[])
    {
        const mutationStatusFilter = {
            id: MUTATION_STATUS_FILTER_ID,
            type: MUTATION_STATUS_FILTER_TYPE,
            values: selectedMutationStatusIds
        };

        // replace the existing cancer type filter with the current one
        this.store.dataStore.setDataFilters([
            // include all filters except the previous cancer type filter
            ...this.store.dataStore.dataFilters.filter(f => f.id !== MUTATION_STATUS_FILTER_ID),
            // include the new cancer type filter
            mutationStatusFilter
        ]);
    }

    @action.bound
    protected onProteinImpactTypeSelect(selectedMutationTypeIds: string[])
    {
        const proteinImpactTypeFilter = {
            id: PROTEIN_IMPACT_TYPE_FILTER_ID,
            type: DataFilterType.PROTEIN_IMPACT_TYPE,
            values: selectedMutationTypeIds.map(v => v.toLowerCase())
        };

        // replace the existing cancer type filter with the current one
        this.store.dataStore.setDataFilters([
            // include all filters except the previous cancer type filter
            ...this.store.dataStore.dataFilters.filter(f => f.id !== PROTEIN_IMPACT_TYPE_FILTER_ID),
            // include the new cancer type filter
            proteinImpactTypeFilter
        ]);
    }
}

export default InsightMutationMapper;
