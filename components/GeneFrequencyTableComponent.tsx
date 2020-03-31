import {action} from "mobx";
import {observer} from "mobx-react";
import {DataTable} from "react-mutation-mapper";

import {IGeneFrequencySummary} from "..//model/GeneFrequencySummary";

@observer
export default class GeneFrequencyTableComponent extends DataTable<IGeneFrequencySummary>
{
    @action.bound
    public collapseSubComponent() {
        this.resetExpander();
    }
}