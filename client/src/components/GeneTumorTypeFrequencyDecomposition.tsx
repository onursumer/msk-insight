import {action, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";

import {ITumorTypeFrequencySummary} from "../../../server/src/model/GeneFrequencySummary";
import {DataStatus} from "../store/DataStatus";

import "react-table/react-table.css";
import "./FrequencyTable.css";
import GeneTumorTypeFrequencyTable from "./GeneTumorTypeFrequencyTable";

interface ITumorTypeFrequencyDecompositionProps
{
    dataPromise: Promise<ITumorTypeFrequencySummary[]>;
    penetrance: string[];
    hugoSymbol: string;
}

@observer
class GeneTumorTypeFrequencyDecomposition extends React.Component<ITumorTypeFrequencyDecompositionProps>
{
    @observable
    private data: ITumorTypeFrequencySummary[] = [];

    @observable
    private status: DataStatus = 'pending';

    public render()
    {
        return this.status === 'pending' ? (
            <i className="fa fa-spinner fa-pulse fa-2x" />
        ): (
            <GeneTumorTypeFrequencyTable
                data={this.data}
                penetrance={this.props.penetrance}
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
    private handleDataLoad(frequencies: ITumorTypeFrequencySummary[]) {
        this.data = frequencies;
        this.status = 'complete';
    }

    @action.bound
    private handleDataError(reason: any) {
        this.status = 'error';
    }
}

export default GeneTumorTypeFrequencyDecomposition;
