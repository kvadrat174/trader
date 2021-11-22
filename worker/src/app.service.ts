import { Injectable } from '@nestjs/common';
import Binance from 'node-binance-api';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async startTrading(data) {
    const binance = new Binance().options({
      APIKEY:
        'RoK4CEC1qHMwSzVQjZtlRp7ve7AjHVlNmXTPPRw6zMzlWlSEjLZkyXEDqistkECw',
      APISECRET:
        '5OJxNLJXMC0rkIHdFz3OsmVWGE2SGdTacjK8olpw9a9V78FpMwTK9XRWLT6cpekF',
    });
    try {
      const res = await binance.prices('BNBBTC');
      return res;
    } catch (error) {
      return error;
    }
  }
}
