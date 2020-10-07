import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    Col, Row
} from 'react-bootstrap';

import GeneFrequencyStore from "../store/GeneFrequencyStore";
import GeneFrequencyFilterHelper from "../util/GeneFrequencyFilterHelper";
import GeneFrequencyTable from "./GeneFrequencyTable";
import GeneFrequencyTableComponent from "./GeneFrequencyTableComponent";
import LandscapePlot from "./LandscapePlot";

interface IGeneLevelSummaryProps {
    frequencyStore?: GeneFrequencyStore;
    filterHelper?: GeneFrequencyFilterHelper;
    onGeneFrequencyTableRef?: (ref: GeneFrequencyTableComponent) => void;
}

@observer
class GeneLevelSummary extends React.Component<IGeneLevelSummaryProps>
{
    @computed
    private get frequencyStore() {
        return this.props.frequencyStore || new GeneFrequencyStore();
    }

    @computed
    private get filterHelper() {
        return this.props.filterHelper || new GeneFrequencyFilterHelper(this.frequencyStore);
    }

    private get loadingIndicator() {
        return <i className="fa fa-spinner fa-pulse fa-2x" />;
    }

    public render() {
        return (
            <div className="text-center mb-4">
                {this.isLoading() ? (
                    <Row>
                        <Col className="m-auto">
                            {this.loadingIndicator}
                        </Col>
                    </Row>
                ) : (
                    <>
                        <Row>
                            <Col className="m-auto">
                                <LandscapePlot frequencyStore={this.frequencyStore} />
                            </Col>
                        </Row>
                        <Row>
                            <Col className="m-auto">
                                <GeneFrequencyTable
                                    store={this.frequencyStore}
                                    onSearch={this.filterHelper.handleHugoSymbolSearch}
                                    onGeneFrequencyTableRef={this.props.onGeneFrequencyTableRef}
                                />
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        );
    }

    private isLoading(): boolean {
        return this.frequencyStore.frequencySummaryDataStatus === "pending" ||
            this.frequencyStore.tumorTypeFrequenciesDataStatus === "pending";
    }
}

export default GeneLevelSummary;
