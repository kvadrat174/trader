//const { chart, terminator, chartCall } = require('./index')
const { sendTelegram } = require("./helpers/boolinger");
const axios = require('axios');
const Binance = require("node-binance-api");
const { redisSetAsync, redisGetAsync } = require("./helpers/redis");

// Authenticated client, can make signed calls
const client2 = Binance({
    apiKey: process.env.APIKEY,
    apiSecret: process.env.APISECRET,
})


async function botRunner() {
    let daily = await dailyStat()
    //console.log(daily)
    let symbolsOnly = daily.map(obj => obj.symbol)
    console.log(symbolsOnly)
    return
    let candles = await getStats(daily)
    let symbolsStat = getCandleStats(candles)
    //console.log(symbolsStat, 'start symbols')
    await sendTelegram(symbolsStat.map(obj => obj.symbol).join(' | ') + ' starting symbols')
    //let workingList = symbols.map(symbol => `${symbol.toLowerCase()}@kline_1m`)
    await chartCall(symbolsOnly, symbolsStat)
    //sendTelegram(workingList.join(' ') + ' working symbols')
    // for (let symbol of symbols) {
    //     //await terminator(workingList, 'in', symbol)
    //     await chartCall(symbol)
    // }
}

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

async function getStats(resp) {
    let res = resp
    let candles = []

    const candlesPromise = await Promise.all(res.map(obj => getCandles(obj.symbol, 30)))
    for (let obj of candlesPromise) {
        candles.push(obj)
    }

    return candles
}

function getCandleStats(candles) {
    let candles10 = candleStat(candles, 10)
    quickSortRecursive(candles10, 0, candles10.length - 1)
    candles10 = candles10.slice(-20)
    // check stat for last 5m

    let candles5 = candleStat(candles, 5)
    quickSortRecursive(candles5, 0, candles5.length - 1)
    candles5 = candles5.slice(-10)

    // check stat for last 1m
    let candles1 = candleStat(candles, 2)
    quickSortRecursive(candles1, 0, candles1.length - 1)
    candles1 = candles1.slice(-5)

    let checked = checkEntries(candles10, candles5, candles1)
    //console.log(checked, 'checked')
    return checked
}

function checkEntries(candles10, candles5, candles1) {
    let res = []
    let final = []
    let candl10 = candles10.map(obj => obj.symbol)
    //console.log(candl10)
    let candl5 = candles5.map(obj => obj.symbol)
    for (let obj of candles1) {
        if (candl10.includes(obj.symbol) && candl5.includes(obj.symbol)) {
            obj['priceChangePercent10m'] = candles10[candl10.indexOf(obj.symbol)]['priceChangePercent10m']
            obj['priceChangePercent5m'] = candles5[candl5.indexOf(obj.symbol)]['priceChangePercent5m']
            res.push(obj)
        }
    }


    return res
}

function candleStat(chart, limit) {
    let res = []
    for (let obj of chart) {
        //if (obj.length > 10) {
        const newChart = obj.slice(-limit)
        const symbol = newChart[0].symbol
        let high = newChart[newChart.length - 1].close
        let low = newChart[0].open
        if ((parseFloat(high) - parseFloat(low)) > 0) {
            let objSym = {}
            objSym['symbol'] = symbol
            objSym[`priceChangePercent${limit}m`] = (high * 100 / low - 100).toFixed(3)
            res.push(objSym)
        }
    }
    return res
}

function partition(arr, start, end) {
    // Taking the last element as the pivot
    const pivotValue = parseFloat(arr[end].priceChangePercent);
    let pivotIndex = start;
    for (let i = start; i < end; i++) {
        if (parseFloat(arr[i].priceChangePercent) < pivotValue) {
            // Swapping elements
            [arr[i], arr[pivotIndex]] = [arr[pivotIndex], arr[i]];
            // Moving to next element
            pivotIndex++;
        }
    }

    // Putting the pivot value in the middle
    [arr[pivotIndex], arr[end]] = [arr[end], arr[pivotIndex]]
    return pivotIndex;
};

function quickSortRecursive(arr, start, end) {
    // Base case or terminating case
    if (start >= end) {
        return;
    }

    // Returns pivotIndex
    let index = partition(arr, start, end);

    // Recursively apply the same logic to the left and right subarrays
    quickSortRecursive(arr, start, index - 1);
    quickSortRecursive(arr, index + 1, end);
}

async function getCandles(name, period) {

    const candles = await axios({
        method: 'get',
        url: `https://api.binance.com/api/v3/klines?symbol=${name}&interval=1m&limit=${period}`
    }).then(response => {
        return response.data.map(tick => {
            return {
                symbol: name,
                startTime: tick[0],
                open: tick[1],
                high: tick[2],
                low: tick[3],
                close: tick[4],
                volume: tick[5],
                closeTime: tick[6]
            }
        });
    }).catch(e => console.log(e))

    return candles
}

function aggregateChat(data, symbol) {
    let res = []
    for (obj of Object.keys(data)) {
        res.push({
            symbol: symbol,
            startTime: obj,
            open: data[obj].open,
            high: data[obj].high,
            low: data[obj].low,
            close: data[obj].close,
            volume: data[obj].volume
        })
    }
    console.log(res)
    return res.slice(-15)
}


async function chartCall(symbols, symbolsStat) {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });
    let stat = symbolsStat
    console.log(symbolsStat, 'start stat')
    let symbolHistory = {}
    await redisSetAsync('list', JSON.stringify(symbolsStat))
    let statValues = stat.map(obj => obj.symbol)
    binance.websockets.chart(symbols, "1m", async (symbol, interval, chart) => {
        symbolHistory[symbol] = aggregateChat(chart, symbol)
        //console.log(statValues)

        // console.log(Object.values(symbolHistory).length, 'length of symbols')
        if (statValues.length === 0 && Object.values(symbolHistory).length === symbols.length) {
            stat = await actualizeData(stat, Object.values(symbolHistory))
            statValues = stat.map(obj => obj.symbol)
        }
        else if (Object.values(symbolHistory).length === symbols.length) {
            let tick = binance.last(chart);
            const lastClose = chart[tick].close;
            const lastOpen = chart[tick].open;
            //let res = await candleStat(Object.values(chart), symbol)
            // Optionally convert 'chart' object to array:
            // let ohlc = binance.ohlc(chart);
            //console.info(symbol, ohlc);
            let res = await candleStatistic(lastClose, lastOpen, symbol)

            if (!statValues.includes(symbol) &&
                parseFloat(res.priceChangePercent) > parseFloat(stat[0].priceChangePercent1m) &&
                Object.values(symbolHistory).length === symbols.length) {
                stat = await actualizeData(stat, Object.values(symbolHistory))
                statValues = stat.map(obj => obj.symbol)
            }
        }
    }, 25);

}


async function actualizeData(stat, candles) {
    let newSymbols = []
    let outSymbols = []
    let symbolsStat = getCandleStats(candles)
    console.log(symbolsStat, 'new')
    console.log(stat, 'old')
    let keysOld = stat.map(obj => obj.symbol)
    let keysNew = symbolsStat.map(obj => obj.symbol)
    for (let obj of keysNew) {
        if (!keysOld.includes(obj)) {
            newSymbols.push(obj)
            //await sendTelegram(`${obj} is new | ${keysNew.join('| ')}`)
        }
    }
    for (let obj of keysOld) {
        if (!keysNew.includes(obj)) {
            outSymbols.push(obj)
            //await sendTelegram(`${obj} is out | ${keysNew.join('| ')}`)
        }
    }

    let change = await redisGetAsync('list')
    // console.log(JSON.parse(change), '-------')
    // console.log(symbolsStat, '++++++++++++++')
    // сравнить только символы, т.к изменение процента тоже дает запрос к телеге
    let same = isTheSame(JSON.parse(change), symbolsStat)

    if (!same) {
        await redisSetAsync('list', JSON.stringify(symbolsStat))
        if (newSymbols.length > 0 || outSymbols.length > 0) {
            await prepareAndSend(JSON.parse(change), symbolsStat, outSymbols, newSymbols)
        }
    }
    return symbolsStat
}

async function prepareAndSend(prevList, newList, outSymbols, newSymbols) {
    let mess = ''
    let outS = prevList.map(obj => {
        if (outSymbols.includes(obj.symbol)) {
            return JSON.stringify(obj)
        }
    })

    let newS = newList.map(obj => {
        if (newSymbols.includes(obj.symbol)) {
            return JSON.stringify(obj)
        }
    })
    if (outSymbols.length > 0) {
        mess += `out: ${outS.join(' | ')} \n`
    }
    if (newSymbols.length > 0) {
        mess += `new: ${newS.join(' | ')} \n`
    }
    mess += `current List: ${newSymbols.join(' | ')} \n dateTime: ${new Date()}`

    await sendTelegram(mess)
}

function isTheSame(prevList, newList) {
    let a = prevList.map(obj => obj.symbol)
    let b = newList.map(obj => obj.symbol)
    // console.log(a, b)
    if (JSON.stringify(a.sort()) === JSON.stringify(b.sort())) {
        return true
    }
    else return false
}

async function candleStatistic(close, open, symbol) {

    return { symbol: symbol, priceChangePercent: (open * 100 / close - 100).toFixed(3) }
}
// getStats().then(data => {
//     console.log(data)
// })
//setInterval(botRunner, 15 * 60 * 1000);
try { botRunner() }
catch (e) { console.error(e) }
// candleStat('FRONTUSDT', 10).then(data => {
//     console.log(data)
// })

// dailyStat().then(data => {
//     console.log(data)
// })