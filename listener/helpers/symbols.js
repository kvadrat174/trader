const axios = require('axios');

async function dailyStat() {
    const symbolsStat = await axios({
        method: 'get',
        url: 'https://api.binance.com/api/v3/ticker/24hr'
    }).then(response => {
        return response.data;
    }).catch(e => console.log(e))
    let res = []
    for (let obj of symbolsStat) {
        let symbol = obj.symbol;
        if (symbol.endsWith('USDT') && parseInt(obj.quoteVolume) > 30 * 1000 * 1000) {
            // console.info(symbol + " volume:" + obj.volume + " change: " + obj.priceChangePercent + "%");
            res.push(obj)
        }
    }
    return res

}

module.exports = { dailyStat }