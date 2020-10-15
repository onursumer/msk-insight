import { GenomeNexusAPI } from 'genome-nexus-ts-api-client';

import {SearchOptionType} from "../components/SearchOption";
import {ISignalSearch} from "../model/SignalSearch";
import {getGenomeNexusClient} from "./ApiClientUtils";

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

export function searchMutationsByKeyword(
    keyword: string,
    limit: number = -1,
    client: GenomeNexusAPI = getGenomeNexusClient()
): Promise<ISignalSearch[]>
{
    return new Promise<ISignalSearch[]>((resolve, reject) => {
        // TODO temp url, use the genome nexus API client
        fetch(`https://beta.genomenexus.org/signal/search/${keyword}?limit=${limit}`)
            .then(response => resolve(response.json()))
            .catch(err => reject(err));
    });
}
