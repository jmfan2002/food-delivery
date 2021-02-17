const express = require('express');
const app = express();
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getRestaurants = require('./getRestaurants');
var uber = [];
var doordash = [];
var menuItems = [];
var address = '';
var queryResponse = '';
var linkResponse = '';

app.listen(port, () => console.log(`Listening on port ${port}`));

// receive form
app.post('/form_data', async (req, res) => {
    console.log('form recieved');
    address = req.body.address;
    let query = req.body.query;
    uber = await getRestaurants.uber(address, query).then().catch(console.error);
    doordash = await getRestaurants.doordash(address, query).then().catch(console.error);
    queryResponse = query;
    console.log(doordash.toString());
});

// send restaurant list
app.get('/results', (req, res) => {
    res.send({query: queryResponse, uberData: uber, doordashData: doordash});
});

// load restaurant menu
app.post('/restaurant', async (req, res) => {
    console.log('loading restaurant menu');
    let link = req.body.link;
    if (req.body.site == "uber") {
        menuItems = await getRestaurants.uberMenu(address, link).then().catch(console.error);
    } else {
        menuItems = await getRestaurants.doordashMenu(address, link).then().catch(console.error);
    }
    linkResponse = link;
    console.log(link);
});

// send restaurant menu
app.get('/menu', (req, res) => {
    res.send({link: linkResponse, menuItems: menuItems});
})