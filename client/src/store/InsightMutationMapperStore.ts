import autobind from "autobind-decorator";
import {computed, observable} from "mobx";
import {CancerTypeFilter, DataFilterType} from "react-mutation-mapper";

import {IMutation} from "../../../server/src/model/Mutation";
import {applyCancerTypeFilter, containsCancerType} from "../util/FilterUtils";
import {findAllUniqueCancerTypes} from "../util/MutationDataUtils";


export class InsightMutationMapperStore
{
    @observable
    public cancerTypeFilter: CancerTypeFilter;

    @observable
    private readonly data: IMutation[];

    constructor(data: IMutation[])
    {
        this.data = data;
        this.cancerTypeFilter = {
            type: DataFilterType.CANCER_TYPE,
            values: this.cancerTypes
        };
    }

    @computed
    public get cancerTypes()
    {
        return findAllUniqueCancerTypes(this.data || []).sort();
    }

    public get customFilterAppliers()
    {
        return {
            cancerType: applyCancerTypeFilter
        };
    };

    @autobind
    public getMutationCount(mutation: IMutation)
    {
        // take the current cancer type filter into account
        return mutation.countsByTumorType
            .map(c => containsCancerType(this.cancerTypeFilter, c.tumorType) ? c.variantCount : 0)
            .reduce((sum, count) => sum + count)
    }
}

export default InsightMutationMapperStore;
