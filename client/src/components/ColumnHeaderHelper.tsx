import * as React from "react";
import {ColumnHeader} from "react-mutation-mapper";

export enum ColumnId {
    HUGO_SYMBOL = "hugoSymbol",
    SOMATIC = "somatic",
    GERMLINE = "germline",
    PERCENT_BIALLELIC = "percentBialleic",
    MUTATION_FREQUENCIES = "mutationFrequencies"
}

export const HEADER_COMPONENT: {[id: string] : JSX.Element} = {
    [ColumnId.SOMATIC]: (
        <ColumnHeader
            headerContent={<span>% Somatic Mutant <i className="fa fa-info-circle" /></span>}
            overlay={<span>Includes only likely driver mutations</span>}
        />
    ),
    [ColumnId.GERMLINE]: <ColumnHeader headerContent="% Pathogenic Germline"/>,
    [ColumnId.PERCENT_BIALLELIC]: (
        <ColumnHeader
            headerContent={<span>% Biallelic <i className="fa fa-info-circle" /></span>}
            overlay={<span>Percent of pathogenic germline carriers biallelic in the corresponding tumor</span>}
        />
    ),
    [ColumnId.MUTATION_FREQUENCIES]: <ColumnHeader headerContent="Mutation Frequencies"/>,
};
