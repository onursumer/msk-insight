import _ from "lodash";
import { computed } from "mobx";
import { observer } from "mobx-react";
import * as React from 'react';
import { Col } from 'react-bootstrap';
import {CancerTypeFilter} from "react-mutation-mapper";

import GeneFrequencyStore from "../store/GeneFrequencyStore";
import CancerTypeSelector from "./CancerTypeSelector";


export interface IGeneLevelFilterPanelProps {
    geneFrequencyStore?: GeneFrequencyStore;
    cancerTypeFilter?: CancerTypeFilter;
    onCancerTypeSelect?: (selectedCancerTypeIds: string[], allValuesSelected: boolean) => void;
}

@observer
class LandscapeFilterPanel extends React.Component<IGeneLevelFilterPanelProps>
{
    @computed
    public get cancerTypes() {
        return _.uniq(this.props.geneFrequencyStore?.knownTumorTypeFrequencySummaryData.map(d => d.tumorType) || []);
    }

    @computed
    public get cancerTypesOptions() {
        return this.cancerTypes.map(t => ({value: t}));
    }

    public render() {
        return (
            <>
                <Col xs={0} lg={1} className="m-auto" />
                <Col xs={12} sm={6} lg={2} className="px-2">
                    <CancerTypeSelector
                        filter={this.props.cancerTypeFilter}
                        options={this.cancerTypesOptions}
                        onSelect={this.props.onCancerTypeSelect}
                    />
                </Col>
                <Col xs={0} lg={1} className="m-auto" />
            </>
        );
    }
}

export default LandscapeFilterPanel;
