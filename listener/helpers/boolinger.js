const boll = require("bollinger-bands");
const axios = require("axios");
const { redisGetAsync, redisSetAsync } = require("./redis");
const { Telegraf } = require('telegraf')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)


async function makeOrder(last) {
    try {
        const res = await axios({
            method: "get",
            url: `http://worker:3000/api/trade?last=${last}`,
        });

    } catch (e) {
        console.log(e);
    }
}

async function callBollinger(symbol, data, last) {
    let trade = await redisGetAsync(`${symbol}-trade`)
    if (trade !== 0 && trade !== null) {
        await trading(last, trade, symbol)
        return '---trade in process ---'
    }

    const bollingerChart = boll(data.close, 2, 2);

    if (last >= bollingerChart.upper[bollingerChart.upper.length - 2] && data[data.length - 3] < bollingerChart.mid[bollingerChart.mid.length - 4]) {
        let low = data.low.reduce(function (a, b) { return (a + b) })
        let high = data.high.reduce(function (a, b) { return (a + b) })
        const volatility = parseFloat((high - low) / 50).toString().slice(0, last.toString().length)
        await redisSetAsync(`${symbol}-volatility`, volatility)
        await redisSetAsync(`${symbol}-trade`, last)
        await redisSetAsync(`${symbol}-stop`, last - volatility)
        await bot.telegram.sendMessage('@PahaNakrutka', `${symbol} || ${last}`)
        return '------- trading ----------'
    }
    else return `no sygnal for trading ${symbol}: ${last}`

}

async function trading(last, trade, symbol) {
    let stop = await redisGetAsync(`${symbol}-stop`)
    if (last > trade) {
        let volatility = await redisGetAsync(`${symbol}-volatility`)
        stop = await redisSetAsync(`${symbol}-stop`, last - volatility)
    }
    else if (last <= stop) {
        await redisSetAsync(`${symbol}-trade`, 0)
        let bank = await redisGetAsync(`${symbol}-bank`)
        bank !== null ? bank : 0
        await redisSetAsync(`${symbol}-bank`, bank + trade - stop)
        await bot.telegram.sendMessage('@PahaNakrutka', `${symbol} || куплено за ${trade} || продано за ${stop}|| ${bank} money in the bank`)

    }

}

async function sendTelegram(str) {
    await bot.telegram.sendMessage('@PahaNakrutka', `${str}`)
}


module.exports = { callBollinger, makeOrder, sendTelegram }