import autobind from "autobind-decorator";
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {ColumnSortDirection, defaultSortMethod} from "react-mutation-mapper";

import {IGeneFrequencySummary, ITumorTypeFrequencySummary} from "../model/GeneFrequencySummary";
import {biallelicAccessor, germlineAccessor, somaticAccessor} from "../util/ColumnHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPenetrance, renderPercentage} from "./ColumnRenderHelper";
import Gene from "./Gene";
import GeneFrequencyTableComponent from "./GeneFrequencyTableComponent";
import GeneTumorTypeFrequencyDecomposition from "./GeneTumorTypeFrequencyDecomposition";
import { comparePenetrance } from './Penetrance';


interface IFrequencyTableProps
{
    geneFrequencySummaryData: IGeneFrequencySummary[];
    tumorTypeFrequencySummaryMap: {[hugoSymbol: string]: ITumorTypeFrequencySummary[]};
}

function renderHugoSymbol(cellProps: any)
{
    return (
        <Gene
            hugoSymbol={cellProps.value}
        />
    );
}

export function sortPenetrance(a: string[], b: string[])
{
    const aSorted = a.sort(comparePenetrance);
    const bSorted = b.sort(comparePenetrance);
    for (let i = 0; i < Math.min(aSorted.length, bSorted.length); i++) {
        const comparison = -comparePenetrance(aSorted[i], bSorted[i]);
        if (comparison !== 0) {
            return comparison;
        }
    }
    return Math.sign(a.length - b.length);
}

@observer
class GeneFrequencyTable extends React.Component<IFrequencyTableProps>
{
    private tableComponentRef: GeneFrequencyTableComponent;

    @observable
    private searchText: string | undefined;

    @computed
    private get filteredData() {
        const refinedSearchText = this.searchText ?
            this.searchText!.trim().toLowerCase(): undefined;

        return refinedSearchText ? this.props.geneFrequencySummaryData.filter(
            s => s.hugoSymbol.toLowerCase().includes(refinedSearchText)
        ): this.props.geneFrequencySummaryData;
    }

    @computed
    private get info() {
        return (
            <span>
                <strong>{this.filteredData.length}</strong> {
                    this.filteredData.length === 1 ? "Gene": "Genes"
                } {
                    this.filteredData.length !== this.props.geneFrequencySummaryData.length &&
                    <span>(out of <strong>{this.props.geneFrequencySummaryData.length}</strong>)</span>
                }
            </span>
        );
    }

    public render()
    {
        return (
            <div className="signal-frequency-table">
                <GeneFrequencyTableComponent
                    ref={this.handleTableRef}
                    data={this.filteredData}
                    onSearch={this.handleSearch}
                    info={this.info}
                    reactTableProps={{
                        SubComponent: this.renderSubComponent
                    }}
                    columns={[
                        {
                            id: ColumnId.HUGO_SYMBOL,
                            Cell: renderHugoSymbol,
                            Header: HEADER_COMPONENT[ColumnId.HUGO_SYMBOL],
                            accessor: ColumnId.HUGO_SYMBOL
                        },
                        {
                            id: ColumnId.PENETRANCE,
                            Cell: renderPenetrance,
                            Header: HEADER_COMPONENT[ColumnId.PENETRANCE],
                            accessor: ColumnId.PENETRANCE,
                            sortMethod: sortPenetrance
                        },
                        {
                            id: ColumnId.GERMLINE,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.GERMLINE],
                            accessor: germlineAccessor,
                            sortMethod: defaultSortMethod
                        },
                        {
                            id: ColumnId.PERCENT_BIALLELIC,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.PERCENT_BIALLELIC],
                            accessor: biallelicAccessor,
                            sortMethod: defaultSortMethod
                        },
                        {
                            id: ColumnId.SOMATIC_DRIVER,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.SOMATIC_DRIVER],
                            accessor: somaticAccessor,
                            sortMethod: defaultSortMethod
                        },
                        {
                            expander: true,
                            Expander: this.renderExpander
                        }
                    ]}
                    initialItemsPerPage={10}
                    initialSortColumn={ColumnId.GERMLINE}
                    initialSortDirection={ColumnSortDirection.DESC}
                    showColumnVisibility={false}
                    searchPlaceholder="Search Gene"
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
    private renderSubComponent(row: any)
    {
        return (
            <div className="p-4">
                <GeneTumorTypeFrequencyDecomposition
                    hugoSymbol={row.original.hugoSymbol}
                    penetrance={row.original.penetrance}
                    dataPromise={Promise.resolve(this.props.tumorTypeFrequencySummaryMap[row.original.hugoSymbol])}
                />
            </div>
        );
    }

    @action.bound
    private handleSearch(searchText: string) {
        this.searchText = searchText;
        this.tableComponentRef.collapseSubComponent();
    }

    @autobind
    private handleTableRef(ref: GeneFrequencyTableComponent) {
        this.tableComponentRef = ref;
    }
}

export default GeneFrequencyTable;
