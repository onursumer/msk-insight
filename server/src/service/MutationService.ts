import axios from "axios";

// import {IMutation} from "../model/Mutation";

// TODO make the url configurable?
const GENOME_NEXUS_URL = "https://www.genomenexus.org/beta";

class MutationService
{
    public getMutationsByGene(hugoSymbol?: string)
    {
        return axios.get(`${GENOME_NEXUS_URL}/insight/mutation?hugoGeneSymbol=${hugoSymbol}`);
    }
}

export default MutationService;
