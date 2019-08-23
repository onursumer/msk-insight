import {IEnsemblGene} from "../../../server/src/model/EnsemblGene";

export function fetchEnsemblGene(hugoSmybol: string): Promise<IEnsemblGene> {
    return new Promise<IEnsemblGene>((resolve, reject) => {
        fetch(`/api/ensembl/gene/${hugoSmybol}`)
            .then(response => resolve(response.json()))
            .catch(err => reject(err));
    });
}
