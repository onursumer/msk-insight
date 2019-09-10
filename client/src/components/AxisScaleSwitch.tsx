import {observer} from "mobx-react";
import * as React from "react";
import SwitchBox from "react-switch";

interface IAxisScaleSwitchProps {
    onChange: (checked: boolean) => void;
    checked: boolean;
}

function getIcon(icon: JSX.Element)
{
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                paddingRight: 2,
                color: "#FFF",
                fontSize: "85%"
            }}
        >
            {icon}
        </div>
    );
}

@observer
export class AxisScaleSwitch extends React.Component<IAxisScaleSwitchProps, {}>
{
    public render()
    {
        return (
            <SwitchBox
                checked={this.props.checked}
                onChange={this.props.onChange}
                checkedIcon={getIcon(<strong>%</strong>)}
                uncheckedIcon={getIcon(<strong>#</strong>)}
                boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                handleDiameter={20}
                height={16}
                width={48}
            />
        );
    }
}