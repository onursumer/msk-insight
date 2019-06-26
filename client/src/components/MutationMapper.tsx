import autobind from "autobind-decorator";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {
    MutationMapper as ReactMutationMapper,
    TrackName
} from "react-mutation-mapper";

import {ICountByTumorType, IMutation} from "../../../server/src/model/Mutation";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {FrequencySummaryCategory} from "../util/ColumnHelper";
import {loaderWithText} from "../util/StatusHelper";
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

function renderSubComponent(row: any) {
    return (
        <div className="p-4">
            <MutationTumorTypeFrequencyDecomposition
                hugoSymbol={row.original.hugoSymbol}
                dataPromise={Promise.resolve(row.original.countsByTumorType.filter((c: ICountByTumorType) => c.variantCount > 0))}
            />
        </div>
    );
}

@observer
class MutationMapper extends React.Component<IMutationMapperProps>
{
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
            <ReactMutationMapper
                hugoSymbol={this.props.hugoSymbol}
                data={this.props.data}
                showTranscriptDropDown={true}
                genomeNexusUrl="https://www.genomenexus.org/beta"
                showOnlyAnnotatedTranscriptsInDropdown={true}
                filterMutationsBySelectedTranscript={true}
                mutationRates={this.mutationRates}
                mainLoadingIndicator={this.loader}
                tracks={[TrackName.CancerHotspots, TrackName.OncoKB, TrackName.PTM]}
                customMutationTableColumns={[
                    {
                        expander: true,
                        Expander: this.renderExpander
                    }
                ]}
                customMutationTableProps={{
                    SubComponent: renderSubComponent
                }}
            />
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
