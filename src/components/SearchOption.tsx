import React from 'react';
import Highlighter from 'react-highlight-words';

import {ISignalSearch} from "../model/SignalSearch";

import './SearchOption.css';

export enum SearchOptionType {
    GENE = 'GENE',
    ALTERATION = 'ALTERATION',
    VARIANT = 'VARIANT',
    REGION = 'REGION',
}

interface ISearchOptionProps {
    search: string | undefined;
    type: SearchOptionType;
    data: ISignalSearch;
}

const GeneSearchOption: React.FunctionComponent<{
    search: string;
    data: ISignalSearch;
}> = props => {
    return (
        <>
            <div>
                <Highlighter
                    searchWords={[props.search]}
                    textToHighlight={`${props.data.gene.hugoSymbol} (Entrez Gene: ${props.data.gene.entrezGeneId})`}
                />
            </div>
        </>
    );
};

const AlterationSearchOption: React.FunctionComponent<{
    search: string;
    data: ISignalSearch;
}> = props => {
    return (
        <>
            <div className={'d-flex align-items-center'}>
                <Highlighter
                    textToHighlight={props.data.gene.hugoSymbol}
                    searchWords={[props.search]}
                />{' '}
                /
                <Highlighter
                    textToHighlight={props.data.alteration}
                    searchWords={[props.search]}
                />
            </div>
            {props.data.annotation ? (
                <div className="search-option-subTitle">
                    <span>{props.data.annotation}</span>
                </div>
            ) : null}
        </>
    );
};

const RegionSearchOption: React.FunctionComponent<{
    search: string;
    data: ISignalSearch;
}> = props => {
    return (
        <>
            <div>
                <Highlighter
                    searchWords={[props.search]}
                    textToHighlight={`${props.data.region}`}
                />
            </div>
            {props.data.annotation ? (
                <div className="search-option-subTitle">
                    <span>{props.data.annotation}</span>
                </div>
            ) : null}
        </>
    );
};

const VariantSearchOption: React.FunctionComponent<{
    search: string;
    data: ISignalSearch;
}> = props => {
    return (
        <>
            <div>
                <Highlighter
                    searchWords={[props.search]}
                    textToHighlight={`${props.data.variant}`}
                />
            </div>
            {props.data.annotation ? (
                <div className="search-option-subTitle">
                    <span>{props.data.annotation}</span>
                </div>
            ) : null}
        </>
    );
};

export const SearchOption: React.FunctionComponent<ISearchOptionProps> = props => {
    const searchKeyword = props.search ? props.search : '';
    return (
        <div className="search-option-match">
            {props.type === SearchOptionType.GENE &&
                <GeneSearchOption search={searchKeyword} data={props.data} />
            }
            {props.type === SearchOptionType.ALTERATION &&
                <AlterationSearchOption
                    search={searchKeyword}
                    data={props.data}
                />
            }
            {props.type === SearchOptionType.VARIANT &&
                <VariantSearchOption
                    search={searchKeyword}
                    data={props.data}
                />
            }
            {props.type === SearchOptionType.REGION &&
                <RegionSearchOption
                    search={searchKeyword}
                    data={props.data}
                />
            }
        </div>
    );
};
