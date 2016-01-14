'use strict';

export type SubscribeCallback = (message: any) => void;
import {MemoryPubSub} from "./memory.pubsub";
import {PubNubPubSub} from "./pubnub.pubsub";
import {PusherPubSub} from "./pusher.pubsub";

export interface IPubSub {
    channel: string;

    publish(message: any): Promise<any>;
    subscribe(callback: SubscribeCallback): Promise<any>;
    unsubscribe();
}

export interface IPubSubTransport extends IPubSub {
    getChunkLimit(): number;
    getChunkSize(chunk: any): number;
}

export function createPubSub(pubSubSetup: any, log: any, channelId: string): IPubSubTransport {
    if (pubSubSetup.pubsub === 'memory') {
        return new MemoryPubSub(log, channelId);
    } else if (pubSubSetup.pubsub === 'pubnub') {
        return new PubNubPubSub(log, channelId, pubSubSetup.pubnub);
    } else if (pubSubSetup.pubsub === 'pusher') {
		return new PusherPubSub(log, channelId, pubSubSetup.pusher);
    }
}