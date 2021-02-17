import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Restaurant from './Restaurant';

class Input extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputAddress: '',
            submitAddress: '',
            query: '',
            uber: [],
            doordash: [],
            showUberList: false,
            showDoordashList: false,
            uberClicked: false,
            doordashClicked: false,
            location: '',
            link: '',
            isLoading: false
        }
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.callBackend = this.callBackend.bind(this);
        this.startLoading = this.startLoading.bind(this);
        this.launchRestaurant = this.launchRestaurant.bind(this);
        this.backButton = this.backButton.bind(this);
    }

    async callBackend(inputQuery) {
        let results = await axios.get('http://localhost:5000/results');

        const delay = ms => new Promise(res => setTimeout(res, ms));
        while (results.data.query != inputQuery) {
            await delay(1000);

            results = await axios.get('http://localhost:5000/results');
        }
        this.setState({
            uber: results.data.uberData,
            doordash: results.data.doordashData
        });
    };

    startLoading() {
        this.setState(state => ({
            submitAddress: state.inputAddress,
            inputAddress: '',
            query: '',
            showUberList: false,
            showDoordashList: false,
            uberClicked: false,
            doordashClicked: false,
            isLoading: true
        }));
    }

    handleChange(event) {
        this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleSubmit(e) {
        e.preventDefault();

        axios
            .post('http://localhost:5000/form_data', {
                address: this.state.inputAddress,
                query: this.state.query
            })
            .then(() => console.log("form sent"))
            .catch(err => console.error(err));

        let inputQuery = this.state.query;
        this.startLoading();
        (async () => {
            try {
                await this.callBackend(inputQuery);
                this.setState({
                    isLoading: false,
                    showUberList: true,
                    showDoordashList: true
                });
            } catch (err) {
                console.log(err);
            }
        })();
    }

    launchRestaurant(e, site, link) {
        this.setState({
            location: e.target.innerHTML,
            link: link
        });
        if (site == "uber") {
            this.setState({
                showUberList: false,
                uberClicked: true
            });
        } else {
            this.setState({
                showDoordashList: false,
                doordashClicked: true
            });
        }

        axios
            .post('http://localhost:5000/restaurant', {
                link: link,
                site: site
            })
            .then(() => console.log('restaurant data sent'))
            .catch(err => console.error(err));
    }

    backButton(site) {
        if (site == 'uber') {
            this.setState({
                showUberList: true
            });
        } else {
            this.setState({
                showDoordashList: true
            });
        }
    }

    render() {
        const uber = (this.state.uber && this.state.uber.length) ? (
            this.state.uber.map(result =>
                <a href="#" className="list-group-item list-group-item-action" onClick={(e) => this.launchRestaurant(e, 'uber', result[1])}>{result[0]}</a>)
        ) : (<h4>No results, please try again</h4>);
        const doordash = (this.state.doordash && this.state.doordash.length) ? (
            this.state.doordash.map(result =>
                <a href="#" className="list-group-item list-group-item-action" onClick={(e) => this.launchRestaurant(e, 'doordash', result[1])}>{result[0]}</a>)
        ) : (<h4>No results, please try again</h4>);
        return (
            <div>
                <form id="submission" onSubmit={this.handleSubmit}>
                    <div className="input-group mb-3">
                        <span className="input-group-text">Address:</span>
                        <input type="text" className="form-input form-control" onChange={this.handleChange} value={this.state.inputAddress} name='inputAddress' />
                    </div>
                    <div className="input-group mb-3">
                        <span className="input-group-text">Food Search:</span>
                        <input type="text" className="form-input form-control" onChange={this.handleChange} value={this.state.query} name='query' />
                    </div>
                    <button type="submit" id="btn-submit" className="btn btn-primary">Search</button>
                </form>
                <div className="d-flex justify-content-center">
                    {this.state.isLoading &&
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>}
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-6 d-flex justify-content-center">
                            {this.state.showUberList ?
                                <div>
                                    <h2>Uber</h2>
                                    <div className="list-group">
                                        {uber}
                                    </div>
                                </div> : this.state.uberClicked &&
                                <div>
                                    <button class="btn btn-light"
                                        onClick={() => this.backButton('uber')}>Back</button>
                                    <Restaurant location={this.state.location} link={this.state.link} address={this.state.submitAddress} />
                                </div>}
                        </div>
                        <div className="col-6 d-flex justify-content-center">
                            {this.state.showDoordashList ?
                                <div>
                                    <h2>Doordash</h2>
                                    <div className="list-group">
                                        {doordash}
                                    </div>
                                </div> : this.state.doordashClicked &&
                                <div>
                                    <button className="btn btn-light"
                                        onClick={() => this.backButton('doordash')}>Back</button>
                                    <Restaurant location={this.state.location} link={this.state.link} address={this.state.submitAddress} />
                                </div>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

ReactDOM.render(<Input />, document.getElementById('root'));
