import autobind from "autobind-decorator";
import {computed, observable} from "mobx";
import {CancerTypeFilter, DataFilterType} from "react-mutation-mapper";

import {IMutation} from "../../../server/src/model/Mutation";
import {applyCancerTypeFilter} from "../util/FilterUtils";
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
        // TODO we need to apply existing CancerTypeFilter filters on the countsByTumorType field
        return mutation.countsByTumorType
            .map(c => c.variantCount)
            .reduce((sum, count) => sum + count)
    }
}

export default InsightMutationMapperStore;
