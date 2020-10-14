import { observer } from 'mobx-react';
import * as React from 'react';
import * as VariantView from 'react-variant-view';

interface IVariantProps {
    variant: string;
}

@observer
class Variant extends React.Component<IVariantProps>
{
    public render()
    {
        // TODO too many "variant" here. We should change component name to VariantView or change this Variant page name to VariantPage
        return (
            <VariantView.Variant variant={this.props.variant} />
        )
    }
}

export default Variant;
