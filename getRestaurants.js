const puppeteer = require('puppeteer');

const preparePageForTests = async (page) => {
    // Pass the User-Agent Test.
    const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });
    });

    // Pass the Chrome Test.
    await page.evaluateOnNewDocument(() => {
        // We can mock this in as much depth as we need for the test.
        window.navigator.chrome = {
            runtime: {},
            // etc.
        };
    });

    // Pass the Permissions Test.
    await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        return window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    });

    // Pass the Plugins Length Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'plugins', {
            // This just needs to have `length > 0` for the current test,
            // but we could mock the plugins too if necessary.
            get: () => [1, 2, 3, 4, 5],
        });
    });

    // Pass the Languages Test.
    await page.evaluateOnNewDocument(() => {
        // Overwrite the `plugins` property to use a custom getter.
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
    });
}

function uber(address, query) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await preparePageForTests(page);
            await page.goto('https://www.ubereats.com/ca');
            // submit address
            await page.waitForSelector('#location-typeahead-home-input');
            await page.type('#location-typeahead-home-input', address);
            await page.waitForSelector('#location-typeahead-home-item-0');
            await page.click('#location-typeahead-home-item-0');

            // submit restaurant
            await page.waitForSelector('#search-suggestions-typeahead-input', { visible: true });
            await page.type('#search-suggestions-typeahead-input', query);
            await page.keyboard.press('Enter');
            await page.waitForSelector('p', { visible: true });
            let restaurants = await page.$$eval('p', tags => tags.map(p => p.innerHTML));
            let links = await page.$$eval('figure + a', tags => tags.map(a => a.href));
            let results = [];
            for (var i = 0; i < 5; ++i) {
                results.push([restaurants[i], links[i]]);
            }
            await browser.close();
            return resolve(results);
        } catch (e) {
            return reject(e);
        }
    });
}

function doordash(address, query) {
    return new Promise(async (resolve, reject) => {
        try {
            // fix in case no restaurants
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await preparePageForTests(page);
            await page.goto('https://www.doordash.com/');
            // submit address
            await page.waitForSelector('input[aria-label="Your delivery address"]');
            await page.waitForTimeout(1000);
            await page.type('input[aria-label="Your delivery address"]', address);
            await page.click('button[aria-label="Find Restaurants"]');
            await page.waitForSelector('span[data-anchor-id="AddressAutocompleteSuggestion"]');
            await page.click('span[data-anchor-id="AddressAutocompleteSuggestion"]');

            // get restaurants
            await page.goto('https://www.doordash.com/search/store/' + encodeURIComponent(query + '') + '/en-US');
            await page.waitForSelector('span[color="TextPrimary"]');
            let restaurants = await page.$$eval('span[color="TextPrimary"]', spans => spans.map(span => span.innerHTML));
            let links = await page.$$eval('a[data-anchor-id]', tags => tags.map(a => a.href));
            let results = [];
            for (var i = 0; i < 5; ++i) {
                results.push([restaurants[i], links[i]]);
            }
            await browser.close();
            return resolve(results);
        } catch (e) {
            return reject(e);
        }
    });
}

function uberMenu(address, link) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await preparePageForTests(page);
            await page.goto('https://www.ubereats.com/ca');

            // submit address
            await page.waitForSelector('#location-typeahead-home-input');
            await page.type('#location-typeahead-home-input', address);
            await page.waitForSelector('#location-typeahead-home-item-0');
            await page.click('#location-typeahead-home-item-0');

            // get menu items
            await page.goto(link, { waitUntil: 'networkidle2' });
            let pics = await page.$$eval('img', imgs => imgs.map(img => img.src));
            pics.shift();
            let menu = await page.$$eval('h4 > div',
                tags => tags.map(div => div.innerHTML));
            let prices = await page.$$eval('li > div > div > div > div > :nth-child(3) > div',
                tags => tags.map(div => div.innerHTML));
            let results = [];
            for (var i = 0; i < 20; ++i) {
                results.push([menu[i], prices[i].slice(1), pics[i]]);
            }
            await browser.close();
            return resolve(results);
        } catch (err) {
            reject(err);
        }
    });
}

function doordashMenu(address, link) {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await preparePageForTests(page);
            await page.goto('https://www.doordash.com/');

            // submit address
            await page.waitForSelector('input[aria-label="Your delivery address"]');
            await page.waitForTimeout(1000);
            await page.type('input[aria-label="Your delivery address"]', address);
            await page.click('button[aria-label="Find Restaurants"]');
            await page.waitForSelector('span[data-anchor-id="AddressAutocompleteSuggestion"]');
            await page.click('span[data-anchor-id="AddressAutocompleteSuggestion"]');

            // get menu items
            await page.goto(link, { waitUntil: 'networkidle2' });
            let pics = await page.$$eval('img', imgs => imgs.map(img => img.src));
            pics.splice(0, 2);
            let items = await page.$$eval('div[data-anchor-id="MenuItem"] > button', btns => btns.map(btn => btn.ariaLabel));
            let results = [];
            for (var i = 0; i < 20; ++i) {
                let item = items[i].split("$");
                item[0] = item[0].slice(0, -1);
                item[1] = "$" + item[1];
                item.push(pics[i]);
                results.push(item);
            }
            await browser.close();
            return resolve(results);
        } catch (err) {
            reject(err);
        }
    });
}

// debugging:
// doordashMenu('100 seagram', 'https://www.doordash.com/store/1148909/en-US').then(console.log);

module.exports = {
    pass_tests: preparePageForTests,
    uber: uber,
    doordash: doordash,
    uberMenu: uberMenu,
    doordashMenu: doordashMenu
}