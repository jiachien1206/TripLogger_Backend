import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();
const client = new Client({ node: process.env.ES_HOST });

export default client;
