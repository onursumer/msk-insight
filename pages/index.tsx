import Head from 'next/head'
import GeneLevelSummary from "../components/GeneLevelSummary";

const Index = () => (
    <div className="container">
        <Head>
            <title>SignalDB</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <div>
            <div style={{paddingLeft:8, maxWidth: 1500}}>
                The SIGNAL (<u>S</u>omatic <u>I</u>ntegration of <u>G</u>ermli<u>n</u>e <u>Al</u>terations in cancer)
                resource integrates germline and somatic alterations identified by clinical sequencing of
                active cancer patients. Provided here are pathogenic germline variants and their tumor-specific
                zygosity changes by gene, lineage, and cancer type in 17,152 prospectively sequenced cancer patients.
            </div>
            <hr />
            <GeneLevelSummary frequencyStore={this.props.frequencyStore} />
        </div>
    </div>
)

export default Index;
