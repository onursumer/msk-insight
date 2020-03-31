import * as React from "react";
import {ColumnHeader} from "react-mutation-mapper";

export enum ColumnId {
    HUGO_SYMBOL = "hugoSymbol",
    TUMOR_TYPE = "tumorType",
    PENETRANCE = "penetrance",
    SOMATIC = "somatic",
    SOMATIC_DRIVER = "somaticDriver",
    GERMLINE = "germline",
    PERCENT_BIALLELIC = "percentBialleic",
    MUTATION_PERCENT = "mutationPercent",
    SAMPLE_COUNT = "sampleCount"
}

export const HEADER_COMPONENT: {[id: string] : JSX.Element} = {
    [ColumnId.HUGO_SYMBOL]: (
        <ColumnHeader
            headerContent={<span className="pull-left ml-3">Gene</span>}
        />
    ),
    [ColumnId.PENETRANCE]: (
        <ColumnHeader
            headerContent={<span className="pull-left ml-3">Penetrance</span>}
        />
    ),
    [ColumnId.TUMOR_TYPE]: (
        <ColumnHeader
            headerContent={<span className="pull-left ml-3">Tumor Type</span>}
        />
    ),
    [ColumnId.SOMATIC_DRIVER]: (
        <ColumnHeader
            headerContent={<span className="pull-right mr-3">% Somatic Driver <i className="fa fa-info-circle" /></span>}
            overlay={<span>Includes only likely driver mutations, or relevant copy number changes</span>}
        />
    ),
    [ColumnId.SOMATIC]: <ColumnHeader headerContent={<span className="pull-right mr-3">% Somatic</span>} />,
    [ColumnId.GERMLINE]: (
        <ColumnHeader
            headerContent={<span className="pull-right mr-3">% Germline Pathogenic <i className="fa fa-info-circle" /></span>}
            overlay={/*TODO add overlay content */ <span>% Germline Pathogenic</span>}
        />
    ),
    [ColumnId.PERCENT_BIALLELIC]: (
        <ColumnHeader
            headerContent={<span className="pull-right mr-3">% Biallelic <i className="fa fa-info-circle" /></span>}
            overlay={<span>Percent of pathogenic germline carriers biallelic in the corresponding tumor sample</span>}
        />
    ),
    [ColumnId.MUTATION_PERCENT]: <ColumnHeader headerContent={<span className="pull-right mr-3">%</span>} />,
    [ColumnId.SAMPLE_COUNT]: <ColumnHeader headerContent={<span className="text-wrap"># Samples</span>} />,
};
