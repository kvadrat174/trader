//const config = require('../config/index');
const redis = require("redis");
const RedisClient = redis.createClient({
  host: "redis",
  port: 6379,
});
const { promisify } = require("util");
const redisGetAsync = promisify(RedisClient.get).bind(RedisClient);
const redisSetAsync = promisify(RedisClient.set).bind(RedisClient);

RedisClient.on("error", function (err) {
  console.error("Error redis " + err);
});

module.exports = { redisGetAsync, redisSetAsync };
