import {observer} from "mobx-react";
import * as React from 'react';

import {DropdownSelector, DropdownSelectorProps} from "react-mutation-mapper";

@observer
export class CancerTypeSelector extends React.Component<DropdownSelectorProps, {}>
{
    public render() {
        return (
            <DropdownSelector
                name="cancerTypeFilter"
                placeholder="Cancer Type"
                showControls={true}
                {...this.props}
            />
        );
    }
}

export default CancerTypeSelector;
