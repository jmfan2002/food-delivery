import React, { Component } from 'react';
import axios from 'axios';

class Restaurant extends Component {
    constructor(props) {
        super(props);
        this.state = {
            locationName: props.location,
            link: props.link,
            address: props.address,
            locationAddress: '',
            menuItems: [],
            isLoading: true
        }
    }

    componentDidMount() {
        this.callBackend()
            .then((res) => {
                this.setState({
                    isLoading: false,
                    locationAddress: res.data.menuItems[0],
                    menuItems: res.data.menuItems[1]
                });
            })
            .catch(err => console.error(err));
    }

    async callBackend() {
        var results = await axios.get('http://localhost:5000/menu');

        const delay = ms => new Promise(res => setTimeout(res, ms));
        while (results.data.link != this.state.link) {
            await delay(1000);

            results = await axios.get('http://localhost:5000/menu');
        }
        return results;
    }

    render() {
        const menu = this.state.menuItems.map(item =>
            <a href={this.state.link} className="list-group-item list-group-item-action d-flex">
                <img src={item[2]} />
                <div>
                    <h2>{item[0]}</h2>
                    <h3>{item[1]}</h3>
                </div>
            </a>);
        return (
            <div>
                <h2>{this.state.locationName}</h2>

                {this.state.isLoading ?
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div> :
                    <div>
                        <span>
                            {this.state.locationAddress}
                        </span>
                        <div className="scrollable list-group">
                            {menu}
                        </div>
                    </div>
                }
            </div>
        );
    }
}

export default Restaurant;
