const Binance = require("node-binance-api");

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
        resPercentage[`priceChange${1}m`] = this.calculatePercent(chart.slice(-1))
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

async function chartCall(symbols: Array<string>) {
    const binance = new Binance().options({
        APIKEY: process.env.APIKEY,
        APISECRET: process.env.APISECRET,
    });
    const symbolsListener = new Listener(symbols)
    binance.websockets.chart(symbols, "1m", async (symbol, interval, chart) => {
        let tick = binance.last(chart);
        // const lastClose = chart[tick].close;
        // const lastOpen = chart[tick].open;
        //let res = await candleStat(Object.values(chart), symbol)
        // Optionally convert 'chart' object to array:
        // let ohlc = binance.ohlc(chart);
        // console.info(chart);
        symbolsListener.addStat(chart, symbol)
        console.log(symbolsListener.observers, '0000000000')

        console.log(symbolsListener.lastMinute, '111111111111')


    }, 25);


}
console.log(`Child process is running`);
try {
    chartCall(['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'NEOUSDT',
        'LTCUSDT', 'ADAUSDT', 'XRPUSDT', 'EOSUSDT',
        'TUSDUSDT', 'TRXUSDT', 'ETCUSDT', 'VETUSDT',
        'USDCUSDT', 'LINKUSDT', 'WAVESUSDT', 'BTTUSDT',
        'THETAUSDT', 'MATICUSDT', 'ATOMUSDT', 'ONEUSDT',
        'FTMUSDT', 'ALGOUSDT', 'DOGEUSDT', 'CHZUSDT',
        'BUSDUSDT', 'KAVAUSDT', 'BCHUSDT', 'EURUSDT',
        'SOLUSDT', 'KNCUSDT', 'LRCUSDT', 'MANAUSDT',
        'CRVUSDT', 'SANDUSDT', 'DOTUSDT', 'LUNAUSDT',
        'EGLDUSDT', 'RUNEUSDT', 'UMAUSDT', 'UNIUSDT',
        'AVAXUSDT', 'AAVEUSDT', 'NEARUSDT', 'FILUSDT',
        'AXSUSDT', 'ROSEUSDT', 'BTCSTUSDT', 'ALICEUSDT',
        'SLPUSDT', 'SHIBUSDT', 'ICPUSDT', 'DYDXUSDT',
        'GALAUSDT', 'BETAUSDT', 'PEOPLEUSDT', 'USTUSDT',
        'API3USDT', 'TUSDT'])
}
catch (err) { console.log(err) }