'use strict';

import {IPubSub, SubscribeCallback} from "./ipubsub";

interface ChannelsCallbacks {
    [index: string]: SubscribeCallback;
}

export class MemoryPubSub implements IPubSub {
    public static channelsCallbacks : ChannelsCallbacks = {};

    channel: string;
    log: any;

    constructor(log: any, channel: string) {
        this.log = log;
        this.channel = channel;
    }

    async publish(message: any): Promise<any> {
        if (MemoryPubSub.channelsCallbacks[this.channel]) {
            this.log.info('PubSub publish', {message: message} );
            MemoryPubSub.channelsCallbacks[this.channel](message);
        }
    }

    async subscribe(callback: SubscribeCallback): Promise<any> {
        if (MemoryPubSub.channelsCallbacks[this.channel]) {
            throw new Error('');
        }
        MemoryPubSub.channelsCallbacks[this.channel] = callback;
    }

    unsubscribe() {
        delete MemoryPubSub.channelsCallbacks[this.channel];
    }

    getChunkLimit(): number {
        return 10 * 1024 * 1024;
    }

    getChunkSize(chunk: any): number {
        return JSON.stringify(chunk).length;
    }

}