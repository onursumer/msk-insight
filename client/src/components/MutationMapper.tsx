import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {
    CancerTypeFilter,
    DataFilterType,
    TrackName
} from "react-mutation-mapper";

import {
    IExtendedMutation,
    IMutation,
    ITumorTypeDecomposition
} from "../../../server/src/model/Mutation";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {FrequencySummaryCategory} from "../util/ColumnHelper";
import {
    applyCancerTypeFilter,
    applyMutationStatusFilter,
    containsCancerType,
    matchesMutationStatus,
    MUTATION_COUNT_FILTER_TYPE,
    MUTATION_STATUS_FILTER_TYPE,
    MutationCountFilter,
    MutationStatusFilter
} from "../util/FilterUtils";
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
    private insightMutationMapper: InsightMutationMapper | undefined;

    public render()
    {
        return (
            <InsightMutationMapper
                onInit={this.onMutationMapperInit}
                hugoSymbol={this.props.hugoSymbol}
                data={this.props.data}
                showTranscriptDropDown={true}
                genomeNexusUrl="https://www.genomenexus.org/beta"
                showOnlyAnnotatedTranscriptsInDropdown={true}
                filterMutationsBySelectedTranscript={true}
                mutationRates={this.mutationRates}
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
                            filter: {type: "mutation", values: [{mutationStatus: "somatic"}]}
                        },
                        {
                            group: "Germline",
                            filter: {type: "mutation", values: [{mutationStatus: "germline"}]}
                        },
                    ]
                }
                filterAppliersOverride={this.customFilterAppliers}
            />
        );
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
