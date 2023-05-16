export const Locations = ['亞洲', '歐洲', '北美洲', '大洋洲', '南美洲', '非洲', '南極洲'];

export const Types = ['交通', '住宿', '景點', '證件', '其他', '恐怖故事', '省錢妙招'];

export const ContinentMap = {
    asia: '亞洲',
    europe: '歐洲',
    'north-america': '北美洲',
    oceania: '大洋洲',
    'south-america': '南美洲',
    africa: '非洲',
    antarctica: '南極洲',
};

export const AlgoCoefficients = {
    readBoost: 1.05,
    likeBoost: 1.5,
    saveBoost: 4,
    commentBoost: 6,
    lastWeight: 0.8,
    timeDecayCoefficient: -0.01,
    newsfeedUpdateFrquency: 600000,
    initialMaxScore: 0.0001,
};

export const MaxUserPreferenceScore = 1.6;
export const UserPreferenceScoreDiff = 0.2;

export const BehaviorScore = {
    read: 1,
    like: 5,
    save: 10,
    comment: 20,
};

export const PageNumber = 10;

export const Behaviors = ['read', 'like', 'save', 'comment'];

export const HiddenPostFields = [
    'score',
    'new_read_num',
    'comment_num',
    'new_comment_num',
    'new_like_num',
    'new_save_num',
    'read_num',
    'save_num',
    'comments',
    'location.city',
    'dates.last_interact',
];
