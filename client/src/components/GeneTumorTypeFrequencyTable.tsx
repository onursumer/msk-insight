import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import ReactTable from "react-table";

import {ITumorTypeFrequencySummary} from "../../../server/src/model/GeneFrequencySummary";
import {biallelicAccessor, germlineAccessor, somaticAccessor} from "../util/ColumnHelper";
import {ColumnId, HEADER_COMPONENT} from "./ColumnHeaderHelper";
import FrequencyCell from "./FrequencyCell";
import Gene from "./Gene";

import "react-table/react-table.css";
import "./FrequencyTable.css";

interface ITumorTypeFrequencyTableProps
{
    data: ITumorTypeFrequencySummary[];
    penetrance: string[];
    hugoSymbol: string;
}

function renderPercentage(cellProps: any)
{
    return (
        <FrequencyCell
            frequency={cellProps.value}
        />
    );
}

function renderCount(cellProps: any)
{
    return <span className="pull-right mr-1">{cellProps.value}</span>;
}

function renderTumorType(cellProps: any)
{
    return <span className="pull-left ml-2">{cellProps.value}</span>;
}

@observer
class GeneTumorTypeFrequencyTable extends React.Component<ITumorTypeFrequencyTableProps>
{
    @computed
    private get defaultPageSize() {
        if (this.props.data.length > 10) {
            return 10;
        }
        else if (this.props.data.length === 0) {
            return 1;
        }
        else {
            return this.props.data.length;
        }
    }

    public render()
    {
        return (
            <div className="insight-frequency-table">
                <ReactTable
                    data={this.props.data}
                    columns={[
                        {
                            Header: (
                                <Gene
                                    hugoSymbol={this.props.hugoSymbol}
                                    hugoSymbolClassName="pull-left ml-4"
                                    penetrance={this.props.penetrance}
                                    penetranceClassName="pull-left ml-4"
                                />
                            ),
                            columns: [
                                {
                                    id: "tumorType",
                                    Cell: renderTumorType,
                                    Header: <span className="text-wrap">Tumor type</span>,
                                    accessor: "tumorType",
                                    minWidth: 250
                                },
                                {
                                    id: "sampleCount",
                                    Cell: renderCount,
                                    Header: <span className="text-wrap"># Samples</span>,
                                    accessor: "sampleCount",
                                    maxWidth: 80
                                }
                            ]
                        },
                        {
                            Header: HEADER_COMPONENT[ColumnId.MUTATION_FREQUENCIES],
                            columns: [
                                {
                                    id: ColumnId.SOMATIC,
                                    Cell: renderPercentage,
                                    Header: HEADER_COMPONENT[ColumnId.SOMATIC],
                                    accessor: somaticAccessor,
                                    maxWidth: 120
                                },
                                {
                                    id: ColumnId.GERMLINE,
                                    Cell: renderPercentage,
                                    Header: HEADER_COMPONENT[ColumnId.GERMLINE],
                                    accessor: germlineAccessor,
                                    maxWidth: 120
                                }
                            ]
                        },
                        {
                            id: ColumnId.PERCENT_BIALLELIC,
                            Cell: renderPercentage,
                            Header: HEADER_COMPONENT[ColumnId.PERCENT_BIALLELIC],
                            accessor: biallelicAccessor,
                            maxWidth: 120
                        }
                    ]}
                    defaultSorted={[{
                        id: ColumnId.GERMLINE,
                        desc: true
                    }]}
                    defaultSortDesc={true}
                    defaultPageSize={this.defaultPageSize}
                    className="-striped -highlight"
                    minRows={0}
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}

export default GeneTumorTypeFrequencyTable;
