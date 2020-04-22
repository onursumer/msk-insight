const csvToJson = require('csvtojson');
const fs = require('fs');
const process = require('process');
const yargs = require('yargs');

const {indexAnnotationsByGenomicLocation} = require('cbioportal-utils');
const {GenomeNexusAPI, GenomeNexusAPIInternal } = require('genome-nexus-ts-api-client');

const GENE_SUMMARY_FILE = "./public/data/signal.pancancer_somatic_germline_stats.txt";
const CANCER_HOTSPOTS_PATH = "./public/data/hotspot";
const SIGNALDB_MUTATION_PATH = "./public/data/mutation";
const VARIANT_ANNOTATION_PATH = "./public/data/variantAnnotation";

const genomeNexusApiClient = new GenomeNexusAPI("https://www.genomenexus.org");
const genomeNexusInternalApiClient = new GenomeNexusAPIInternal("https://www.genomenexus.org");

function getGenomicLocation(mutation) {
    return {
        chromosome: mutation.chromosome,
        start: mutation.startPosition,
        end: mutation.endPosition,
        variantAllele: mutation.variantAllele,
        referenceAllele: mutation.referenceAllele
    };
}

async function readGenes(filename) {
    const geneSummaryTsv = fs.readFileSync(filename, "utf8");
    const geneSummary = await csvToJson({delimiter: "\t"}).fromString(geneSummaryTsv);
    return geneSummary.map(g => g["Hugo_Symbol"]);
}

function generateGenomicLocations(genes) {
    const map = {};

    for (const gene of genes) {
        const rawMutations = fs.readFileSync(
            `./public/data/mutation/${gene.toLowerCase()}.json`,
            "utf8"
        );
        const mutationsJson = JSON.parse(rawMutations);
        const genomicLocations = mutationsJson
            .map(getGenomicLocation)
            .filter(g =>
                g.chromosome !== undefined && g.start > -1 && g.end > -1
            );

        map[gene.toLowerCase()] = genomicLocations;
    }

    return map;
}

async function fetchMutations(genes, path) {
    const unsuccessfulQueries = [];

    // fetch mutations from genome nexus and store in a separate file
    for (const gene of genes) {
        const key = gene.toLowerCase();
        const mutations = await genomeNexusInternalApiClient.fetchSignalMutationsByHugoSymbolGETUsingGET({
            hugoGeneSymbol: gene
        }).catch(e => unsuccessfulQueries.push(gene));

        if (!unsuccessfulQueries.includes(gene)) {
            fs.writeFileSync(
                `${path}/${key}.json`,
                JSON.stringify(mutations, null, 2),
            );
        }
    }

    return unsuccessfulQueries;
}

async function fetchVariantAnnotations(genes, genomicLocationMap, path) {
    const unsuccessfulQueries = [];

    // fetch variant annotations
    for (const gene of genes) {
        const key = gene.toLowerCase();
        const genomicLocations = genomicLocationMap[key] || [];

        const variantAnnotations = await genomeNexusApiClient.fetchVariantAnnotationByGenomicLocationPOST({
            genomicLocations: genomicLocations,
            isoformOverrideSource: "mskcc",
            fields: ["hotspots", "annotation_summary", "my_variant_info"]
        }).catch(e => unsuccessfulQueries.push(gene));

        if (!unsuccessfulQueries.includes(gene)) {
            const indexedVariantAnnotations = indexAnnotationsByGenomicLocation(variantAnnotations);
            fs.writeFileSync(
                `${path}/${key}.json`,
                JSON.stringify(indexedVariantAnnotations, null, 2),
                "utf8"
            );
        }
    }

    return unsuccessfulQueries;
}

async function fetchHotspots(genes, genomicLocationMap, path) {
    const unsuccessfulQueries = [];

    // fetch variant annotations
    for (const gene of genes) {
        const key = gene.toLowerCase();
        const genomicLocations = genomicLocationMap[key] || [];

        const hotspotAnnotation = await genomeNexusInternalApiClient.fetchHotspotAnnotationByGenomicLocationPOST({
            genomicLocations: genomicLocations,
        }).catch(e => unsuccessfulQueries.push(gene));

        if (!unsuccessfulQueries.includes(gene)) {
            fs.writeFileSync(
                `${path}/${key}.json`,
                JSON.stringify(hotspotAnnotation, null, 2),
                "utf8"
            );
        }
    }

    return unsuccessfulQueries;
}

async function generateFiles(
    shouldFetchMutations,
    shouldAnnotateMutations,
    shouldFetchHotspots,
    geneList,
    geneFilename,
    mutationPath,
    variantAnnotationPath,
    cancerHotspotPath
) {
    const genes = geneList && geneList.length > 0 ?
        geneList: await readGenes(geneFilename);

    let failedMutations = [];
    let failedAnnotations = [];
    let failedHotspots = [];

    if (shouldFetchMutations) {
        console.log(`[${new Date()}] Fetching mutations from GenomeNexus...`);
        failedMutations = await fetchMutations(genes, mutationPath);
    }

    console.log(`[${new Date()}] Indexing genomic locations...`);
    const genomicLocations = generateGenomicLocations(genes);

    if (shouldAnnotateMutations) {
        console.log(`[${new Date()}] Annotating mutations with GenomeNexus...`);
        failedAnnotations = await fetchVariantAnnotations(genes, genomicLocations, variantAnnotationPath);
    }

    if (shouldFetchHotspots) {
        console.log(`[${new Date()}] Fetching hotspot mutations from GenomeNexus...`);
        failedHotspots = await fetchHotspots(genes, genomicLocations, cancerHotspotPath);
    }

    return {
        mutations: failedMutations,
        annotations: failedAnnotations,
        hotspots: failedHotspots
    };
}

function getArgs() {
    return yargs
        .help('h')
        .alias('h', 'help')
        .option('fetch-mutations', {
            alias: 'm',
            type: 'boolean',
            default: true,
            describe: 'Fetch SignalDB mutations from GenomeNexus'
        })
        .option('mutation-path', {
            type: 'string',
            default: SIGNALDB_MUTATION_PATH,
            describe: 'Path to Signal mutation files'
        })
        .option('fetch-annotations', {
            alias: 'a',
            type: 'boolean',
            default: true,
            describe: 'Annotate SignalDB mutations with GenomeNexus'
        })
        .option('variant-annotation-path', {
            type: 'string',
            default: VARIANT_ANNOTATION_PATH,
            describe: 'Path to variant annotation files'
        })
        .option('fetch-cancer-hotspots', {
            alias: 'c',
            type: 'boolean',
            default: false,
            describe: 'Fetch SignalDB hotspot mutations from GenomeNexus'
        })
        .option('cancer-hotspots-path', {
            type: 'string',
            default: CANCER_HOTSPOTS_PATH,
            describe: 'Path to cancer hotspot annotation files'
        })
        .option('gene-list', {
            alias: 'g',
            type: 'string',
            describe: 'Comma separated list of hugo gene symbols, e.g: TP53,EGFR,BRCA2'
        })
        .option('gene-file', {
            type: 'string',
            default: GENE_SUMMARY_FILE,
            describe: 'File to read the list of hugo gene symbols from, ignored when gene list exists'
        })
        .argv;
}

function handleResult(failed) {
    if (failed.annotations.length > 0 || failed.mutations.length > 0) {
        console.log(`[[${new Date()}]] Update completed with errors :(`);

        if (failed.mutations.length > 0) {
            console.log("\tError while fetching mutations for ", failed.mutations);
        }

        if (failed.annotations.length > 0) {
            console.log("\tError while fetching annotations for ", failed.annotations);
        }

        if (failed.hotspots.length > 0) {
            console.log("\tError while fetching hotspots for ", failed.hotspots);
        }

        process.exit(1);
    }
    else {
        console.log(`[${new Date()}] Update completed without errors!`);
    }
}

function main(args) {
    generateFiles(
        args.fetchMutations,
        args.fetchAnnotations,
        args.fetchCancerHotspots,
        args.geneList ? args.geneList.split(","): [],
        args.geneFile,
        args.mutationPath,
        args.variantAnnotationPath,
        args.cancerHotspotsPath
    ).then(handleResult);
}

main(getArgs());
