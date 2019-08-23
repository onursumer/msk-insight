import autobind from "autobind-decorator";
import {Express, NextFunction} from "express";
import {Request, Response} from "express-serve-static-core";

import GenomeNexusService from "../service/GenomeNexusService";

class EnsemblController
{
    private genomeNexusService: GenomeNexusService;

    constructor(app: Express,
                genomeNexusService: GenomeNexusService = new GenomeNexusService())
    {
        // configure endpoints
        app.get("/api/ensembl/gene/:hugoSymbol", this.fetchEnsemblGeneGET);

        // init services
        this.genomeNexusService = genomeNexusService;
    }

    @autobind
    private fetchEnsemblGeneGET(req: Request, res: Response, next: NextFunction) {
        const hugoSymbol = req.params.hugoSymbol;

        if (hugoSymbol) {
            this.genomeNexusService.getEnsemblGeneByHugoSymbol(hugoSymbol)
                .then(response => {
                    res.send(response.data);
                })
                .catch(err => {
                    next(err);
                })
        }
        else {
            res.send(null);
        }
    }
}

export default EnsemblController;
