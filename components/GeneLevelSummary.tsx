import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    Col, Row
} from 'react-bootstrap';

import GeneFrequencyStore from "../store/GeneFrequencyStore";
import GeneFrequencyTable from "./GeneFrequencyTable";

interface IGeneLevelSummaryProps {
    frequencyStore?: GeneFrequencyStore
}

@observer
class GeneLevelSummary extends React.Component<IGeneLevelSummaryProps>
{
    @computed
    private get frequencyStore() {
        return this.props.frequencyStore || new GeneFrequencyStore();
    }

    private get loadingIndicator() {
        return <i className="fa fa-spinner fa-pulse fa-2x" />;

    }

    public render() {
        return (
            <div className="text-center">
                <Row>
                    <Col className="m-auto">
                        {this.isLoading() ? this.loadingIndicator :
                            <GeneFrequencyTable
                                geneFrequencySummaryData={this.frequencyStore.geneFrequencySummaryData}
                                tumorTypeFrequencySummaryMap={this.frequencyStore.tumorTypeFrequencyDataGroupedByGene}
                            />
                        }
                    </Col>
                </Row>
            </div>
        );
    }

    private isLoading(): boolean {
        return this.frequencyStore.frequencySummaryDataStatus === "pending" ||
            this.frequencyStore.tumorTypeFrequenciesDataStatus === "pending";
    }
}

export default GeneLevelSummary;
