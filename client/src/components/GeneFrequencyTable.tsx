import autobind from "autobind-decorator";
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {Filter} from "react-table";

import {IGeneFrequencySummary} from "../../../server/src/model/GeneFrequencySummary";
import {biallelicAccessor, germlineAccessor, somaticAccessor} from "../util/ColumnHelper";
import {fetchTumorTypeFrequenciesByGene} from "../util/FrequencyDataUtils";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import {renderPercentage} from "./ColumnRenderHelper";
import Gene from "./Gene";
import GeneFrequencyTableComponent from "./GeneFrequencyTableComponent";
import GeneTumorTypeFrequencyDecomposition from "./GeneTumorTypeFrequencyDecomposition";

import "react-table/react-table.css";
import "./FrequencyTable.css";

interface IFrequencyTableProps
{
    data: IGeneFrequencySummary[];
}

function renderHugoSymbol(cellProps: any)
{
    return (
        <Gene
            hugoSymbol={cellProps.value}
            penetrance={cellProps.original.penetrance}
        />
    );
}

function renderSubComponent(row: any) {
    return (
        <div className="p-4">
            <GeneTumorTypeFrequencyDecomposition
                hugoSymbol={row.original.hugoSymbol}
                penetrance={row.original.penetrance}
                dataPromise={fetchTumorTypeFrequenciesByGene(row.original.hugoSymbol)}
            />
        </div>
    );
}

function filterGene(filter: Filter, row: any, column: any)
{
    return row[ColumnId.HUGO_SYMBOL].toLowerCase().includes(filter.value.toLowerCase());
}

@observer
class GeneFrequencyTable extends React.Component<IFrequencyTableProps>
{
    @observable
    private searchText: string | undefined;

    @computed
    private get filteredData() {
        return this.searchText ? this.props.data.filter(
            s => s.hugoSymbol.toLowerCase().includes(this.searchText!.trim().toLowerCase())):
            this.props.data;
    }

    @computed
    private get info() {
        return (
            <span>
                <strong>{this.filteredData.length}</strong> {
                    this.filteredData.length === 1 ? "Gene": "Genes"
                } {
                    this.filteredData.length !== this.props.data.length &&
                    <span>(out of <strong>{this.props.data.length}</strong>)</span>
                }
            </span>
        );
    }

    public render()
    {
        return (
            <div className="insight-frequency-table">
                <GeneFrequencyTableComponent
                    data={this.filteredData}
                    onSearch={this.handleSearch}
                    info={this.info}
                    reactTableProps={{
                        SubComponent: renderSubComponent
                    }}
                    columns={[
                        {
                            id: ColumnId.HUGO_SYMBOL,
                            filterMethod: filterGene,
                            Cell: renderHugoSymbol,
                            Header: "Gene",
                            accessor: ColumnId.HUGO_SYMBOL,
                            defaultSortDesc: false
                        },
                        {
                            id: ColumnId.SOMATIC_DRIVER,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.SOMATIC_DRIVER],
                            accessor: somaticAccessor
                        },
                        {
                            id: ColumnId.GERMLINE,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.GERMLINE],
                            accessor: germlineAccessor
                        },
                        {
                            id: ColumnId.PERCENT_BIALLELIC,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.PERCENT_BIALLELIC],
                            accessor: biallelicAccessor
                        },
                        {
                            expander: true,
                            Expander: this.renderExpander
                        }
                    ]}
                    initialItemsPerPage={10}
                    initialSortColumn="germline"
                    initialSortDirection="desc"
                    showColumnVisibility={false}
                    searchPlaceholder="Search Genes"
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
    private handleSearch(searchText: string) {
        this.searchText = searchText;
    }
}

export default GeneFrequencyTable;
