import {IMutation} from "../../../server/src/model/Mutation";

export function fetchMutationsByGene(hugoSymbol: string): Promise<IMutation[]>
{
    return new Promise<IMutation[]>((resolve, reject) => {
        fetch(`/api/mutation?hugoSymbol=${hugoSymbol}`)
            .then(response => resolve(response.json()))
            .catch(err => reject(err));
    });
}
