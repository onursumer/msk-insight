import {action, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {ITumorTypeDecomposition} from "../model/Mutation";
import {DataStatus} from "../store/DataStatus";
import MutationTumorTypeFrequencyTable from "./MutationTumorTypeFrequencyTable";


interface ITumorTypeFrequencyDecompositionProps
{
    dataPromise: Promise<ITumorTypeDecomposition[]>;
    hugoSymbol: string;
}

@observer
class MutationTumorTypeFrequencyDecomposition extends React.Component<ITumorTypeFrequencyDecompositionProps>
{
    @observable
    private data: ITumorTypeDecomposition[] = [];

    @observable
    private status: DataStatus = 'pending';

    public render()
    {
        return this.status === 'pending' ? (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        ): (
            <MutationTumorTypeFrequencyTable
                data={this.data}
                hugoSymbol={this.props.hugoSymbol}
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
    private handleDataLoad(frequencies: ITumorTypeDecomposition[]) {
        this.data = frequencies;
        this.status = 'complete';
    }

    @action.bound
    private handleDataError(reason: any) {
        this.status = 'error';
    }
}

export default MutationTumorTypeFrequencyDecomposition;
