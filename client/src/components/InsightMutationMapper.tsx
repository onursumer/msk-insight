import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    CancerTypeSelector,
    DataFilterType,
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
    MutationMapperStore
} from "react-mutation-mapper";

import {CANCER_TYPE_FILTER_ID, findCancerTypeFilter} from "../util/FilterUtils";
import {findAllUniqueCancerTypes} from "../util/MutationDataUtils";

export interface IInsightMutationMapperProps extends MutationMapperProps
{
    onInitStore?: (mutationMapperStore: MutationMapperStore) => void;
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

    constructor(props: IInsightMutationMapperProps)
    {
        super(props);

        if (props.onInitStore) {
            props.onInitStore(this.store);
        }
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
        const cancerTypeFilter = {
            id: CANCER_TYPE_FILTER_ID,
            type: DataFilterType.CANCER_TYPE,
            values: selectedCancerTypeIds
        };

        // replace the existing cancer type filter with the current one
        this.store.dataStore.setDataFilters([
            // include all filters except the previous cancer type filter
            ...this.store.dataStore.dataFilters.filter(f => f.type !== DataFilterType.CANCER_TYPE),
            // include the new cancer type filter
            cancerTypeFilter
        ]);
    }
}

export default InsightMutationMapper;
