import autobind from 'autobind-decorator';
import {action, computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    Col, Row
} from 'react-bootstrap';

import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {ColumnId} from "./ColumnHeaderHelper";
import GeneFrequencyTable from "./GeneFrequencyTable";
import SearchBox from "./SearchBox";

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

    @computed
    private get filteredColumns()
    {
        return this.frequencyStore.filterText && this.frequencyStore.filterText.length > 0 ? [
            {
                id: ColumnId.HUGO_SYMBOL,
                value: this.frequencyStore.filterText
            }
        ] : [];
    }

    public render() {
        return (
            <div className="text-center">
                <Row>
                    <Col lg="8" className="m-auto">
                        <SearchBox onChange={this.onSearch} />
                    </Col>
                </Row>
                <Row className="py-4">
                    <Col className="m-auto">
                        <GeneFrequencyTable
                            data={this.frequencyStore.mutationFrequencyData}
                            status={this.frequencyStore.geneFrequencyDataStatus}
                            filtered={this.filteredColumns}
                        />
                    </Col>
                </Row>
            </div>
        );
    }

    @autobind
    @action
    private onSearch(input: string) {
        this.frequencyStore.filterFrequenciesByGene(input);
    }
}

export default GeneLevelSummary;
