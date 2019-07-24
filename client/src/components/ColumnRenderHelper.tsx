import * as React from "react";

import FrequencyCell from "./FrequencyCell";

export function renderPercentage(cellProps: any)
{
    return (
        <FrequencyCell frequency={cellProps.value || 0} />
    );
}
