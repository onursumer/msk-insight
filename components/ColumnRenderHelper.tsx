import * as React from "react";

import FrequencyCell from "./FrequencyCell";
import PenetranceList from "./PenetranceList";

export function renderPercentage(cellProps: any)
{
    return (
        <FrequencyCell frequency={cellProps.value} />
    );
}

export function renderPenetrance(cellProps: any)
{
    return (
        <PenetranceList
            penetrance={cellProps.value}
        />
    );
}