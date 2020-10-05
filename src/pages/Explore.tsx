import { observer } from 'mobx-react';
import * as React from 'react';
import {Row} from 'react-bootstrap';

import GeneLevelSummary from "../components/GeneLevelSummary";
import LandscapeFilterPanel from "../components/LandscapeFilterPanel";
import PenetranceFilterPanel from "../components/PenetranceFilterPanel";
import {PenetranceLevel} from "../model/Penetrance";
import GeneFrequencyStore, {isFrequencyDataPending} from "../store/GeneFrequencyStore";
import GeneFrequencyFilterHelper from "../util/GeneFrequencyFilterHelper";

interface IExploreProps {
    frequencyStore?: GeneFrequencyStore;
    penetrance?: PenetranceLevel;
}

@observer
class Explore extends React.Component<IExploreProps>
{
    private readonly filterHelper: GeneFrequencyFilterHelper;

    constructor(props: IExploreProps) {
        super(props);

        this.filterHelper = new GeneFrequencyFilterHelper(
            this.props.frequencyStore,
            this.props.penetrance ? [this.props.penetrance]: undefined
        );
    }

    public render()
    {
        return (
            <div>
                {!this.isLoading() &&
                    <>
                        <Row className="mb-2">
                            <PenetranceFilterPanel
                                selectedPenetranceLevels={this.filterHelper.selectedPenetranceLevels}
                                geneFrequencyStore={this.props.frequencyStore}
                                onSelect={this.filterHelper.handlePenetranceSelect}
                                multiSelect={true}
                            />
                        </Row>
                        <Row className="mb-2" style={{fontSize: "85%"}}>
                            <LandscapeFilterPanel
                                geneFrequencyStore={this.props.frequencyStore}
                                onResetFilters={this.filterHelper.handleFilterReset}
                                isFiltered={this.filterHelper.isFiltered}
                                cancerTypeFilter={this.filterHelper.cancerTypeFilter}
                                cancerTypesOptions={this.filterHelper.cancerTypesOptions}
                                onCancerTypeSelect={this.filterHelper.handleCancerTypeSelect}
                                hugoSymbolFilter={this.filterHelper.hugoSymbolDropdownFilter}
                                hugoSymbolOptions={this.filterHelper.hugoSymbolOptions}
                                onHugoSymbolSelect={this.filterHelper.handleHugoSymbolSelect}
                            />
                        </Row>
                    </>
                }
                <GeneLevelSummary
                    frequencyStore={this.props.frequencyStore}
                    filterHelper={this.filterHelper}
                />
            </div>
        );
    }

    private isLoading(): boolean {
        return isFrequencyDataPending(this.props.frequencyStore);
    }
}

export default Explore;
