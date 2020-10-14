import { observer } from 'mobx-react';
import * as React from 'react';
import { Variant as VariantView } from 'react-variant-view';

interface IVariantProps {
    variant: string;
}

@observer
class Variant extends React.Component<IVariantProps>
{
    public render()
    {
        return (
            <VariantView variant={this.props.variant} />
        )
    }
}

export default Variant;
