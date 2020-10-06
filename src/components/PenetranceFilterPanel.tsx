import classnames from 'classnames';
import {computed} from 'mobx'
import {observer} from 'mobx-react'
import * as React from 'react';
import {Col} from 'react-bootstrap';

import {PenetranceLevel} from "../model/Penetrance";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {
    applyGeneFrequencySummaryPenetranceFilter,
    PENETRANCE_FILTER_ID,
    PENETRANCE_FILTER_TYPE
} from "../util/FilterUtils";
import {IPenetranceButtonProps, PenetranceButton} from "./PenetranceButton";

export interface IPenetranceFilterPanelProps {
    geneFrequencyStore?: GeneFrequencyStore;
    selectedPenetranceLevels?: PenetranceLevel[];
    onSelect?: (penetrance?: PenetranceLevel) => void;
    multiSelect?: boolean;
}

interface IPenetranceColProps extends IPenetranceButtonProps {
    selectedPenetranceLevels?: PenetranceLevel[];
    multiSelect?: boolean;
}

const PenetranceButtonCol = (props: IPenetranceColProps) => {
    return (
        <Col xs={12} sm={6} lg={2} className="px-2">
            <PenetranceButton
                {...props}
                active={(props.selectedPenetranceLevels || []).includes(props.penetrance)}
                className={
                    classnames({
                        "mb-2": true,
                        [props.penetrance.toLowerCase()]: true,
                        "no-bg-color": props.multiSelect
                    })
                }
                onClick={props.onClick ? (() => props.onClick!(props.penetrance)): undefined}
                // do not set href if there is a click handler available
                href={props.onClick ? undefined: `/explore?penetrance=${props.penetrance.toLowerCase()}`}
            />
        </Col>
    );
}

function getPenetranceProps(
    penetrance: PenetranceLevel,
    geneFrequencyStore?: GeneFrequencyStore,
    onSelect?: (penetrance?: string) => void
): IPenetranceButtonProps {
    return {
        penetrance,
        onClick: onSelect,
        geneCount: geneFrequencyStore ? geneFrequencyStore.geneFrequencySummaryData.filter(s =>
            applyGeneFrequencySummaryPenetranceFilter({
                    id: PENETRANCE_FILTER_ID,
                    type: PENETRANCE_FILTER_TYPE,
                    values: [penetrance]
                },
                s
            )
        ).length: undefined,
        // TODO calculate actual counts & enable if needed
        // variantCount: -1,
        // patientCount: -1
    };
}

@observer
class PenetranceFilterPanel extends React.Component<IPenetranceFilterPanelProps>
{
    @computed
    public get penetranceButtonProps(): IPenetranceButtonProps[] {
        return [
            PenetranceLevel.High,
            PenetranceLevel.Moderate,
            PenetranceLevel.Low,
            PenetranceLevel.Uncertain
        ].map(p => getPenetranceProps(p, this.props.geneFrequencyStore, this.props.onSelect));
    }

    public render() {
        return (
            <>
                <Col xs={0} lg={1} className="m-auto" />
                {
                    this.penetranceButtonProps.map(props =>
                        <PenetranceButtonCol
                            {...props}
                            key={props.penetrance}
                            selectedPenetranceLevels={this.props.selectedPenetranceLevels}
                            multiSelect={this.props.multiSelect}
                        />
                    )
                }
                <Col xs={0} lg={1} className="m-auto" />
            </>
        );
    }
}

export default PenetranceFilterPanel;
