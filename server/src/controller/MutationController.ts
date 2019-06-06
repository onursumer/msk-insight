import autobind from "autobind-decorator";
import {Express} from "express";
import {Request, Response} from "express-serve-static-core";

import MutationService from "../service/MutationService";

class MutationController
{
    private mutationService: MutationService;

    constructor(app: Express,
                mutationService: MutationService = new MutationService())
    {
        // configure endpoints
        app.get("/api/mutation/byGene", this.fetchMutationsByGeneGET);

        // init services
        this.mutationService = mutationService;
    }

    @autobind
    private fetchMutationsByGeneGET(req: Request, res: Response) {
        const hugoSymbol = req.query.hugoSymbol;

        if (hugoSymbol) {
            res.send(this.mutationService.getMutationsByGene(hugoSymbol));
        }
        else {
            res.send([]);
        }
    }
}

export default MutationController;
