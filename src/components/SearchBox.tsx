import _ from 'lodash';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import { components } from 'react-select';
import AsyncSelect from 'react-select/async';

import {ISignalSearch} from "../model/SignalSearch";
import {SearchOption, SearchOptionType} from "./SearchOption";

interface ISearchBoxProps {
    styles?: CSSRule;
    history?: any;
    placeholder?: string;
}

@observer
export default class SearchBox extends React.Component<ISearchBoxProps, {}>
{
    public static defaultProps: Partial<ISearchBoxProps> = {
        placeholder: "Search Gene / Variant / Region"
    };

    @observable
    public keyword: string;
    @observable
    public selectedOption: ISignalSearch | null;

    // https://github.com/JedWatson/react-select/issues/614#issuecomment-244006496
    private debouncedFetch = _.debounce((searchTerm, callback) => {
        this.getOptions(searchTerm)
            .then(result => {
                return callback(result);
            })
            .catch((error: any) => callback(error, null));
    }, 500);

    @action.bound
    public async getOptions(keyword: string) {
        this.keyword = keyword;

        // TODO mock data, replace with the actual endpoint
        return Promise.resolve([
            {
                queryType: SearchOptionType.ALTERATION,
                link: "/gene/BRCA2", // TODO generate this on the frontend?
                gene: {
                    hugoSymbol: "BRCA2",
                    entrezGeneId: 675
                },
                alteration: "N3124I",
                region: "13:32968940-32968940",
                variant: "13:g.32968940A>T",
                annotation: "TODO: additional/optional information here"
            },
            {
                queryType: SearchOptionType.VARIANT,
                link: "/variant/13:g.32968940A>T", // TODO generate this on the frontend?
                gene: {
                    hugoSymbol: "BRCA2",
                    entrezGeneId: 675
                },
                alteration: "N3124I",
                region: "13:32968940-32968940",
                variant: "13:g.32968940A>T",
                annotation: "TODO: additional/optional information here"
            },
        ]);
    }

    public render()
    {
        const Option: React.FunctionComponent<any> = (props: any) => {
            return (
                <>
                    <components.Option {...props}>
                        <SearchOption
                            search={this.keyword}
                            type={props.data.queryType as SearchOptionType}
                            data={props.data}
                        >
                            <components.Option {...props} />
                        </SearchOption>
                    </components.Option>
                </>
            );
        };

        const NoOptionsMessage: React.FunctionComponent<any> = (props: any) => {
            if (this.keyword) {
                return (
                    <components.Option {...props}>
                        <span className="mr-2">
                            No result found for {this.keyword}.
                        </span>
                    </components.Option>
                );
            } else {
                return null;
            }
        };

        return (
            <AsyncSelect
                placeholder={this.props.placeholder}
                components={{
                    Option,
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    NoOptionsMessage,
                }}
                styles={{
                    input(styles) {
                        return {
                            ...styles,
                            lineHeight: '30px',
                        };
                    },
                    placeholder(styles) {
                        return {
                            ...styles,
                            width: '100%',
                            lineHeight: '30px',
                            textAlign: 'center',
                        };
                    },
                }}
                isFocused={true}
                defaultOptions={[] as ISignalSearch[]}
                menuIsOpen={!!this.keyword}
                isClearable={true}
                value={this.selectedOption}
                onChange={this.handleChange}
                closeMenuOnSelect={false}
                loadOptions={this.debouncedFetch}
                inputValue={this.keyword}
                onInputChange={this.handleInputChange}
            />
        );
    }

    @action.bound
    private handleInputChange(keyword: string) {
        this.keyword = keyword;
    }

    @action.bound
    private handleChange(value: ISignalSearch) {
        if (value) {
            this.keyword = '';
            this.selectedOption = null;
            // We need to update the history in the onchange event
            // so when user hits the enter key after search, it would work
            this.props.history?.push(value.link);
        }
    }
}
