import {SearchOptionType} from "../components/SearchOption";
import {ISignalSearch} from "../model/SignalSearch";

export function generateLink(query: ISignalSearch) {
    switch (query.queryType) {
        case SearchOptionType.GENE:
            return `gene/${query.hugoSymbol}`;
        case SearchOptionType.VARIANT:
        case SearchOptionType.REGION:
        case SearchOptionType.ALTERATION:
            return `variant/${query.variant}`;
        default:
            return undefined;
    }
}