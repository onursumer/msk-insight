import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {
    TrackName
} from "react-mutation-mapper";

import {ICountByTumorType, IMutation} from "../../../server/src/model/Mutation";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import InsightMutationMapperStore from "../store/InsightMutationMapperStore";
import {FrequencySummaryCategory} from "../util/ColumnHelper";
import {containsCancerType} from "../util/FilterUtils";
import {loaderWithText} from "../util/StatusHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPercentage} from "./ColumnRenderHelper";
import InsightMutationMapper from "./InsightMutationMapper";
import MutationTumorTypeFrequencyDecomposition from "./MutationTumorTypeFrequencyDecomposition";


export const MUTATION_RATE_HELPER = {
    [FrequencySummaryCategory.SOMATIC_DRIVER]: {
        title: "% Somatic Mutant",
        description: "Includes only likely driver mutations",
    },
    [FrequencySummaryCategory.PATHOGENIC_GERMLINE]: {
        title: "% Pathogenic Germline"
    },
    [FrequencySummaryCategory.PERCENT_BIALLELIC]: {
        title: "% Biallelic",
        description: "Percent of pathogenic germline carriers biallelic in the corresponding tumor"
    }
};

interface IMutationMapperProps
{
    data: IMutation[];
    frequencyStore?: GeneFrequencyStore;
    hugoSymbol: string;
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
    private readonly store: InsightMutationMapperStore;

    constructor(props: IMutationMapperProps)
    {
        super(props);
        this.store = new InsightMutationMapperStore(props.data);
    }

    @computed
    private get frequencyStore() {
        return this.props.frequencyStore || new GeneFrequencyStore();
    }

    @computed
    private get mutationRates() {
        let rates;

        if (this.frequencyStore.geneFrequencyDataStatus === 'complete') {
            const frequencyData = this.frequencyStore.mutationFrequencyData.find(
                f => f.hugoSymbol === this.props.hugoSymbol);

            if (frequencyData) {
                rates = frequencyData.frequencies.map(f => ({
                    ...MUTATION_RATE_HELPER[f.category],
                    rate: f.frequency * 100
                }));
            }
        }

        return rates;
    }

    private get loader() {
        return loaderWithText("Annotating with Genome Nexus...");
    }

    public render()
    {
        return (
            <InsightMutationMapper
                insightMutationMapperStore={this.store}
                hugoSymbol={this.props.hugoSymbol}
                data={this.props.data}
                showTranscriptDropDown={true}
                genomeNexusUrl="https://www.genomenexus.org/beta"
                showOnlyAnnotatedTranscriptsInDropdown={true}
                filterMutationsBySelectedTranscript={true}
                mutationRates={this.mutationRates}
                mainLoadingIndicator={this.loader}
                tracks={[TrackName.CancerHotspots, TrackName.OncoKB, TrackName.PTM]}
                getMutationCount={this.store.getMutationCount}
                customMutationTableColumns={[
                    {
                        id: ColumnId.SOMATIC,
                        name: "% Somatic Mutant",
                        Cell: renderPercentage,
                        accessor: "somaticFrequency",
                        Header: HEADER_COMPONENT[ColumnId.SOMATIC]
                    },
                    {
                        id: ColumnId.GERMLINE,
                        name: "% Pathogenic Germline",
                        Cell: renderPercentage,
                        accessor: "pathogenicGermlineFrequency",
                        Header: HEADER_COMPONENT[ColumnId.GERMLINE]
                    },
                    {
                        id: ColumnId.PERCENT_BIALLELIC,
                        name: "% Biallelic",
                        Cell: renderPercentage,
                        accessor: "ratioBiallelicPathogenic",
                        Header: HEADER_COMPONENT[ColumnId.PERCENT_BIALLELIC]
                    },
                    {
                        expander: true,
                        Expander: this.renderExpander,
                        togglable: false,
                        width: 25
                    }
                ]}
                customMutationTableProps={{
                    SubComponent: this.renderSubComponent
                }}
                groupFilters={
                    [
                        {
                            group: "Somatic",
                            filter: {type: "mutation", values: [{mutationStatus: "somatic"}]}
                        },
                        {
                            group: "Germline",
                            filter: {type: "mutation", values: [{mutationStatus: "germline"}]}
                        },
                    ]
                }
                filterAppliersOverride={this.store.customFilterAppliers}
            />
        );
    }

    @autobind
    private renderSubComponent(row: any) {
        return (
            <div className="p-4">
                <MutationTumorTypeFrequencyDecomposition
                    hugoSymbol={row.original.hugoSymbol}
                    dataPromise={
                        Promise.resolve(
                            row.original.tumorTypeDecomposition.filter(
                                (c: ICountByTumorType) =>
                                    c.variantCount > 0 && containsCancerType(this.store.cancerTypeFilter, c.tumorType)
                            )
                        )
                    }
                />
            </div>
        );
    }

    @autobind
    private renderExpander(props: {isExpanded: boolean}) {
        return props.isExpanded ?
            <i className="fa fa-minus-circle" /> :
            <i className="fa fa-plus-circle" />;
    }
}

export default MutationMapper;
