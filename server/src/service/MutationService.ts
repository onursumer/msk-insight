import {IMutation} from "../model/Mutation";

class MutationService
{
    public getMutationsByGene(hugoSymbol?: string): IMutation[]
    {
        // TODO fetch from genome nexus!
        return [];
    }
}

export default MutationService;
