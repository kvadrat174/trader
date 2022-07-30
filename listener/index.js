const Binance = require("node-binance-api");
const { sendTelegram } = require("./helpers/boolinger");

const { redisGetAsync, redisSetAsync } = require("./helpers/redis");
const { callBollinger } = require("./helpers/boolinger");

async function terminator(list, mess) {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });

    let endpoints = binance.websockets.subscriptions();
    console.log(endpoints, 'endpoints: ', mess)
    if (Object.keys(endpoints).length !== 0) {
        //await sendTelegram(Object.values(endpoints).join(' ') + ' working symbols')

        for (let endpoint in endpoints) {
            if (!list.includes(endpoint)) {
                let ws = endpoints[endpoint];
                ws.terminate()
            }
        }
    }
    else {
        //await sendTelegram('start working')
    }
}



async function chart(symbols) {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });
    binance.websockets.chart(
        symbols,
        "1m",
        async (symbolы, interval, chart) => {
            let tick = binance.last(chart);
            const last = chart[tick].close;
            // console.info(symbol);
            // // Optionally convert 'chart' object to array:
            let ohlc = binance.ohlc(chart);

            //console.log(ohlc)
            // searching for trade sygnal
            let res = await callBollinger(symbol, ohlc, last)
            //console.log(res)

            await redisSetAsync(symbol, last)
            let money = await redisGetAsync(`${symbol}-bank`)
            money = money !== null ? money : 0;
            // console.log(money, `money in the bank of ${symbol}`);
        },
        50
    );

    // binance.websockets.chart("FRONTUSDT",
    //   "1m", (symbol, interval, chart) => {
    //     let ohlc = binance.ohlc(chart);
    //     let endpoints = binance.websockets.subscriptions();
    //     for (let endpoint in endpoints) {
    //       console.log(endpoint);
    //       //let ws = endpoints[endpoint];
    //       //ws.terminate();
    //     }
    //   });

}

//chart();

async function chartCall(symbols, symbollsStat) {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });
    let stat = [{ symbol: 'ADADOWNUSDT', priceChangePercent: '0.128' },
    { symbol: 'MBLUSDT', priceChangePercent: '0.150' },
    { symbol: 'TROYUSDT', priceChangePercent: '0.258' },
    { symbol: 'XTZUPUSDT', priceChangePercent: '0.353' },
    { symbol: 'XECUSDT', priceChangePercent: '0.415' },
    { symbol: 'GTOUSDT', priceChangePercent: '0.479' },
    { symbol: 'VTHOUSDT', priceChangePercent: '0.648' },
    { symbol: 'XRPDOWNUSDT', priceChangePercent: '0.831' },
    { symbol: 'AIONUSDT', priceChangePercent: '1.154' }
    ]

    binance.websockets.chart(symbols, "1m", async (symbol, interval, chart) => {

        let tick = binance.last(chart);
        const last = chart[tick].close;
        //let res = await candleStat(Object.values(chart), symbol)
        // Optionally convert 'chart' object to array:
        let ohlc = binance.ohlc(chart);
        //console.info(symbol, ohlc);
        // let res = await candleStatistic(ohlc, symbol)
        // if (parseFloat(res.priceChangePercent) > parseFloat(stat[0].priceChangePercent)) {
        //   stat = await actualizeData(stat)
        // }
        console.info(chart, symbol)
    }, 2);
}

async function actualizeData() {
    let daily = await dailyStat()
    let symbolsStat = await getStats(daily)
}

async function candleStatistic(chart, symbol) {

    let high = chart.close[chart.close.length - 1]
    let low = chart.open[0]
    return { symbol: symbol, priceChangePercent: (high * 100 / low - 100).toFixed(3) }
}
//, "EGLDUSDT", "FRONTUSDT", "COCOSUSDT"]

chartCall(["EGLDUSDT", "FRONTUSDT"])

// module.exports = {
//   chart, terminator, chartCall
// }
