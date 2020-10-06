import _ from 'lodash';

import {PenetranceLevel} from "../model/Penetrance";

export function getPenetranceLevels(penetranceLevels?: string[]): PenetranceLevel[] | undefined
{
    const levels = _.compact(penetranceLevels?.map(getPenetranceLevel));

    return levels.length > 0 ? levels: undefined;
}

export function getPenetranceLevel(penetrance?: string): PenetranceLevel | undefined
{
    switch (penetrance?.toLowerCase()) {
        case 'uncertain':
            return PenetranceLevel.Uncertain;
        case 'low':
            return PenetranceLevel.Low;
        case 'moderate':
            return PenetranceLevel.Moderate;
        case 'high':
            return PenetranceLevel.High;
        default:
            return undefined;
    }
}
