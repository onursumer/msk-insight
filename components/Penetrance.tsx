import Tooltip from "rc-tooltip";
import * as React from "react";

import CircledLetter from "./CircledLetter";

export interface IPenetranceProps
{
    value: string;
}

const STYLE_MAP = {
    Uncertain: {displayValue: "U", color: "#BDBCBC", priority: 1},
    Low: {displayValue: "L", color: "#C7E3BF", priority: 2},
    Moderate: {displayValue: "M", color: "#80CCBB", priority: 3},
    High: {displayValue: "H", color: "#41AB5D", priority: 4},
};

export function comparePenetrance(a: string, b: string)
{
    const aPriority = STYLE_MAP[a] ? STYLE_MAP[a].priority : 0;
    const bPriority = STYLE_MAP[b] ? STYLE_MAP[b].priority : 0;

    if (aPriority < bPriority) {
        return 1;
    }
    else if (aPriority > bPriority) {
        return -1;
    }
    else {
        return 0;
    }
}

class Penetrance extends React.Component<IPenetranceProps>
{
    public render()
    {
        const style = STYLE_MAP[this.props.value];

        if (style) {
            return (
                <Tooltip
                    mouseEnterDelay={0.5}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                    placement="top"
                    overlay={<span>{this.props.value} penetrance</span>}
                    destroyTooltipOnHide={true}
                >
                    <span>
                        <CircledLetter
                            letter={style.displayValue}
                            color={style.color}
                        />
                    </span>
                </Tooltip>
            );
        }
        else {
            return null;
        }
    }
}

export default Penetrance;
