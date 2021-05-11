const fetch = require('node-fetch');
var HttpProxyAgent = require('http-proxy-agent');
var prompt = require('prompt-sync')({ sigint: true });


function getDateString(t) {
    const todayDate = new Date();
    todayString = todayDate.toLocaleString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' }).replace(/\//g, '-');
    return todayString;
}

function getProxies() {
    return fetch('https://api.proxyscrape.com?request=displayproxies&proxytype=http&timeout=7000&country=IN&anonymity=elite&ssl=no')
        .then(res => res.text())
        .then(body => { return body; }).catch(err => { console.log(err); return null; }).catch(err => { console.log(err) });
}



function getCenters(proxy_list, districtID, dateParam, age_limit) {

    var proxy_number = Math.floor(Math.random() * proxy_list.length);
    const options = {
        method: 'GET',
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'if-none-match': 'W/"1937c-x2CLKJ0ftB7B0o3iakHfSCtCC4k"',
            'origin': 'https://www.cowin.gov.in',
            'referer': 'https://www.cowin.gov.in/',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Microsoft Edge";v="90"',
            'sec-ch-ua-mobile': '?1',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'agent': new HttpProxyAgent(proxy_list[proxy_number]),
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36 Edg/90.0.818.56'
        }
    };

    fetch('https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=' + districtID + '&date=' + dateParam, options)
        .then(res => res.json())
        .then(body => {
            avlCenters = body.centers.filter(sess => sess.sessions.filter(slot => (slot.min_age_limit === age_limit) && (slot.available_capacity > 0)).length > 0);
            if (avlCenters.length === 0) {
                console.log('\n------------------------------------------------');
                console.log('No available centers at this moment for chosen parameters\n');
                console.log('------------------------------------------------\n\n');
            } else {
                console.log('\n------------------------------------------------');
                avlCenters.map(center => {
                    console.log('Hospital name - ' + center.name);
                    console.log('Hospital address - ' + center.address);
                    console.log('Hospital pincode - ' + center.pincode);
                    console.log('\n');
                    center.sessions.map(session => {
                        console.log('Date - ' + session.date);
                        console.log('Remaining Slots - ' + session.available_capacity);
                        console.log('Vaccine name - ' + session.vaccine);
                        console.log('\n');
                    });
                    console.log('---********---');
                });
                console.log('------------------------------------------------\n\n');
            }
        }).catch(err => { console.log(err) });
}


async function main() {


    proxy_list = await getProxies();
    proxy_list = proxy_list.trim().split('\n').map(x => x.replace('\r', ''));

    const options = {
        method: 'GET',
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9',
            'if-none-match': 'W/"1937c-x2CLKJ0ftB7B0o3iakHfSCtCC4k"',
            'origin': 'https://www.cowin.gov.in',
            'referer': 'https://www.cowin.gov.in/',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Microsoft Edge";v="90"',
            'sec-ch-ua-mobile': '?1',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Mobile Safari/537.36 Edg/90.0.818.56'
        }
    };

    var dateParam = getDateString();

    const stateResponse = await fetch('https://cdn-api.co-vin.in/api/v2/admin/location/states', options);
    const stateJson = await stateResponse.json();
    stateJson.states.map(x => console.log(x.state_id + " -  " + x.state_name))

    var stateID = prompt('Enter state number - ');
    console.log('\n');

    while (stateID === null || stateID === undefined || stateID === '' || Number(stateID) < 0 || Number(stateID) > stateJson.states.length) {
        stateID = prompt('Enter a valid state number - ');
        console.log('\n');
    }


    const districtResponse = await fetch('https://cdn-api.co-vin.in/api/v2/admin/location/districts/' + stateID, options);
    var districtJson = await districtResponse.json();
    districtJson = districtJson.districts.map((x, index) => ({ index: index, district_id: x.district_id, district_name: x.district_name }))
    districtJson.map(x => console.log(x.index + " -  " + x.district_name));

    var districtChoice = prompt('Enter district number - ');

    while (districtChoice === null || districtChoice === undefined || districtChoice === '' || Number(districtChoice) < 0 || Number(districtChoice) > districtJson.length) {
        var stateID = prompt('Enter a valid district number - ');
        console.log('\n');
    }

    var districtID = districtJson.find(d => d.index === Number(districtChoice)).district_id;

    console.log('\n1 - 18 to 44 \n2 - 45+');
    var age_limit = prompt('Enter age group - ');

    while (age_limit === null || age_limit === undefined || age_limit === '' || Number(age_limit) < 1 || Number(age_limit) > 2) {
        var stateID = prompt('Enter a valid district number - ');
        console.log('\n');
    }

    age_limit = age_limit === '1' ? 18 : age_limit === '2' ? 45 : null;

    console.log('\n\nState - ' + stateJson.states.find(s => s.state_id === Number(stateID)).state_name + ' District - ' + districtJson.find(d => d.index === Number(districtChoice)).district_name + ' Age group - ' + (age_limit === 18 ? '18 - 44' : '45+'))



    var timeInterval = prompt('Enter frequency of code in minutes. The code will run after x minutes as per given input.\nPress enter for default');
    if (timeInterval === undefined || timeInterval === null) {
        timeInterval = 60000
    } else if ((Number(timeInterval)) > 0) {
        timeInterval = Number(timeInterval) * 60000;
    } else {
        console.log('Wrong input. Using default time interval');
        timeInterval = 60000;
    }


    getCenters(proxy_list, districtID, dateParam, age_limit);
    setInterval(function() { getCenters(proxy_list, districtID, dateParam, age_limit) }, timeInterval);
}


main()