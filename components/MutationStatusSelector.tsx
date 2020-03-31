import {CheckBoxType, DefaultTooltip, getOptionLabel, Option} from "cbioportal-frontend-commons";
import _ from "lodash";
import {observer} from "mobx-react";
import * as React from 'react';
import {
    DataFilter,
    DataStore,
    MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
    MutationStatusBadgeSelector,
    MutationStatusBadgeSelectorProps
} from "react-mutation-mapper";

import {MutationStatusFilterValue} from "../util/FilterUtils";

export const MUTATION_RATE_HELPER = {
    [MutationStatusFilterValue.SOMATIC]: {
        title: "Somatic",
        description: "Percent of samples with a somatic mutation"
    },
    [MutationStatusFilterValue.BENIGN_GERMLINE]: {
        title: "Rare Benign/VUS Germline",
        description: "Percent of samples with a rare benign/VUS germline mutation"
    },
    [MutationStatusFilterValue.PATHOGENIC_GERMLINE]: {
        title: "Pathogenic Germline",
        description: "Percent of samples with a pathogenic germline mutation"
    },
    [MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]: {
        title: "Show Biallelic Only",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor sample"
    }
};

export function getChecklistOptionLabel(option: Option,
                                        selectedValues: {[optionValue: string]: any},
                                        checkBoxType: CheckBoxType = CheckBoxType.STRING): JSX.Element
{
    const defaultLabel = getOptionLabel(option, selectedValues, checkBoxType);

    return option.value === MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE ?
        <span>└─ {defaultLabel}</span>: defaultLabel;
}

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
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE
        },
        {
            value: MutationStatusFilterValue.BENIGN_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.BENIGN_GERMLINE]),
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE
        },
        {
            value: MutationStatusFilterValue.PATHOGENIC_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.PATHOGENIC_GERMLINE]),
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE
        },
        {
            value: MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE,
            label: getFilterOptionLabel(MUTATION_RATE_HELPER[MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE]),
            badgeStyleOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE,
            badgeStyleSelectedOverride: MUTATION_STATUS_BADGE_STYLE_OVERRIDE
        },
    ];
}

export function onMutationStatusFilterOptionSelect(selectedValues: string[],
                                                   checkedValues: string[],
                                                   uncheckedValues: string[],
                                                   allValuesSelected: boolean,
                                                   dataStore: DataStore,
                                                   dataFilterType: string,
                                                   dataFilterId: string)
{
    // all other filters except the current filter with the given data filter id
    const otherFilters = dataStore.dataFilters.filter((f: DataFilter) => f.id !== dataFilterId);

    let values = selectedValues;

    if (checkedValues.includes(MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE) ||
            (selectedValues.includes(MutationStatusFilterValue.PATHOGENIC_GERMLINE) &&
            selectedValues.includes(MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE)))
    {
        values = _.without(values, MutationStatusFilterValue.PATHOGENIC_GERMLINE);
    }
    else if (uncheckedValues.includes(MutationStatusFilterValue.PATHOGENIC_GERMLINE)) {
        values = _.without(values, MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE);
    }

    if (!selectedValues.includes(MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE) &&
        selectedValues.length === 3)
    {
        // no filtering required if all categories except biallelic is selected
        dataStore.setDataFilters(otherFilters);
    }
    else {
        const dataFilter = {
            id: dataFilterId,
            type: dataFilterType,
            values
        };

        // replace the existing data filter wrt the current selection (other filters + new data filter)
        dataStore.setDataFilters([...otherFilters, dataFilter]);
    }

    return values;
}

@observer
export class MutationStatusSelector extends React.Component<MutationStatusBadgeSelectorProps, {}>
{
    public render() {
        return (
            <MutationStatusBadgeSelector
                badgeSelectorOptions={getMutationStatusFilterOptions()}
                getOptionLabel={getChecklistOptionLabel}
                {...this.props}
            />
        );
    }
}

export default MutationStatusSelector;
