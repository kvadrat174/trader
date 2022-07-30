const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:5000');

ws.on('open', () => {
    console.log('socket is open')
});

ws.on('message', data => {
    console.log(data)
})

ws.on('error', error => console.log(error))

// const wsCombined = new WebSocket('wss://stream.binance.com:9443/stream?streams=achusdt@kline_1m/oneusdt@kline_1m');

// wsCombined.on('open', () => {
//     console.log('socket combined is open')
// });


// wsCombined.on('message', data => {
//     try {
//         let response = JSON.parse(data);
//         let { e: eventType, E: eventTime, s: symbol, k: ticks } = response.data;
//         let { o: open, h: high, l: low, c: close, v: volume, n: trades, i: interval, x: isFinal, q: quoteVolume, V: buyVolume, Q: quoteBuyVolume } = ticks;
//         console.log(response.data)
//         console.log(new Date().getTime())
//         // console.log(eventTime, 'event time')
//         // console.info(symbol + " " + interval + " candlestick update");
//         // console.info("open: " + open);
//         // console.info("high: " + high);
//         // console.info("low: " + low);
//         // console.info("close: " + close);
//         // console.info("volume: " + volume);
//         // console.info("isFinal: " + isFinal);

//     } catch (error) {
//         console.log('Parse error: ' + error.message);
//     }
// })

// wsCombined.send(JSON.stringify({
//     "method": "LIST_SUBSCRIPTIONS",
//     "id": 33
// }))

