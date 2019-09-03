import {DefaultTooltip} from "cbioportal-frontend-commons";
import {observer} from "mobx-react";
import * as React from 'react';
import {MutationStatusBadgeSelector, MutationStatusBadgeSelectorProps} from "react-mutation-mapper";

import {MutationStatusFilterValue} from "../util/FilterUtils";

export const MUTATION_RATE_HELPER = {
    [MutationStatusFilterValue.SOMATIC]: {
        title: "Somatic Mutant"
    },
    [MutationStatusFilterValue.BENIGN_GERMLINE]: {
        title: "Benign Germline"
    },
    [MutationStatusFilterValue.PATHOGENIC_GERMLINE]: {
        title: "Pathogenic Germline"
    },
    [MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]: {
        title: "Biallelic Pathogenic Germline",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor"
    }
};

export function getMutationStatusFilterOptions()
{
    return [
        {
            value: MutationStatusFilterValue.SOMATIC,
            label: MUTATION_RATE_HELPER[MutationStatusFilterValue.SOMATIC].title,
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.BENIGN_GERMLINE,
            label: MUTATION_RATE_HELPER[MutationStatusFilterValue.BENIGN_GERMLINE].title,
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.PATHOGENIC_GERMLINE,
            label: MUTATION_RATE_HELPER[MutationStatusFilterValue.PATHOGENIC_GERMLINE].title,
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE,
            label:
                <span>
                    {MUTATION_RATE_HELPER[MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE].title}
                    <DefaultTooltip
                        placement="right"
                        overlay={
                            <span>{MUTATION_RATE_HELPER[MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE].description}</span>
                        }
                    >
                        <i className="fa fa-info-circle" style={{marginLeft: "0.2rem"}} />
                    </DefaultTooltip>
                </span>,
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
    ];
}

@observer
export class MutationStatusSelector extends React.Component<MutationStatusBadgeSelectorProps, {}>
{
    public render() {
        return (
            <MutationStatusBadgeSelector
                badgeSelectorOptions={getMutationStatusFilterOptions()}
                {...this.props}
            />
        );
    }
}

export default MutationStatusSelector;
