import dotenv from 'dotenv';
dotenv.config();
import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: env.process.ES_HOST });

export default client;
