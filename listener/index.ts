import { config as configDotenv } from 'dotenv'
import { resolve } from 'path'
import { dailyStat } from './helpers/symbols';
const Binance = require("node-binance-api");
const ws = require('ws');
const wss = new ws.Server({
    port: 3000,
}, () => console.log(`Server started on 3000`))

wss.on('connection', function connection(ws) {
    ws.on('message', function (message) {
        broadcastMessage(message)

    })
})

function broadcastMessage(message) {
    wss.clients.forEach(client => {
        client.send(message)
    })
}

class Listener {
    symbols: Array<string>
    symbolHistory: any
    percentChange: any
    tenMinutes: Array<string>
    fiveMinutes: Array<string>
    lastMinute: Array<string>
    observers: Array<string>

    constructor(symbols: Array<string>) {
        this.symbols = symbols
        this.symbolHistory = {}
        this.percentChange = {}
        this.fiveMinutes = []
        this.observers = []
        this.tenMinutes = []
        this.lastMinute = []
    }

    addStat(symbolChat: Record<string, any>, symbol: string) {
        const chart = Object.values(symbolChat)
        this.symbolHistory[symbol] = chart.slice(-15)
        let persentage = this.calculateChange(chart)
        this.percentChange[symbol] = persentage
        this.calculateLeaders(persentage, symbol)
        this.observers = this.calculateObservers()

    }

    calculateChange(chart) {
        let resPercentage = {}
        resPercentage[`priceChange${10}m`] = this.calculatePercent(chart.slice(-10))
        resPercentage[`priceChange${5}m`] = this.calculatePercent(chart.slice(-5))
        resPercentage[`priceChange${1}m`] = this.calculatePercent(chart.slice(-2))
        return resPercentage
    }

    calculatePercent(chart) {
        let high = parseFloat(chart[chart.length - 1].close)
        let low = parseFloat(chart[0].open)
        return (high * 100 / low - 100).toFixed(3)
    }

    calculateLeaders(persentage, symbol: string) {
        let listOf10 = []
        let listOf5 = []
        let listOf1 = []
        if (!this.tenMinutes.includes(symbol) && this.tenMinutes.length < 20 && parseFloat(persentage['priceChange10m']) > 0) {
            this.tenMinutes.push(symbol)
        }

        else if (this.tenMinutes.length === 20) {
            if (this.tenMinutes.includes(symbol)) {
                this.tenMinutes.splice(this.tenMinutes.indexOf(symbol), 1)
            }

            let more = []
            let less = []
            for (let i = 0; i < 19; i++) {
                let current = this.percentChange[this.tenMinutes[i]] //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange10m']) > parseFloat(current['priceChange10m'])) {
                    less.push(this.tenMinutes[i])
                }

                if (parseFloat(persentage['priceChange10m']) <= parseFloat(current['priceChange10m'])) {
                    more.push(this.tenMinutes[i])
                }
            }
            listOf10 = [...less, symbol, ...more]
            this.tenMinutes = listOf10.slice(-20)
        }

        if (!this.fiveMinutes.includes(symbol) && this.fiveMinutes.length < 10 && parseFloat(persentage['priceChange5m']) > 0) {
            this.fiveMinutes.push(symbol)
        }

        else if (this.fiveMinutes.length === 10) {
            if (this.fiveMinutes.includes(symbol)) {
                this.fiveMinutes.splice(this.fiveMinutes.indexOf(symbol), 1)
            }

            let more = []
            let less = []
            for (let i = 0; i < 9; i++) {
                let current = this.percentChange[this.fiveMinutes[i]] //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange5m']) > parseFloat(current['priceChange5m'])) {
                    less.push(this.fiveMinutes[i])
                }

                if (parseFloat(persentage['priceChange5m']) <= parseFloat(current['priceChange5m'])) {
                    more.push(this.fiveMinutes[i])
                }
            }
            listOf5 = [...less, symbol, ...more]
            this.fiveMinutes = listOf5.slice(-10)
        }

        if (!this.lastMinute.includes(symbol) && this.lastMinute.length < 5 && parseFloat(persentage['priceChange1m']) > 0) {
            this.lastMinute.push(symbol)
        }

        else if (this.lastMinute.length === 5) {
            if (this.lastMinute.includes(symbol)) {
                this.lastMinute.splice(this.lastMinute.indexOf(symbol), 1)
            }

            let more = []
            let less = []
            for (let i = 0; i < 4; i++) {
                let current = this.percentChange[this.lastMinute[i]] //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange1m']) > parseFloat(current['priceChange1m'])) {
                    less.push(this.lastMinute[i])
                }

                if (parseFloat(persentage['priceChange1m']) <= parseFloat(current['priceChange1m'])) {
                    more.push(this.lastMinute[i])
                }
            }
            listOf1 = [...less, symbol, ...more]
            this.lastMinute = listOf1.slice(-5)
        }

    }

    calculateObservers() {
        let observerSymbols = this.observers
        let newObservers = []
        for (let symbol of this.lastMinute) {
            if (this.tenMinutes.includes(symbol) && this.fiveMinutes.includes(symbol)) {
                newObservers.push(symbol)
            }
        }
        return newObservers
    }

}

async function chartCall() {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });
    const symbolsList = await dailyStat()
    let symbols = symbolsList.map(obj => obj.symbol)
    console.log(symbols)
    const symbolsListener = new Listener(symbols)
    binance.websockets.chart(symbols, "1m", async (symbol: string, interval, chart) => {
        //let tick = binance.last(chart);
        // const lastClose = chart[tick].close;
        // const lastOpen = chart[tick].open;
        //let res = await candleStat(Object.values(chart), symbol)
        // Optionally convert 'chart' object to array:
        // let ohlc = binance.ohlc(chart);
        // console.info(chart);
        symbolsListener.addStat(chart, symbol)
        broadcastMessage(symbolsListener.lastMinute.join('|'));


    }, 25);


}
console.log(`Child process is running`);
try {

    chartCall()
}
catch (err) { console.log(err) }