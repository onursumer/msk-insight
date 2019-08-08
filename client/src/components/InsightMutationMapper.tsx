import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilterType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps
} from "react-mutation-mapper";

import {
    CANCER_TYPE_FILTER_ID,
    findAvailableMutationStatusFilterValues,
    findCancerTypeFilter,
    findMutationStatusFilter, MUTATION_STATUS_FILTER_ID, MUTATION_STATUS_FILTER_TYPE
} from "../util/FilterUtils";
import {findAllUniqueCancerTypes} from "../util/MutationDataUtils";
import CancerTypeSelector from "./CancerTypeSelector";
import MutationStatusSelector from "./MutationStatusSelector";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    ref?: (mutationMapper: InsightMutationMapper) => void;
}

@observer
export class InsightMutationMapper extends ReactMutationMapper<IInsightMutationMapperProps>
{
    @computed
    public get cancerTypes() {
        return findAllUniqueCancerTypes(this.props.data || []).sort();
    }

    @computed
    public get cancerTypeFilter() {
        return findCancerTypeFilter(this.store.dataStore.dataFilters);
    }

    @computed
    public get mutationStatusFilter() {
        return findMutationStatusFilter(this.store.dataStore.dataFilters);
    }

    constructor(props: IInsightMutationMapperProps)
    {
        super(props);

        if (props.ref) {
            props.ref(this);
        }
    }

    protected get mutationFilterPanel(): JSX.Element | null
    {
        return (
            <div>
                <h5
                    style={{textAlign: "center"}}
                >
                    Filters
                </h5>
                <div className="small" style={{display: "flex"}}>
                    <div style={{width: 180}}>
                        <CancerTypeSelector
                            filter={this.cancerTypeFilter}
                            availableValues={this.cancerTypes}
                            onSelect={this.onCancerTypeSelect}
                        />
                    </div>
                    <div style={{width: 180}}>
                        <MutationStatusSelector
                            filter={this.mutationStatusFilter}
                            availableValues={findAvailableMutationStatusFilterValues()}
                            onSelect={this.onMutationStatusSelect}
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
}

export default InsightMutationMapper;
