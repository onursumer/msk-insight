import { observer } from "mobx-react";
import * as React from 'react';
import { Col } from 'react-bootstrap';
import {CancerTypeFilter, FilterResetPanel} from "react-mutation-mapper";

import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {HugoSymbolFilter} from "../util/FilterUtils";
import CancerTypeSelector from "./CancerTypeSelector";
import HugoSymbolSelector from "./HugoSymbolSelector";

export interface IGeneLevelFilterPanelProps {
    geneFrequencyStore?: GeneFrequencyStore;
    onResetFilters?: () => void;
    isFiltered?: boolean;
    cancerTypeFilter?: CancerTypeFilter;
    cancerTypesOptions?: Array<{value: string}>;
    onCancerTypeSelect?: (selectedCancerTypeIds: string[], allValuesSelected: boolean) => void;
    hugoSymbolFilter?: HugoSymbolFilter;
    hugoSymbolOptions?: Array<{value: string}>;
    onHugoSymbolSelect?: (hugoSymbols: string[], allValuesSelected: boolean) => void;
}

@observer
class LandscapeFilterPanel extends React.Component<IGeneLevelFilterPanelProps>
{
    public render() {
        return (
            <>
                <Col xs={0} lg={1} className="m-auto" />
                <Col xs={12} sm={6} lg={2} className="px-2">
                    <HugoSymbolSelector
                        filter={this.props.hugoSymbolFilter}
                        options={this.props.hugoSymbolOptions}
                        onSelect={this.props.onHugoSymbolSelect}
                    />
                </Col>
                <Col xs={12} sm={6} lg={2} className="px-2">
                    <CancerTypeSelector
                        filter={this.props.cancerTypeFilter}
                        options={this.props.cancerTypesOptions}
                        onSelect={this.props.onCancerTypeSelect}
                    />
                </Col>
                <Col xs={12} sm={6} lg={2} className="px-2">
                    {this.props.isFiltered &&
                        <FilterResetPanel
                            resetFilters={this.props.onResetFilters}
                            buttonText="Clear Filters"
                            filterInfo=""
                            className=""
                        />
                    }
                </Col>
                <Col xs={12} sm={6} lg={2} className="px-2" />
                <Col xs={0} lg={1} className="m-auto" />
            </>
        );
    }
}

export default LandscapeFilterPanel;
