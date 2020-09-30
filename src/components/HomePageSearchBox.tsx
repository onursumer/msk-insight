// This component is from Genome Nexus Frontend originally
import autobind from 'autobind-decorator';
import _ from 'lodash';
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import './HomePageSearchBox.css';

interface ISearchBoxProps {
    onChange?: (input: string) => void;
    onSearch: () => void;
    placeholder?: string;
    searchIconClassName?: string;
    height?: number;
    exampleData: IExampleData[];
}

export interface IExampleData {
    value: string;
    label: string;
}

export const EXAMPLES: JSX.Element = (
    <div className={'card'}>
        <h5 className="card-header">Examples</h5>
        <div className={'card-body'}>
            <table className={'table table-borderless text-left'}>
                <tr>
                    <td>(ERBB2 L755S)</td>
                    <td>
                        <Link to={'/variant/17:g.37880220T>C'}>
                            17:g.37880220T{'>'}C
                        </Link>
                        &nbsp;
                    </td>
                    <td>
                        <Button variant={'secondary'} size={'sm'}>
                            Try it
                        </Button>
                    </td>
                </tr>
                <tr>
                    <td>(EGFR T790M)</td>
                    <td>
                        <Link to={'/variant/7:g.55249071C>T'}>
                            7:g.55249071C{'>'}T
                        </Link>
                    </td>
                    <td>
                        <Button variant={'secondary'} size={'sm'}>
                            Try it
                        </Button>
                    </td>
                </tr>
                <tr>
                    <td>(EGFR L747_T751delinsP)</td>
                    <td>
                        <Link to={'/variant/7:g.55242468_55242481delinsAC'}>
                            7:g.55242468_55242481delinsAC
                        </Link>
                    </td>
                    <td>
                        <Button variant={'secondary'} size={'sm'}>
                            Try it
                        </Button>
                    </td>
                </tr>
                <tr>
                    <td>(EGFR H773dup)</td>
                    <td>
                        <Link to={'/variant/7:g.55249017_55249018insCCA'}>
                            7:g.55249017_55249018insCCA
                        </Link>
                    </td>
                    <td>
                        <Button variant={'secondary'} size={'sm'}>
                            Try it
                        </Button>
                    </td>
                </tr>
            </table>
        </div>
    </div>
);

@observer
class SearchBox extends React.Component<ISearchBoxProps> {
    public static defaultProps = {
        searchIconClassName: 'fa fa-search',
        placeholder: "GRCh37"
    };

    @observable
    public currentValue: string | null = null;

    @computed get exampleOptions() {
        const options = this.props.exampleData;

        const withCustomHolder = _.concat(options, [
            {
                value: '',
                label: 'custom',
            },
        ]);

        return [
            {
                label: 'Example queries:',
                options: withCustomHolder,
            },
        ];
    }

    @computed get options() {
        const examples = this.exampleOptions;
        if (this.currentValue && this.currentValue.length) {
            examples[0].options.find(
                o => o.label === 'custom'
            )!.value = this.currentValue;
        }
        return examples;
    }

    public selectRef: any;

    public render() {
        return (
            <div>
                <Select
                    value={this.currentValue}
                    defaultValue={null}
                    defaultMenuIsOpen={false}
                    autoFocus={true}
                    filterOption={this.filterOption}
                    placeholder={`Query a ${this.props.placeholder} Variant / Gene / Region`}
                    ref={(ref: any) => {
                        this.selectRef = ref;
                    }}
                    onKeyDown={this.onKeyDown}
                    onInputChange={this.onInputChange}
                    onChange={this.onOptionChange}
                    options={this.options}
                />
            </div>
        );
    }

    @autobind
    private onChange(value: string) {
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }

    @autobind
    private onKeyDown(e: any) {
        if (e.keyCode === 13 && this.currentValue) {
            this.onChange(this.currentValue);
            this.props.onSearch();
        }
    }

    @autobind
    private filterOption(option: IExampleData) {
        return option.label !== 'custom'
    }

    @autobind
    private onInputChange(value: string) {
        this.selectRef.select.getNextFocusedOption = () => null;
        this.currentValue = value;
    }

    @autobind
    private onOptionChange(option: any) {
        this.onChange(option.value);
        this.props.onSearch();
    }
}

export default SearchBox;
