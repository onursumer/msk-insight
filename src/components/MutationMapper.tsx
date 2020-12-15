import autobind from "autobind-decorator";
import {
    formatPercentValue,
    isGermlineMutation,
    isPathogenicMutation,
    isSomaticMutation,
    numberOfLeadingDecimalZeros,
    SignalMutationStatus
} from 'cbioportal-utils';
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {
    CancerTypeFilter,
    ColumnSortDirection,
    DataFilter,
    DataFilterType,
    defaultSortMethod,
    MUTATION_COLUMNS_DEFINITION,
    MutationColumn,
    MutationStatus,
    ProteinChange,
    TrackName
} from "react-mutation-mapper";

import {IExtendedSignalMutation, ISignalTumorTypeDecomposition} from "cbioportal-utils";
import {IEnsemblGene} from "../model/EnsemblGene";
import {
    applyCancerTypeFilter,
    applyMutationStatusFilter,
    CANCER_TYPE_FILTER_ID,
    CANCER_TYPE_IGNORE_MUTATION_STATUS_FILTER_TYPE,
    containsCancerType,
    getDefaultMutationStatusFilterValues,
    MUTATION_COUNT_FILTER_TYPE,
    MUTATION_STATUS_FILTER_ID,
    MUTATION_STATUS_FILTER_TYPE,
    MutationCountFilter,
    MutationStatusFilter,
} from "../util/FilterUtils";
import {
    calculateMutationRate,
    getVariantCount,
} from "../util/MutationDataUtils";
import {loaderWithText} from "../util/StatusHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderHgvsg, renderPenetrance, renderPercentage} from "./ColumnRenderHelper";
import {sortPenetrance} from "./GeneFrequencyTable";
import MutationTumorTypeFrequencyDecomposition from "./MutationTumorTypeFrequencyDecomposition";
import SignalMutationMapper from "./SignalMutationMapper";

// TODO make these externally configurable?
const API_CACHE_LIMIT = 450;
const ISOFORM_OVERRIDE_SOURCE = "mskcc";
const ONCOKB_API_URL = "https://www.cbioportal.org/proxy/oncokb";

interface IMutationMapperProps
{
    data: IExtendedSignalMutation[];
    hugoSymbol: string;
    cancerTypes?: string[];
    ensemblGene?: IEnsemblGene;
}

function mutationStatusAccessor(mutation: IExtendedSignalMutation)
{
    if (isSomaticMutation(mutation)) {
        return SignalMutationStatus.SOMATIC;
    }
    else if (isGermlineMutation(mutation)) {
        if (isPathogenicMutation(mutation)) {
            return SignalMutationStatus.PATHOGENIC_GERMLINE;
        }
        else {
            return SignalMutationStatus.BENIGN_GERMLINE;
        }
    }

    return "Unknown";
}

function mutationPercentAccessor(mutation: IExtendedSignalMutation)
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

function penetranceAccessor(mutation: IExtendedSignalMutation)
{
    return [mutation.penetrance];
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps> {
    private signalMutationMapper: SignalMutationMapper | undefined;

    @computed
    get entrezGeneId() {
        return this.props.ensemblGene ?
            parseInt(this.props.ensemblGene.entrezGeneId, 10) : undefined;
    }

    @computed
    get showGermlinePercent() {
        return this.signalMutationMapper ? this.signalMutationMapper.showPercent : true;
    }

    @computed
    get showSomaticPercent() {
        return this.signalMutationMapper ? this.signalMutationMapper.showPercent : true;
    }

    @computed
    get dataFilters()
    {
        const filters: DataFilter[] = [{
            id: MUTATION_STATUS_FILTER_ID,
            type: MUTATION_STATUS_FILTER_TYPE,
            values: getDefaultMutationStatusFilterValues()
        }];

        if (this.props.cancerTypes) {
            filters.push({
                id: CANCER_TYPE_FILTER_ID,
                type: DataFilterType.CANCER_TYPE,
                values: this.props.cancerTypes
            });
        }

        return filters;
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
                                    [SignalMutationStatus.SOMATIC.toLowerCase()]:
                                        SignalMutationStatus.SOMATIC,
                                    [SignalMutationStatus.PATHOGENIC_GERMLINE.toLowerCase()]:
                                        SignalMutationStatus.PATHOGENIC_GERMLINE,
                                    [SignalMutationStatus.BENIGN_GERMLINE.toLowerCase()]:
                                        SignalMutationStatus.BENIGN_GERMLINE,
                                }}
                                styleMap={{
                                    [SignalMutationStatus.PATHOGENIC_GERMLINE.toLowerCase()]: {
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
                        name: "% Prevalence",
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
                    {
                        // override default HGVSg column to customize the link
                        ...MUTATION_COLUMNS_DEFINITION[MutationColumn.HGVSG],
                        Cell: renderHgvsg,
                        width: 200
                    },
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.HGVSC],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.GNOMAD],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.CLINVAR],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.DBSNP],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.CHROMOSOME],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.START_POSITION],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.END_POSITION],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.REFERENCE_ALLELE],
                    MUTATION_COLUMNS_DEFINITION[MutationColumn.VARIANT_ALLELE]
                ]}
                customMutationTableProps={{
                    SubComponent: this.renderSubComponent
                }}
                // default mutation table waits for annotation column data by default to initiate sort
                // we don't sort by annotation column, so setting this to an empty array to bypass the initial wait
                mutationTableInitialSortRemoteData={[]}
                mutationTableInitialSort={[
                    {column: MutationColumn.MUTATION_STATUS, sortDirection: ColumnSortDirection.ASC},
                    {column: MutationColumn.PROTEIN_CHANGE, sortDirection: ColumnSortDirection.ASC},
                ]}
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
                dataFilters={this.dataFilters}
                filterAppliersOverride={this.customFilterAppliers}
            />
        );
    }

    private get customFilterAppliers()
    {
        return {
            [DataFilterType.CANCER_TYPE]: this.applyCancerTypeFilter,
            [CANCER_TYPE_IGNORE_MUTATION_STATUS_FILTER_TYPE]: this.applyCancerTypeFilterIgnoreMutationStatus,
            [MUTATION_STATUS_FILTER_TYPE]: this.applyMutationStatusFilter,
            [MUTATION_COUNT_FILTER_TYPE]: this.applyMutationCountFilter
        };
    };

    @autobind
    private lollipopTooltipCountInfo(count: number, mutations?: IExtendedSignalMutation[]): JSX.Element
    {
        const decimalZeros = numberOfLeadingDecimalZeros(count);
        const fractionDigits = decimalZeros < 0 ? 1: decimalZeros + 2;

        return mutations && mutations.length > 0 && this.needToShowPercent(mutations[0]) ?
            <strong>{formatPercentValue(count, fractionDigits)}% mutation rate</strong>:
            <strong>{count} mutation{`${count !== 1 ? "s" : ""}`}</strong>;
    }

    @autobind
    private getDefaultMutationCount(mutation: IExtendedSignalMutation)
    {
        // take the current cancer type and mutation status filter into account
        const cancerTypeFilter = this.signalMutationMapper ? this.signalMutationMapper.cancerTypeFilter : undefined;
        const mutationStatusFilter = this.signalMutationMapper ? this.signalMutationMapper.mutationStatusFilter : undefined;

        return this.getMutationCount(mutation, cancerTypeFilter, mutationStatusFilter);
    }

    @autobind
    private getMutationCount(
        mutation: IExtendedSignalMutation,
        cancerTypeFilter?: DataFilter,
        mutationStatusFilter?: DataFilter)
    {
        return mutation.tumorTypeDecomposition
            .map(t => getVariantCount(mutation, t, cancerTypeFilter, mutationStatusFilter))
            .reduce((sum, count) => sum + count);
    }

    @autobind
    private getMutationRate(mutation: IExtendedSignalMutation)
    {
        const cancerTypeFilter = this.signalMutationMapper ? this.signalMutationMapper.cancerTypeFilter : undefined;
        const mutationStatusFilter = this.signalMutationMapper ? this.signalMutationMapper.mutationStatusFilter : undefined;

        return calculateMutationRate(mutation, cancerTypeFilter, mutationStatusFilter);
    }

    @autobind
    private getLollipopCountValue(mutation: IExtendedSignalMutation)
    {
        return this.needToShowPercent(mutation) ? this.getMutationRate(mutation) : this.getDefaultMutationCount(mutation);
    }

    private needToShowPercent(mutation: IExtendedSignalMutation)
    {
        return (
            mutation.mutationStatus.toLowerCase().includes(SignalMutationStatus.GERMLINE.toLowerCase()) &&
            this.showGermlinePercent
        ) || (
            mutation.mutationStatus.toLowerCase().includes(SignalMutationStatus.SOMATIC.toLowerCase()) &&
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
    private applyCancerTypeFilter(filter: CancerTypeFilter, mutation: IExtendedSignalMutation) {
        return applyCancerTypeFilter(filter, mutation) && this.applyMutationCountFilter(this.mutationCountFilter, mutation);
    }

    @autobind
    private applyCancerTypeFilterIgnoreMutationStatus(filter: CancerTypeFilter, mutation: IExtendedSignalMutation) {
        return applyCancerTypeFilter(filter, mutation) && this.applyMutationCountFilterIgnoreMutationStatus(this.mutationCountFilter, mutation);
    }

    @autobind
    private applyMutationStatusFilter(filter: MutationStatusFilter, mutation: IExtendedSignalMutation) {
        return applyMutationStatusFilter(filter, mutation) && this.applyMutationCountFilter(this.mutationCountFilter, mutation);
    }

    @autobind
    private applyMutationCountFilter(filter: MutationCountFilter, mutation: IExtendedSignalMutation) {
        return filter.values.map(v => this.getDefaultMutationCount(mutation) > v).includes(true);
    }

    @autobind
    private applyMutationCountFilterIgnoreMutationStatus(filter: MutationCountFilter, mutation: IExtendedSignalMutation) {
        return filter.values.map(
            v => this.getMutationCount(mutation, this.signalMutationMapper?.cancerTypeFilter) > v
        ).includes(true);
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
                                (c: ISignalTumorTypeDecomposition) =>
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
