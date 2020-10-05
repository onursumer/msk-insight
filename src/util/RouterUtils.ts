import _ from 'lodash';
import {parse} from 'query-string';

export enum SearchParam {
    CANCER_TYPE = 'cancerType'
}

export function getQueryParam(
    location: {search: string},
    paramName: string
) {
    const searchParams = parse(location.search);
    return searchParams[paramName];
}

export function getQueryParamAsArray(
    location: {search: string},
    paramName: string
): string[] | undefined
{
    const param = getQueryParam(location, paramName);
    return param ? _.flatten([param]): undefined;
}
