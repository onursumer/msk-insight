import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {
    CancerTypeFilter,
    ColumnSortDirection,
    DataFilterType, defaultSortMethod,
    formatPercentValue,
    MUTATION_COLUMNS_DEFINITION,
    MutationColumn,
    MutationStatus,
    numberOfLeadingDecimalZeros,
    ProteinChange,
    TrackName
} from "react-mutation-mapper";

import {IEnsemblGene} from "../model/EnsemblGene";
import {IExtendedMutation, ITumorTypeDecomposition} from "../model/Mutation";
import {
    applyCancerTypeFilter,
    applyMutationStatusFilter,
    containsCancerType,
    getDefaultMutationStatusFilterValues,
    MUTATION_COUNT_FILTER_TYPE,
    MUTATION_STATUS_FILTER_ID,
    MUTATION_STATUS_FILTER_TYPE,
    MutationCountFilter,
    MutationStatusFilter,
    MutationStatusFilterValue
} from "../util/FilterUtils";
import {
    calculateMutationRate,
    getVariantCount,
    isGermlineMutation,
    isPathogenicMutation,
    isSomaticMutation
} from "../util/MutationDataUtils";
import {loaderWithText} from "../util/StatusHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPenetrance, renderPercentage} from "./ColumnRenderHelper";
import {sortPenetrance} from "./GeneFrequencyTable";
import MutationTumorTypeFrequencyDecomposition from "./MutationTumorTypeFrequencyDecomposition";
import SignalMutationMapper from "./SignalMutationMapper";

// TODO make these externally configurable?
const API_CACHE_LIMIT = 450;
const ISOFORM_OVERRIDE_SOURCE = "mskcc";
const ONCOKB_API_URL = "https://www.cbioportal.org/proxy/oncokb";

interface IMutationMapperProps
{
    data: IExtendedMutation[];
    hugoSymbol: string;
    ensemblGene?: IEnsemblGene;
}

function mutationStatusAccessor(mutation: IExtendedMutation)
{
    if (isSomaticMutation(mutation)) {
        return MutationStatusFilterValue.SOMATIC;
    }
    else if (isGermlineMutation(mutation)) {
        if (isPathogenicMutation(mutation)) {
            return MutationStatusFilterValue.PATHOGENIC_GERMLINE;
        }
        else {
            return MutationStatusFilterValue.BENIGN_GERMLINE;
        }
    }

    return "Unknown";
}

function mutationPercentAccessor(mutation: IExtendedMutation)
{
    if (isSomaticMutation(mutation)) {
        return mutation.somaticFrequency;
    }
    else if (isGermlineMutation(mutation)) {
        return mutation.germlineFrequency;
    }
    else {
        return 0;
    }
}

function penetranceAccessor(mutation: IExtendedMutation)
{
    return [mutation.penetrance];
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
    private signalMutationMapper: SignalMutationMapper | undefined;

    @computed
    get entrezGeneId()
    {
        return this.props.ensemblGene ?
            parseInt(this.props.ensemblGene.entrezGeneId, 10): undefined;
    }

    @computed
    get showGermlinePercent()
    {
        return this.signalMutationMapper ? this.signalMutationMapper.showPercent : true;
    }

    @computed
    get showSomaticPercent()
    {
        return this.signalMutationMapper ? this.signalMutationMapper.showPercent : true;
    }

    public render()
    {
        return (
            <SignalMutationMapper
                apiCacheLimit={API_CACHE_LIMIT}
                onInit={this.onMutationMapperInit}
                hugoSymbol={this.props.hugoSymbol}
                entrezGeneId={this.entrezGeneId}
                isoformOverrideSource={ISOFORM_OVERRIDE_SOURCE}
                data={this.props.data}
                showFilterResetPanel={false}
                showPlotLegendToggle={false}
                showPlotDownloadControls={false}
                showTranscriptDropDown={true}
                showOnlyAnnotatedTranscriptsInDropdown={true}
                filterMutationsBySelectedTranscript={true}
                mainLoadingIndicator={this.loader}
                oncoKbUrl={ONCOKB_API_URL}
                tracks={[TrackName.CancerHotspots, TrackName.OncoKB, TrackName.PTM]}
                getMutationCount={this.getLollipopCountValue}
                mutationTableColumns={[
                    {
                        // override default Protein Change column to disable mutation status indicator
                        ...MUTATION_COLUMNS_DEFINITION[MutationColumn.PROTEIN_CHANGE],
                        Cell: (column: any) =>
                            <ProteinChange
                                mutation={column.original}
                                enableMutationStatusIndicator={false}
                            />
                    },
                    {
                        // override default Mutation Status column to include benign/pathogenic germline status
                        ...MUTATION_COLUMNS_DEFINITION[MutationColumn.MUTATION_STATUS],
                        accessor: mutationStatusAccessor,
                        width: 200,
                        Cell: (column: any) =>
                            <MutationStatus
                                value={column.value}
                                enableTooltip={false}
                                displayValueMap={{
                                    [MutationStatusFilterValue.SOMATIC.toLowerCase()]:
                                        MutationStatusFilterValue.SOMATIC,
                                    [MutationStatusFilterValue.PATHOGENIC_GERMLINE.toLowerCase()]:
                                        MutationStatusFilterValue.PATHOGENIC_GERMLINE,
                                    [MutationStatusFilterValue.BENIGN_GERMLINE.toLowerCase()]:
                                        MutationStatusFilterValue.BENIGN_GERMLINE,
                                }}
                                styleMap={{
                                    [MutationStatusFilterValue.PATHOGENIC_GERMLINE.toLowerCase()]: {
                                        background: "#FFA963"
                                    }
                                }}
                            />
                    },
                    {
                        id: ColumnId.PENETRANCE,
                        Cell: renderPenetrance,
                        accessor: penetranceAccessor,
                        Header: HEADER_COMPONENT[ColumnId.PENETRANCE],
                        sortMethod: sortPenetrance
                    },
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.MUTATION_TYPE],
                    {
                        id: ColumnId.MUTATION_PERCENT,
                        name: "%",
                        Cell: renderPercentage,
                        accessor: mutationPercentAccessor,
                        Header: HEADER_COMPONENT[ColumnId.MUTATION_PERCENT],
                        sortMethod: defaultSortMethod
                    },
                    {
                        expander: true,
                        Expander: this.renderExpander,
                        togglable: false,
                        width: 25
                    },
                    {
                        id: ColumnId.PERCENT_BIALLELIC,
                        name: "% Biallelic",
                        Cell: renderPercentage,
                        accessor: "ratioBiallelicPathogenic",
                        Header: HEADER_COMPONENT[ColumnId.PERCENT_BIALLELIC],
                        sortMethod: defaultSortMethod
                    },
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.ANNOTATION],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.GNOMAD],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.CLINVAR],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.CHROMOSOME],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.START_POSITION],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.END_POSITION],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.REFERENCE_ALLELE],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.VARIANT_ALLELE]
                ]}
                customMutationTableProps={{
                    SubComponent: this.renderSubComponent
                }}
                mutationTableInitialSortColumn={MutationColumn.PROTEIN_CHANGE}
                mutationTableInitialSortDirection={ColumnSortDirection.ASC}
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
                plotYAxisLabelPadding={50}
                plotLollipopTooltipCountInfo={this.lollipopTooltipCountInfo}
                dataFilters={[
                    {
                        id: MUTATION_STATUS_FILTER_ID,
                        type: MUTATION_STATUS_FILTER_TYPE,
                        values: getDefaultMutationStatusFilterValues()
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
    private lollipopTooltipCountInfo(count: number, mutations?: IExtendedMutation[]): JSX.Element
    {
        const decimalZeros = numberOfLeadingDecimalZeros(count);
        const fractionDigits = decimalZeros < 0 ? 1: decimalZeros + 2;

        return mutations && mutations.length > 0 && this.needToShowPercent(mutations[0]) ?
            <strong>{formatPercentValue(count, fractionDigits)}% mutation rate</strong>:
            <strong>{count} mutation{`${count !== 1 ? "s" : ""}`}</strong>;
    }

    @autobind
    private getMutationCount(mutation: IExtendedMutation)
    {
        const cancerTypeFilter = this.signalMutationMapper ? this.signalMutationMapper.cancerTypeFilter : undefined;
        const mutationStatusFilter = this.signalMutationMapper ? this.signalMutationMapper.mutationStatusFilter : undefined;

        // take the current cancer type and mutation status filter into account
        return mutation.tumorTypeDecomposition
            .map(t => getVariantCount(mutation, t, cancerTypeFilter, mutationStatusFilter))
            .reduce((sum, count) => sum + count);
    }

    @autobind
    private getMutationRate(mutation: IExtendedMutation)
    {
        const cancerTypeFilter = this.signalMutationMapper ? this.signalMutationMapper.cancerTypeFilter : undefined;
        const mutationStatusFilter = this.signalMutationMapper ? this.signalMutationMapper.mutationStatusFilter : undefined;

        return calculateMutationRate(mutation, cancerTypeFilter, mutationStatusFilter);
    }

    @autobind
    private getLollipopCountValue(mutation: IExtendedMutation)
    {
        return this.needToShowPercent(mutation) ? this.getMutationRate(mutation) : this.getMutationCount(mutation);
    }

    private needToShowPercent(mutation: IExtendedMutation)
    {
        return (
            mutation.mutationStatus.toLowerCase().includes(MutationStatusFilterValue.GERMLINE.toLowerCase()) &&
            this.showGermlinePercent
        ) || (
            mutation.mutationStatus.toLowerCase().includes(MutationStatusFilterValue.SOMATIC.toLowerCase()) &&
            this.showSomaticPercent
        );
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
                                    containsCancerType(
                                        this.signalMutationMapper ?
                                            this.signalMutationMapper.cancerTypeFilter : undefined,
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
    private onMutationMapperInit(mutationMapper: SignalMutationMapper)
    {
        this.signalMutationMapper = mutationMapper;
    }
}

export default MutationMapper;
