import {GenomeNexusAPI} from "genome-nexus-ts-api-client";

// TODO customize domain?
const genomeNexusInternalClient = new GenomeNexusAPI("https://www.genomenexus.org/");

export function getGenomeNexusClient() {
    return genomeNexusInternalClient;
}
