import React, { Component } from 'react';
import axios from 'axios';

class Restaurant extends Component {
    constructor(props) {
        super(props);
        this.state = {
            location: props.location,
            link: props.link,
            address: props.address,
            menuItems: [],
            isLoading: true
        }
    }

    componentDidMount() {
        this.callBackend()
            .then((res) => {
                this.setState({
                    isLoading: false,
                    menuItems: res.data.menuItems
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
            console.log('server: ' + results.data.link);
            console.log('local: ' + this.state.link);
        }
        return results;
    }

    render() {
        const menu = this.state.menuItems.map(item =>
            <li className="list-group-item d-flex">
                <img src={item[2]} />
                <div>
                    <h2>{item[0]}</h2>
                    <h3>{item[1]}</h3>
                </div>
            </li>);
        return (
            <div>
                <h2>{this.state.location}</h2>
                {this.state.isLoading ?
                    <div className="d-flex justify-content-center">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div> :
                    <ul className="scrollable list-group">
                        {menu}
                    </ul>
                }
            </div>
        );
    }
}

export default Restaurant;