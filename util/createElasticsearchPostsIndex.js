import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import Es from './elasticsearch.js';

const setIndex = async () => {
    try {
        const response = await Es.indices.create({
            index: process.env.ES_INDEX,
            body: {
                mappings: {
                    properties: {
                        id: { type: 'text' },
                        title: {
                            type: 'text',
                            analyzer: 'my_chinese_analyzer',
                        },
                        content: {
                            type: 'text',
                            analyzer: 'my_chinese_analyzer',
                        },
                    },
                },
                settings: {
                    analysis: {
                        char_filter: {
                            stconvert: {
                                type: 'stconvert',
                                delimiter: '#',
                                keep_both: false,
                                convert_type: 't2s',
                            },
                        },
                        tokenizer: {
                            ik_smart: {
                                type: 'ik_smart',
                            },
                        },
                        filter: {
                            stconvert: {
                                type: 'stconvert',
                                delimiter: '#',
                                keep_both: false,
                                convert_type: 's2t',
                            },
                        },
                        analyzer: {
                            my_chinese_analyzer: {
                                type: 'custom',
                                char_filter: ['stconvert'],
                                tokenizer: 'ik_smart',
                                filter: ['stconvert'],
                            },
                        },
                    },
                },
            },
        });
        console.log(response);
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

setIndex();
