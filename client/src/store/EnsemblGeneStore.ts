import {observable} from "mobx";

import {IEnsemblGene} from "../../../server/src/model/EnsemblGene";
import {fetchEnsemblGene} from "../util/EnsemblDataUtils";
import {DataStatus} from "./DataStatus";

class EnsemblGeneStore
{
    @observable
    public ensemblGeneDataStatus: DataStatus = 'pending';

    public ensemblGenePromise: Promise<IEnsemblGene>;

    @observable
    public ensemblGeneData: IEnsemblGene | undefined;

    @observable
    public filterText: string|undefined;

    constructor(hugoSymbol: string) {
        this.ensemblGenePromise = fetchEnsemblGene(hugoSymbol);

        this.ensemblGenePromise
            .then(data => {
                this.ensemblGeneData = data;
                this.ensemblGeneDataStatus = 'complete';
            })
            .catch(() => {
                this.ensemblGeneData = undefined;
                this.ensemblGeneDataStatus = 'error';
            });
    }
}

export default EnsemblGeneStore;