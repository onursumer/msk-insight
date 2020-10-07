import autobind from "autobind-decorator";
import {CBIOPORTAL_VICTORY_THEME, ScatterPlot} from "cbioportal-frontend-commons";
import _ from "lodash";
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import { Link } from 'react-router-dom';

import {ITumorTypeFrequencySummary} from "../model/GeneFrequencySummary";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import {
    dataPointSize,
    findPathogenicGermlineFrequency,
    findPercentBiallelic,
    IScatterPlotDatum
} from "../util/PlotUtils";
import {dataPointFill} from "../util/PlotUtils";

import "./LandscapePlot.css";

interface ILandscapePlotProps {
    frequencyStore: GeneFrequencyStore;
}

function tumorTypeDataValue(
    d: ITumorTypeFrequencySummary,
    sampleCountByTumorType?: {[tumorType: string]: number}
): string {
    const tumorType = d.tumorType
        .replace("Cancers", "")
        .replace("Cancer", "")
        .replace("Tumors", "")
        .replace("Tumor", "")
        .trim();

    const sampleCount = sampleCountByTumorType ?
        sampleCountByTumorType[d.tumorType]: d.sampleCount;

    return `${tumorType} (${sampleCount})`;
}

function tumorFrequencyDatumToScatterPlotDatum(
    d: ITumorTypeFrequencySummary,
    sampleCountByTumorType?: {[tumorType: string]: number}
): IScatterPlotDatum {
    return {
        x: tumorTypeDataValue(d, sampleCountByTumorType),
        y: d.hugoSymbol,
        datum: d
    };
}

function generateTheme() {
    const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
    theme.axis.style.tickLabels.fontSize *= 0.9;

    return theme;
}

@observer
class LandscapePlot extends React.Component<ILandscapePlotProps>
{
    @computed
    public get scatterPlotData(): IScatterPlotDatum[]
    {
        return this.props.frequencyStore.filteredTumorTypeFrequencySummaryData.map(
            d => tumorFrequencyDatumToScatterPlotDatum(d, this.props.frequencyStore.sampleCountByTumorType)
        );
    }

    @computed
    public get genesWithSignificantPathogenicGermlineRatio()
    {
        return this.props.frequencyStore.filteredGeneFrequencySummaryData.filter(d => {
            const pathogenicGermline = findPathogenicGermlineFrequency(d);
            const percentBiallelic = findPercentBiallelic(d);

            return (
                pathogenicGermline && pathogenicGermline.frequency > 0 ||
                percentBiallelic && percentBiallelic.frequency > 0
            );
        }).sort((a, b) => {
            const aGermlineFreq = findPathogenicGermlineFrequency(a)?.frequency || 0;
            const bGermlineFreq = findPathogenicGermlineFrequency(b)?.frequency || 0;

            const aPercentBialellic = findPercentBiallelic(a)?.frequency || 0;
            const bPercentBialellic = findPercentBiallelic(b)?.frequency || 0;

            return Math.sign(aGermlineFreq - bGermlineFreq) || Math.sign(aPercentBialellic - bPercentBialellic);
        }).map(
            d => d.hugoSymbol
        );
    }

    public get gradientLegendProps()
    {
        return {
            colors: ["darkbrown", "brown", "orange", "#fdff8d"],
            title: "% Biallelic",
            width: 10,
            height: 100,
            min: 0,
            max: 100
        };
    }

    public get discreteLegendProps()
    {
        return {
            title: ["% Pathogenic", "Germline"],
            data: [
                { name: "<0.5", symbol: { fill: "gray", stroke: "none", size: 2 } },
                { name: "0.5-1", symbol: { fill: "gray", stroke: "none", size: 3 } },
                { name: "1-2", symbol: { fill: "gray", stroke: "none", size: 4 } },
                { name: "2-5", symbol: { fill: "gray", stroke: "none", size: 5 } },
                { name: "5-10", symbol: { fill: "gray", stroke: "none", size: 6 } },
                { name: "10-20", symbol: { fill: "gray", stroke: "none", size: 7 } },
            ]
        };
    }

    @computed
    public get filteredScatterPlotData(): IScatterPlotDatum[]
    {
        return this.props.frequencyStore.filteredTumorTypeFrequencySummaryData
            .filter(d => this.genesWithSignificantPathogenicGermlineRatio.includes(d.hugoSymbol))
            .map(d => tumorFrequencyDatumToScatterPlotDatum(d, this.props.frequencyStore.sampleCountByTumorType));
    }

    @computed
    public get plotHeight(): number {
        return (this.genesWithSignificantPathogenicGermlineRatio.length * 12) + 250;
    }

    public render() {
        return (
            <ScatterPlot
                width={1200}
                axisLabelTiltAngle={this.plotHeight < 400 ? 75: undefined}
                height={this.plotHeight}
                theme={generateTheme()}
                gradientLegendProps={this.gradientLegendProps}
                discreteLegendProps={this.discreteLegendProps}
                data={this.filteredScatterPlotData}
                dataComponentSize={dataPointSize}
                containerStyle={{marginLeft: "auto", marginRight: "auto"}}
                plotStyle={{data: {fill: dataPointFill}}}
                xCategoriesCompare={this.compareTumorTypes}
                yCategoriesCompare={this.compareHugoGeneSymbols}
                tooltip={this.dataPointTooltip}
            />
        );
    }

    @autobind
    private compareHugoGeneSymbols(a: string, b: string) {
        return Math.sign(
            this.genesWithSignificantPathogenicGermlineRatio.indexOf(a) -
            this.genesWithSignificantPathogenicGermlineRatio.indexOf(b)
        );
    }

    @autobind
    private compareTumorTypes(a: string, b: string) {
        // this is to push unknown and other to the end of the list
        const priority: {[tumorType: string]: number} = {
            Unknown: 1,
            Other: 2
        };

        const aPriority = priority[a] || 0;
        const bPriority = priority[b] || 0;

        if (aPriority < bPriority) {
            return -1
        }
        else if (aPriority > bPriority) {
            return 1
        }
        else if (a < b) {
            return -1;
        }
        else if (a > b) {
            return 1;
        }
        else {
            return 0;
        }
    }

    @autobind
    private dataPointTooltip(datum: IScatterPlotDatum)
    {
        const pathogenicGermlineFreq = findPathogenicGermlineFrequency(datum.datum)?.frequency;
        const percentBiallelicFreq = findPercentBiallelic(datum.datum)?.frequency;

        const pathogenicGermline = pathogenicGermlineFreq !== undefined ?
            (pathogenicGermlineFreq * 100).toFixed(1): "N/A";

        const percentBiallelic = percentBiallelicFreq !== undefined ?
            (percentBiallelicFreq * 100).toFixed(1): "N/A";

        const {
            hugoSymbol,
            tumorType,
            sampleCount
        } = datum.datum;

        return (
            <>
                <div>Hugo Symbol: <Link to={`/gene/${hugoSymbol}`}>{hugoSymbol}</Link></div>
                <div>Tumor Type: <Link to={`/gene/${hugoSymbol}?cancerType=${tumorType}`}>{tumorType}</Link> ({sampleCount})</div>
                <div>% Pathogenic Germline: <strong>{pathogenicGermline}</strong></div>
                <div>% Biallelic: <strong>{percentBiallelic}</strong></div>
            </>
        );
    }
}

export default LandscapePlot;
