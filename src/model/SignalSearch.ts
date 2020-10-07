// TODO define this model in the backend.
export interface ISignalSearch {
    queryType: string;
    link: string;
    gene: {
        hugoSymbol: string;
        entrezGeneId: number;
    };
    alteration: string;
    region: string;
    variant: string;
    annotation: string;
}
