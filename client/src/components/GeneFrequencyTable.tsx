import autobind from "autobind-decorator";
import _ from "lodash";
import {action, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import ReactTable, {Filter} from "react-table";

import {IGeneFrequencySummary} from "../../../server/src/model/GeneFrequencySummary";
import {DataStatus} from "../store/DataStatus";
import {biallelicAccessor, germlineAccessor, somaticAccessor} from "../util/ColumnHelper";
import {fetchTumorTypeFrequenciesByGene} from "../util/FrequencyDataUtils";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import FrequencyCell from "./FrequencyCell";
import Gene from "./Gene";
import TumorTypeFrequencyDecomposition from "./TumorTypeFrequencyDecomposition";

import "react-table/react-table.css";
import "./FrequencyTable.css";

interface IFrequencyTableProps
{
    data: IGeneFrequencySummary[];
    status: DataStatus;
    filtered?: Filter[];
}


function renderPercentage(cellProps: any)
{
    return (
        <FrequencyCell frequency={cellProps.value || 0} />
    );
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
            <TumorTypeFrequencyDecomposition
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
    private expanded: {[index: number] : boolean} = {};

    public render()
    {
        return (
            <div className="insight-frequency-table">
                <ReactTable
                    data={this.props.data}
                    loading={this.props.status === 'pending'}
                    loadingText={<i className="fa fa-spinner fa-pulse fa-2x" />}
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
                            Header: HEADER_COMPONENT[ColumnId.MUTATION_FREQUENCIES],
                            columns: [
                                {
                                    id: ColumnId.SOMATIC,
                                    Cell: renderPercentage,
                                    Header: HEADER_COMPONENT[ColumnId.SOMATIC],
                                    accessor: somaticAccessor
                                },
                                {
                                    id: ColumnId.GERMLINE,
                                    Cell: renderPercentage,
                                    Header: HEADER_COMPONENT[ColumnId.GERMLINE],
                                    accessor: germlineAccessor
                                }
                            ]
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
                    onExpandedChange={this.onExpandedChange}
                    onPageChange={this.resetExpander}
                    onSortedChange={this.resetExpander}
                    filtered={this.props.filtered}
                    expanded={this.expanded}
                    SubComponent={renderSubComponent}
                    defaultPageSize={10}
                    defaultSorted={[{
                        id: "germline",
                        desc: true
                    }]}
                    defaultSortDesc={true}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }

    public componentWillReceiveProps(nextProps: Readonly<IFrequencyTableProps>)
    {
        // reset expander if the filters change
        if (!_.isEqual(nextProps.filtered, this.props.filtered)) {
            this.resetExpander();
        }
    }

    @autobind
    private renderExpander(props: {isExpanded: boolean}) {
        return props.isExpanded ?
            <i className="fa fa-minus-circle" /> :
            <i className="fa fa-plus-circle" />;
    }

    @action.bound
    private onExpandedChange(expanded: {[index: number] : boolean}) {
        this.expanded = expanded;
    }

    @action.bound
    private resetExpander() {
        this.expanded = {};
    }
}

export default GeneFrequencyTable;
