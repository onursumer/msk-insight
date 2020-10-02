import _ from 'lodash';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import {Row} from 'react-bootstrap';
import {CancerTypeFilter, DataFilterType} from "react-mutation-mapper";

import GeneLevelSummary from "../components/GeneLevelSummary";
import LandscapeFilterPanel from "../components/LandscapeFilterPanel";
import PenetranceFilterPanel from "../components/PenetranceFilterPanel";
import {PenetranceLevel} from "../model/Penetrance";
import GeneFrequencyStore, {isFrequencyDataPending} from "../store/GeneFrequencyStore";
import {
    CANCER_TYPE_FILTER_ID,
    PENETRANCE_FILTER_ID,
    PENETRANCE_FILTER_TYPE,
    PenetranceFilter
} from "../util/FilterUtils";

interface IExploreProps {
    frequencyStore?: GeneFrequencyStore;
    penetrance?: PenetranceLevel;
}

@observer
class Explore extends React.Component<IExploreProps>
{
    @observable
    public selectedPenetranceLevels: PenetranceLevel[] | undefined;

    @computed
    public get penetranceFilter(): PenetranceFilter | undefined
    {
        return this.selectedPenetranceLevels ? {
            id: PENETRANCE_FILTER_ID,
            type: PENETRANCE_FILTER_TYPE,
            values: this.selectedPenetranceLevels
        }: undefined;
    }

    @observable
    public selectedCancerTypes: string[] | undefined;

    @computed
    public get cancerTypeFilter(): CancerTypeFilter | undefined
    {
        return this.selectedCancerTypes ? {
            id: CANCER_TYPE_FILTER_ID,
            type: DataFilterType.CANCER_TYPE,
            values: this.selectedCancerTypes
        }: undefined;
    }

    constructor(props: IExploreProps) {
        super(props);

        if (this.props.penetrance) {
            this.selectedPenetranceLevels = [this.props.penetrance];
        }

        if (this.props.frequencyStore) {
            this.props.frequencyStore.updateGeneFrequencySummaryDataFilters(PENETRANCE_FILTER_ID, this.penetranceFilter);
            this.props.frequencyStore.updateTumorTypeFrequencySummaryDataFilters(DataFilterType.CANCER_TYPE, this.cancerTypeFilter);
        }
    }

    public render()
    {
        return (
            <div>
                {!this.isLoading() &&
                    <>
                        <Row className="mb-2">
                            <PenetranceFilterPanel
                                selectedPenetranceLevels={this.selectedPenetranceLevels}
                                geneFrequencyStore={this.props.frequencyStore}
                                onSelect={this.handlePenetranceSelect}
                                multiSelect={true}
                            />
                        </Row>
                        <Row className="mb-2">
                            <LandscapeFilterPanel
                                cancerTypeFilter={this.cancerTypeFilter}
                                geneFrequencyStore={this.props.frequencyStore}
                                onCancerTypeSelect={this.handleCancerTypeSelect}
                            />
                        </Row>
                    </>
                }
                <GeneLevelSummary
                    frequencyStore={this.props.frequencyStore}
                />
            </div>
        );
    }

    private isLoading(): boolean {
        return isFrequencyDataPending(this.props.frequencyStore);
    }

    @action.bound
    private handlePenetranceSelect(penetrance: PenetranceLevel)
    {
        let selectedPenetranceLevels = this.selectedPenetranceLevels || [];

        selectedPenetranceLevels = selectedPenetranceLevels.includes(penetrance) ?
            _.without(selectedPenetranceLevels, penetrance): [...selectedPenetranceLevels, penetrance];

        this.selectedPenetranceLevels = selectedPenetranceLevels.length > 0 ?
            selectedPenetranceLevels: undefined;

        if (this.props.frequencyStore) {
            this.props.frequencyStore.updateGeneFrequencySummaryDataFilters(PENETRANCE_FILTER_ID, this.penetranceFilter);
        }
    }

    @action.bound
    private handleCancerTypeSelect(selectedCancerTypeIds: string[], allValuesSelected: boolean)
    {
        this.selectedCancerTypes = allValuesSelected ? undefined: selectedCancerTypeIds;

        if (this.props.frequencyStore) {
            this.props.frequencyStore.updateTumorTypeFrequencySummaryDataFilters(CANCER_TYPE_FILTER_ID, this.cancerTypeFilter);
        }
    }
}

export default Explore;
