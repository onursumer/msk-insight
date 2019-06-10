import {action, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {DefaultMutationMapperStore, LollipopMutationPlot} from "react-mutation-mapper";

import {IMutation} from "../../../server/src/model/Mutation";
import {DataStatus} from "../store/DataStatus";

interface IMutationMapperProps
{
    dataPromise: Promise<IMutation[]>;
    hugoSymbol: string;
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
    @observable
    private data: IMutation[] = [];

    @observable
    private status: DataStatus = 'pending';

    public render()
    {
        return this.status === 'pending' ? (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        ): (
            // TODO fetchVariantAnnotationsIndexedByGenomicLocation(this.rawMutations, ["annotation_summary","hotspots"], AppConfig.serverConfig.isoformOverrideSource)
            <LollipopMutationPlot
                store={
                    new DefaultMutationMapperStore(
                        {hugoGeneSymbol: this.props.hugoSymbol} as any,
                        {isoformOverrideSource: "mskcc"},
                        () => this.data as any)
                }
                geneWidth={666}
            />
        );
    }

    public componentDidMount()
    {
        this.props.dataPromise
            .then(this.handleDataLoad)
            .catch(this.handleDataError);
    }

    @action.bound
    private handleDataLoad(mutations: IMutation[]) {
        this.data = mutations;
        this.status = 'complete';
    }

    @action.bound
    private handleDataError(reason: any) {
        this.status = 'error';
    }
}

export default MutationMapper;
