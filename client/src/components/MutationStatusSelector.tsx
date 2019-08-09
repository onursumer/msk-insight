import {observer} from "mobx-react";
import * as React from 'react';

import {DropdownSelector, DropdownSelectorProps} from "react-mutation-mapper";

@observer
export class MutationStatusSelector extends React.Component<DropdownSelectorProps, {}>
{
    public render() {
        return (
            <DropdownSelector
                name="mutationStatusFilter"
                placeholder="Mutation Status"
                showControls={true}
                {...this.props}
            />
        );
    }
}

export default MutationStatusSelector;
