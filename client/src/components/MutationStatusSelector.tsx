import {observer} from "mobx-react";

import {DropdownSelector, DropdownSelectorProps} from "react-mutation-mapper";

@observer
export class MutationStatusSelector extends DropdownSelector
{
    public static defaultProps: Partial<DropdownSelectorProps> = {
        name: "mutationStatusFilter",
        placeholder: "Mutation Status",
        showControls: true
    };
}

export default MutationStatusSelector;
