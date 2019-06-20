import * as React from 'react';
import {
    BrowserRouter, Route, Switch
} from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import GeneFrequencyStore from "../store/GeneFrequencyStore";
import About from "./About";
import Download from "./Download";
import Gene from "./Gene";
import Home from "./Home";

class Main extends React.Component<{}>
{
    private frequencyStore: GeneFrequencyStore = new GeneFrequencyStore();

    public render()
    {
        const GenePage = (props: any) => (
            <Gene
                hugoSymbol={props.match.params.hugoSymbol}
                frequencyStore={this.frequencyStore}
            />
        );

        const HomePage = () => (
            <Home
                frequencyStore={this.frequencyStore}
            />
        );

        return (
            <BrowserRouter>
                <div className="Main">
                    <Header />
                    <div style={{paddingTop: 20, paddingBottom: 100, fontSize: "1.25rem", color: "#2c3e50"}}>
                        <Switch>
                            <Route exact={true} path="/" component={HomePage}/>
                            <Route exact={true} path="/gene/:hugoSymbol" component={GenePage} />
                            <Route exact={true} path="/about" component={About}/>
                            <Route exact={true} path="/download" component={Download}/>
                        </Switch>
                    </div>
                    <Footer />
                </div>
            </BrowserRouter>
        );
    }
}

export default Main;