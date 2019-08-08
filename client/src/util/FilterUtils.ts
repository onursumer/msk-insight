import {
    CancerTypeFilter, DataFilter
} from "react-mutation-mapper";

import {IMutation} from "../../../server/src/model/Mutation";

export const CANCER_TYPE_FILTER_ID = "_insightCancerTypeFilter_";

export function applyCancerTypeFilter(filter: CancerTypeFilter, mutation: IMutation)
{
    return mutation.countsByTumorType.find(c =>
        filter.values.find(v =>
            v.length > 0 &&
            c.variantCount > 0 &&
            c.tumorType.toLowerCase().includes(v.toLowerCase())) !== undefined) !== undefined
}

export function containsCancerType(filter: CancerTypeFilter | undefined, cancerType: string)
{
    return !filter || filter.values.find(v => cancerType.toLowerCase().includes(v.toLowerCase())) !== undefined;
}

export function findCancerTypeFilter(dataFilters: DataFilter[])
{
    return dataFilters.find(f => f.id === CANCER_TYPE_FILTER_ID);
}
