import {DefaultTooltip} from "cbioportal-frontend-commons";
import {observer} from "mobx-react";
import * as React from 'react';
import {MutationStatusBadgeSelector, MutationStatusBadgeSelectorProps} from "react-mutation-mapper";

import {MutationStatusFilterValue} from "../util/FilterUtils";

export const MUTATION_RATE_HELPER = {
    [MutationStatusFilterValue.SOMATIC]: {
        title: "Somatic",
        description: "Percent of samples with a somatic mutation"
    },
    [MutationStatusFilterValue.BENIGN_GERMLINE]: {
        title: "Benign Germline",
        description: "Percent of samples with a benign germline mutation"
    },
    [MutationStatusFilterValue.PATHOGENIC_GERMLINE]: {
        title: "Pathogenic Germline",
        description: "Percent of samples with a pathogenic germline mutation"
    },
    [MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]: {
        title: "Biallelic Pathogenic Germline",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor"
    }
};

export function getFilterOptionLabel(content: {title: string, description?: string}): JSX.Element | string
{
    if (content.description) {
        return (
            <span>
                {content.title}
                <DefaultTooltip
                    placement="right"
                    overlay={
                        <span>{content.description}</span>
                    }
                >
                    <i className="fa fa-info-circle" style={{marginLeft: "0.2rem"}} />
                </DefaultTooltip>
            </span>
        );
    }
    else {
        return content.title;
    }
}

export function getMutationStatusFilterOptions()
{
    return [
        {
            value: MutationStatusFilterValue.SOMATIC,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.SOMATIC]),
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.BENIGN_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.BENIGN_GERMLINE]),
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.PATHOGENIC_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.PATHOGENIC_GERMLINE]),
            badgeStyleOverride: {color: "#000", backgroundColor: "#FFF"}
        },
        {
            value: MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]),
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
