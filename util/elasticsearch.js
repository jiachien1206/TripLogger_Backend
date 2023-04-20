import dotenv from 'dotenv';
dotenv.config();
import { URL } from 'url';
import { Client } from '@elastic/elasticsearch';
const esHost = process.env.ES_HOST;
console.log(esHost == 'http://152.67.209.195:9205');
const client = new Client({ node: esHost });

export default client;
