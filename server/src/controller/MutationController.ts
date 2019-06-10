import autobind from "autobind-decorator";
import {Express, NextFunction} from "express";
import {Request, Response} from "express-serve-static-core";

import MutationService from "../service/MutationService";

class MutationController
{
    private mutationService: MutationService;

    constructor(app: Express,
                mutationService: MutationService = new MutationService())
    {
        // configure endpoints
        app.get("/api/mutation", this.fetchMutationsGET);

        // init services
        this.mutationService = mutationService;
    }

    @autobind
    private fetchMutationsGET(req: Request, res: Response, next: NextFunction) {
        const hugoSymbol = req.query.hugoSymbol;

        if (hugoSymbol) {
            this.mutationService.getMutationsByGene(hugoSymbol)
                .then(response => {
                    res.send(response.data);
                })
                .catch(err => {
                    next(err);
                })
        }
        else {
            res.send([]);
        }
    }
}

export default MutationController;
