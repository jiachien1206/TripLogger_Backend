import { Client } from '@elastic/elasticsearch';
const client = new Client({ node: 'http://152.67.209.195:9205' });

export default client;
