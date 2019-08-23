import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {CancerTypeFilter, DataFilterType, TrackName} from "react-mutation-mapper";

import {IEnsemblGene} from "../../../server/src/model/EnsemblGene";
import {IExtendedMutation, ITumorTypeDecomposition} from "../../../server/src/model/Mutation";
import {
    applyCancerTypeFilter,
    applyMutationStatusFilter,
    containsCancerType,
    matchesMutationStatus,
    MUTATION_COUNT_FILTER_TYPE,
    MUTATION_STATUS_FILTER_ID,
    MUTATION_STATUS_FILTER_TYPE,
    MutationCountFilter,
    MutationStatusFilter,
    MutationStatusFilterValue
} from "../util/FilterUtils";
import {loaderWithText} from "../util/StatusHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPercentage} from "./ColumnRenderHelper";
import InsightMutationMapper from "./InsightMutationMapper";
import MutationTumorTypeFrequencyDecomposition from "./MutationTumorTypeFrequencyDecomposition";

const API_CACHE_LIMIT = 450; // TODO parametrize this on the server side?

interface IMutationMapperProps
{
    data: IExtendedMutation[];
    hugoSymbol: string;
    ensemblGene?: IEnsemblGene;
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
    private insightMutationMapper: InsightMutationMapper | undefined;

    @computed
    get entrezGeneId()
    {
        return this.props.ensemblGene ?
            parseInt(this.props.ensemblGene.entrezGeneId, 10): undefined;
    }

    public render()
    {
        return (
            <InsightMutationMapper
                apiCacheLimit={API_CACHE_LIMIT}
                onInit={this.onMutationMapperInit}
                hugoSymbol={this.props.hugoSymbol}
                // TODO entrezGeneId={this.entrezGeneId}
                data={this.props.data}
                showPlotLegendToggle={false}
                showPlotDownloadControls={false}
                showTranscriptDropDown={true}
                showOnlyAnnotatedTranscriptsInDropdown={true}
                filterMutationsBySelectedTranscript={true}
                mainLoadingIndicator={this.loader}
                tracks={[TrackName.CancerHotspots, TrackName.OncoKB, TrackName.PTM]}
                getMutationCount={this.getMutationCount}
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
                            filter: {type: DataFilterType.MUTATION, values: [{mutationStatus: "somatic"}]}
                        },
                        {
                            group: "Germline",
                            filter: {type: DataFilterType.MUTATION, values: [{mutationStatus: "germline"}]}
                        },
                    ]
                }
                dataFilters={[
                    {
                        id: MUTATION_STATUS_FILTER_ID,
                        type: MUTATION_STATUS_FILTER_TYPE,
                        values: [
                            MutationStatusFilterValue.SOMATIC,
                            MutationStatusFilterValue.PATHOGENIC_GERMLINE,
                            MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE
                        ]
                    }
                ]}
                filterAppliersOverride={this.customFilterAppliers}
            />
        );
    }

    private get customFilterAppliers()
    {
        return {
            [DataFilterType.CANCER_TYPE]: this.applyCancerTypeFilter,
            [MUTATION_STATUS_FILTER_TYPE]: this.applyMutationStatusFilter,
            [MUTATION_COUNT_FILTER_TYPE]: this.applyMutationCountFilter
        };
    };

    @autobind
    private getMutationCount(mutation: IExtendedMutation)
    {
        const cancerTypeFilter = this.insightMutationMapper ? this.insightMutationMapper.cancerTypeFilter : undefined;
        const mutationStatusFilter = this.insightMutationMapper ? this.insightMutationMapper.mutationStatusFilter : undefined;

        // take the current cancer type and mutation status filter into account
        return mutation.tumorTypeDecomposition
            .map(t => (
                    containsCancerType(cancerTypeFilter, t.tumorType) &&
                    matchesMutationStatus(mutationStatusFilter, mutation, t)
                ) ? t.variantCount : 0)
            .reduce((sum, count) => sum + count)
    }

    private get mutationCountFilter() {
        return {
            type: MUTATION_COUNT_FILTER_TYPE,
            values: [0]
        };
    }

    @autobind
    private applyCancerTypeFilter(filter: CancerTypeFilter, mutation: IExtendedMutation) {
        return applyCancerTypeFilter(filter, mutation) && this.applyMutationCountFilter(this.mutationCountFilter, mutation);
    }

    @autobind
    private applyMutationStatusFilter(filter: MutationStatusFilter, mutation: IExtendedMutation) {
        return applyMutationStatusFilter(filter, mutation) && this.applyMutationCountFilter(this.mutationCountFilter, mutation);
    }

    @autobind
    private applyMutationCountFilter(filter: MutationCountFilter, mutation: IExtendedMutation) {
        return filter.values.map(v => this.getMutationCount(mutation) > v).includes(true);
    }

    private get loader() {
        return loaderWithText("Annotating with Genome Nexus...");
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
                                (c: ITumorTypeDecomposition) =>
                                    c.variantCount > 0 && containsCancerType(
                                        this.insightMutationMapper ?
                                            this.insightMutationMapper.cancerTypeFilter : undefined,
                                        c.tumorType)
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

    @autobind
    private onMutationMapperInit(mutationMapper: InsightMutationMapper)
    {
        this.insightMutationMapper = mutationMapper;
    }
}

export default MutationMapper;
