import * as React from 'react';

import GeneLevelSummary from "../components/GeneLevelSummary";
import GeneFrequencyStore from "../store/GeneFrequencyStore";

interface IHomeProps {
    frequencyStore?: GeneFrequencyStore
}

class Home extends React.Component<IHomeProps>
{
    public render()
    {
        return (
            <div>
                <GeneLevelSummary frequencyStore={this.props.frequencyStore} />
            </div>
        );
    }
}

export default Home;
