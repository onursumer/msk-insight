import {observer} from "mobx-react";
import * as React from "react";

import {
    DefaultMutationMapperStore,
    LollipopMutationPlot,
    Mutation
} from "react-mutation-mapper";

interface IMutationMapperProps
{
    data: Mutation[];
    hugoSymbol: string;
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
    public render()
    {
        return (
            <LollipopMutationPlot
                store={
                    new DefaultMutationMapperStore(
                        // TODO entrezGeneId?
                        {hugoGeneSymbol: this.props.hugoSymbol} as any,
                        {isoformOverrideSource: "mskcc"},
                        () => this.props.data)
                }
                geneWidth={666}
            />
        );
    }
}

export default MutationMapper;
