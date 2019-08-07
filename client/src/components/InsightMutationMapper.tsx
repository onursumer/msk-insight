import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    CancerTypeFilter,
    CancerTypeSelector,
    DataFilterType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps
} from "react-mutation-mapper";

import InsightMutationMapperStore from "../store/InsightMutationMapperStore";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    insightMutationMapperStore: InsightMutationMapperStore;
}

@observer
export class InsightMutationMapper extends ReactMutationMapper<IInsightMutationMapperProps>
{
    @computed
    protected get cancerTypes() {
        return this.props.insightMutationMapperStore.cancerTypes;
    }

    @computed
    protected get cancerTypeFilter() {
        return this.props.insightMutationMapperStore.cancerTypeFilter;
    }

    protected set cancerTypeFilter(cancerTypeFilter: CancerTypeFilter) {
        this.props.insightMutationMapperStore.cancerTypeFilter = cancerTypeFilter;
    }

    protected get mutationFilterPanel(): JSX.Element | null
    {
        return (
            <div>
                <div>Filters</div>
                <div
                    className="small"
                    style={{width: 180}}
                >
                    <CancerTypeSelector
                        filter={this.cancerTypeFilter}
                        cancerTypes={this.cancerTypes}
                        onSelect={this.onCancerTypeSelect}
                    />
                </div>
            </div>
        );
    }

    @action.bound
    protected onCancerTypeSelect(selectedCancerTypeIds: string[])
    {
        this.cancerTypeFilter = {
            type: DataFilterType.CANCER_TYPE,
            values: selectedCancerTypeIds
        };

        // replace the existing cancer type filter with the current one
        this.store.dataStore.setDataFilters([
            // include all filters except the previous cancer type filter
            ...this.store.dataStore.dataFilters.filter(f => f.type !== DataFilterType.CANCER_TYPE),
            // include the new cancer type filter
            this.cancerTypeFilter
        ]);
    }
}

export default InsightMutationMapper;
