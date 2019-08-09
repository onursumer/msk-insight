import {observer} from "mobx-react";

import {DropdownSelector, DropdownSelectorProps} from "react-mutation-mapper";

@observer
export class CancerTypeSelector extends DropdownSelector
{
    public static defaultProps: Partial<DropdownSelectorProps> = {
        name: "cancerTypeFilter",
        placeholder: "Cancer Type",
        showControls: true
    };
}

export default CancerTypeSelector;
