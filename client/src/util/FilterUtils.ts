import {
    CancerTypeFilter
} from "react-mutation-mapper";

import {IMutation} from "../../../server/src/model/Mutation";

export function applyCancerTypeFilter(filter: CancerTypeFilter, mutation: IMutation)
{
    return mutation.countsByTumorType.find(c =>
        filter.values.find(v =>
            v.length > 0 &&
            c.variantCount > 0 &&
            c.tumorType.toLowerCase().includes(v.toLowerCase())) !== undefined) !== undefined
}
