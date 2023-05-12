import { BehaviorScore } from '../constants.js';
import Cache from './cache.js';
import { isEvenTime } from './util.js';

class GuestBehaviorProcessor {
    constructor(postId, behavior) {
        this.postId = postId;
        this.behavior = behavior;
    }

    async addNum(num) {
        await Cache.hincrby(`posts:${this.behavior}-num`, this.postId, num);
    }
}

class MemberBehaviorProcessor extends GuestBehaviorProcessor {
    constructor(postId, behavior, userId, location, type, isPositive) {
        super(postId, behavior);
        this.userId = userId;
        this.location = location;
        this.type = type;
        this.isPositive = isPositive;
        this.time = isEvenTime() ? 'e' : 'o';
    }

    async processNumberScore() {
        this.addNum(this.isPositive ? 1 : -1);
        await Cache.hincrby(
            `user-scores-${this.time}-${this.userId}`,
            `${this.location}`,
            BehaviorScore[this.behavior] * (this.isPositive ? 1 : -1)
        );
        await Cache.hincrby(
            `user-scores-${this.time}-${this.userId}`,
            `${this.type}`,
            BehaviorScore[this.behavior] * (this.isPositive ? 1 : -1)
        );
    }
}

export { GuestBehaviorProcessor, MemberBehaviorProcessor };
