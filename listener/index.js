const Binance = require("node-binance-api");
const util = require("util");
const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.APISECRET,
});
const { redisGetAsync, redisSetAsync } = require("./helpers/redis");
const { callBollinger } = require("./helpers/boolinger");

async function chart() {
  binance.websockets.chart(
    ["CHESSUSDT", "EGLDUSDT", "FRONTUSDT", "COCOSUSDT"],
    "1m",
    async (symbol, interval, chart) => {
      let tick = binance.last(chart);
      const last = chart[tick].close;
      //console.info(symbol);
      // // Optionally convert 'chart' object to array:
      let ohlc = binance.ohlc(chart);
      //console.log(ohlc)
      // searching for trade sygnal
      let res = await callBollinger(symbol, ohlc, last)
      console.log(res)

      await redisSetAsync(symbol, last)
      let money = await redisGetAsync(`${symbol}-bank`)
      money = money !== null ? money : 0;
      console.log(money, `money in the bank of ${symbol}`);
    },
    50
  );
}

chart();
