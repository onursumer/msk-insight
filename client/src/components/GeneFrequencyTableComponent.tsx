import {observer} from "mobx-react";
import {DataTable} from "react-mutation-mapper";

import {IGeneFrequencySummary} from "../../../server/src/model/GeneFrequencySummary";

@observer
export default class GeneFrequencyTableComponent extends DataTable<IGeneFrequencySummary> {

}