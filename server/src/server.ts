import compression from "compression";
import express from 'express';
import path from 'path';

import GeneSummaryController from "./controller/GeneSummaryController";
import MutationController from "./controller/MutationController";

const app = express();

const port = process.env.PORT || 3081;
const staticAppDir = "reactapp";
const routerRoot = "index.html";

const mutationController = new MutationController(app);
const frequencyController = new GeneSummaryController(app);

if (process.env.NODE_ENV === "production")
{
    app.use(compression());
    app.use(express.static(path.join(__dirname, staticAppDir)));

    app.get('/*', (req, res) => {
        res.sendFile(path.join(__dirname, staticAppDir, routerRoot));
    });
}

app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`Started app on port ${port}`)
});
