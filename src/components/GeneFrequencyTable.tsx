import autobind from "autobind-decorator";
import {DefaultTooltip} from "cbioportal-frontend-commons";
import {action, computed} from "mobx";
import {observer} from "mobx-react";
import pluralize from 'pluralize';
import * as React from "react";
import {ColumnSortDirection, defaultSortMethod} from "react-mutation-mapper";

import {IGeneFrequencySummary} from "../model/GeneFrequencySummary";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {biallelicAccessor, germlineAccessor, somaticAccessor} from "../util/ColumnHelper";
import {containsCancerType, findCancerTypeFilter} from "../util/FilterUtils";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPenetrance, renderPercentage} from "./ColumnRenderHelper";
import Gene from "./Gene";
import GeneFrequencyTableComponent from "./GeneFrequencyTableComponent";
import GeneTumorTypeFrequencyDecomposition from "./GeneTumorTypeFrequencyDecomposition";
import { comparePenetrance } from './Penetrance';

import "react-table/react-table.css";
import "./FrequencyTable.css";

interface IFrequencyTableProps
{
    store: GeneFrequencyStore;
    onSearch?: (text: string) => void;
    onGeneFrequencyTableRef?: (ref: GeneFrequencyTableComponent) => void;
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

    @computed
    private get filteredData() {
        return this.props.store.filteredGeneFrequencySummaryData;
    }

    @computed
    private get info() {
        return (
            <span>
                <strong>{this.filteredData.length}</strong> {
                    pluralize("Gene", this.filteredData.length)
                } {
                    this.filteredData.length !== this.props.store.geneFrequencySummaryData.length &&
                    <span>(out of <strong>{this.props.store.geneFrequencySummaryData.length}</strong>)</span>
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
    private renderExpander(props: {
        isExpanded: boolean;
        original: IGeneFrequencySummary;
    }) {
        let component: JSX.Element;

        if (this.props.store.tumorTypeFrequencyDataGroupedByGene[props.original.hugoSymbol]) {
            component = props.isExpanded ?
                <i className="fa fa-minus-circle" /> :
                <i className="fa fa-plus-circle" />;
        }
        else {
            // in case there is no expandable data for this gene display an info icon with a tooltip
            component = (
                <DefaultTooltip
                    placement="right"
                    overlay={
                        <span>No tumor type information for {props.original.hugoSymbol}</span>
                    }
                >
                    <i className="fa fa-info-circle" />
                </DefaultTooltip>
            );
        }

        return component;
    }

    @autobind
    private renderSubComponent(row: { original: IGeneFrequencySummary })
    {
        const data = this.props.store.tumorTypeFrequencyDataGroupedByGene[row.original.hugoSymbol];

        // do not render the table if there is no tumor type frequency summary data for this gene
        return data ? (
            <div className="p-4">
                <GeneTumorTypeFrequencyDecomposition
                    hugoSymbol={row.original.hugoSymbol}
                    penetrance={row.original.penetrance}
                    dataPromise={
                        Promise.resolve(
                            data.filter(d =>
                                containsCancerType(
                                    findCancerTypeFilter(this.props.store.tumorTypeFrequencySummaryDataFilters),
                                    d.tumorType
                                )
                            )
                        )
                    }
                />
            </div>
        ): null;
    }

    @action.bound
    private handleSearch(searchText: string) {
        if (this.props.onSearch) {
            this.props.onSearch(searchText.trim().toLowerCase());
        }

        this.tableComponentRef.collapseSubComponent();
    }

    @autobind
    private handleTableRef(ref: GeneFrequencyTableComponent) {
        this.tableComponentRef = ref;

        if (this.props.onGeneFrequencyTableRef) {
            this.props.onGeneFrequencyTableRef(ref);
        }
    }
}

export default GeneFrequencyTable;
