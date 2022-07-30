var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var Binance = require("node-binance-api");
var Listener = /** @class */ (function () {
    function Listener(symbols) {
        this.symbols = symbols;
        this.symbolHistory = {};
        this.percentChange = {};
        this.fiveMinutes = [];
        this.observers = [];
        this.tenMinutes = [];
        this.lastMinute = [];
    }
    Listener.prototype.addStat = function (symbolChat, symbol) {
        var chart = Object.values(symbolChat);
        this.symbolHistory[symbol] = chart.slice(-15);
        var persentage = this.calculateChange(chart);
        this.percentChange[symbol] = persentage;
        this.calculateLeaders(persentage, symbol);
        this.observers = this.calculateObservers();
    };
    Listener.prototype.calculateChange = function (chart) {
        var resPercentage = {};
        resPercentage["priceChange".concat(10, "m")] = this.calculatePercent(chart.slice(-10));
        resPercentage["priceChange".concat(5, "m")] = this.calculatePercent(chart.slice(-5));
        resPercentage["priceChange".concat(1, "m")] = this.calculatePercent(chart.slice(-1));
        return resPercentage;
    };
    Listener.prototype.calculatePercent = function (chart) {
        var high = parseFloat(chart[chart.length - 1].close);
        var low = parseFloat(chart[0].open);
        return (high * 100 / low - 100).toFixed(3);
    };
    Listener.prototype.calculateLeaders = function (persentage, symbol) {
        var listOf10 = [];
        var listOf5 = [];
        var listOf1 = [];
        if (!this.tenMinutes.includes(symbol) && this.tenMinutes.length < 20 && parseFloat(persentage['priceChange10m']) > 0) {
            this.tenMinutes.push(symbol);
        }
        else if (this.tenMinutes.length === 20) {
            if (this.tenMinutes.includes(symbol)) {
                this.tenMinutes.splice(this.tenMinutes.indexOf(symbol), 1);
            }
            var more = [];
            var less = [];
            for (var i = 0; i < 19; i++) {
                var current = this.percentChange[this.tenMinutes[i]]; //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange10m']) > parseFloat(current['priceChange10m'])) {
                    less.push(this.tenMinutes[i]);
                }
                if (parseFloat(persentage['priceChange10m']) <= parseFloat(current['priceChange10m'])) {
                    more.push(this.tenMinutes[i]);
                }
            }
            listOf10 = __spreadArray(__spreadArray(__spreadArray([], less, true), [symbol], false), more, true);
            this.tenMinutes = listOf10.slice(-20);
        }
        if (!this.fiveMinutes.includes(symbol) && this.fiveMinutes.length < 10 && parseFloat(persentage['priceChange5m']) > 0) {
            this.fiveMinutes.push(symbol);
        }
        else if (this.fiveMinutes.length === 10) {
            if (this.fiveMinutes.includes(symbol)) {
                this.fiveMinutes.splice(this.fiveMinutes.indexOf(symbol), 1);
            }
            var more = [];
            var less = [];
            for (var i = 0; i < 9; i++) {
                var current = this.percentChange[this.fiveMinutes[i]]; //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange5m']) > parseFloat(current['priceChange5m'])) {
                    less.push(this.fiveMinutes[i]);
                }
                if (parseFloat(persentage['priceChange5m']) <= parseFloat(current['priceChange5m'])) {
                    more.push(this.fiveMinutes[i]);
                }
            }
            listOf5 = __spreadArray(__spreadArray(__spreadArray([], less, true), [symbol], false), more, true);
            this.fiveMinutes = listOf5.slice(-10);
        }
        if (!this.lastMinute.includes(symbol) && this.lastMinute.length < 5 && parseFloat(persentage['priceChange1m']) > 0) {
            this.lastMinute.push(symbol);
        }
        else if (this.lastMinute.length === 5) {
            if (this.lastMinute.includes(symbol)) {
                this.lastMinute.splice(this.lastMinute.indexOf(symbol), 1);
            }
            var more = [];
            var less = [];
            for (var i = 0; i < 4; i++) {
                var current = this.percentChange[this.lastMinute[i]]; //значение процента для каждого символа в массиве
                if (parseFloat(persentage['priceChange1m']) > parseFloat(current['priceChange1m'])) {
                    less.push(this.lastMinute[i]);
                }
                if (parseFloat(persentage['priceChange1m']) <= parseFloat(current['priceChange1m'])) {
                    more.push(this.lastMinute[i]);
                }
            }
            listOf1 = __spreadArray(__spreadArray(__spreadArray([], less, true), [symbol], false), more, true);
            this.lastMinute = listOf1.slice(-5);
        }
    };
    Listener.prototype.calculateObservers = function () {
        var observerSymbols = this.observers;
        var newObservers = [];
        for (var _i = 0, _a = this.lastMinute; _i < _a.length; _i++) {
            var symbol = _a[_i];
            if (this.tenMinutes.includes(symbol) && this.fiveMinutes.includes(symbol)) {
                newObservers.push(symbol);
            }
        }
        return newObservers;
    };
    return Listener;
}());
function chartCall(symbols) {
    return __awaiter(this, void 0, void 0, function () {
        var binance, symbolsListener;
        var _this = this;
        return __generator(this, function (_a) {
            binance = new Binance().options({
                APIKEY: process.env.APIKEY,
                APISECRET: process.env.APISECRET
            });
            symbolsListener = new Listener(symbols);
            binance.websockets.chart(symbols, "1m", function (symbol, interval, chart) { return __awaiter(_this, void 0, void 0, function () {
                var tick;
                return __generator(this, function (_a) {
                    tick = binance.last(chart);
                    // const lastClose = chart[tick].close;
                    // const lastOpen = chart[tick].open;
                    //let res = await candleStat(Object.values(chart), symbol)
                    // Optionally convert 'chart' object to array:
                    // let ohlc = binance.ohlc(chart);
                    // console.info(chart);
                    symbolsListener.addStat(chart, symbol);
                    console.log(symbolsListener.observers, '0000000000');
                    console.log(symbolsListener.lastMinute, '111111111111');
                    return [2 /*return*/];
                });
            }); }, 25);
            return [2 /*return*/];
        });
    });
}
console.log("Child process is running");
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
        'API3USDT', 'TUSDT']);
}
catch (err) {
    console.log(err);
}
