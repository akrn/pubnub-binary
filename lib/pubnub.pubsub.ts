'use strict';

import {IPubSub} from "./ipubsub";
var PubNub = require("pubnub");

type SubscribeCallback = (message: Object) => void;

export class PubNubPubSub implements IPubSub {
    channel: string;
    static pubnub: any;
    log: any;



    constructor(log: any, channel: string, settings: any) {
        this.channel = channel;
        if (!PubNubPubSub.pubnub) {
            PubNubPubSub.pubnub = PubNub(settings);
        }
        this.log = log;

        PubNubPubSub.pubnub.time(
            function(time) {
                log.info('Confirm PubNub connection', time);
            }
        );
   }

    async publish(message: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            PubNubPubSub.pubnub.publish({
                channel: this.channel,
                message: message,
                callback: (m) => {
                    //this.log.info('PubNub published');
                    resolve(m);
                },
                error: (m) => {
                    this.log.error('PubNub publish Error');
                    reject(m);
                }
            });
        });
    }

    subscribe(callback: SubscribeCallback): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            PubNubPubSub.pubnub.subscribe({
                channel: this.channel,
                message: (message, env, channel) => {
                    // this.log.info('PubNub received', {message: message});
                    callback(message);
                },
                connect: () => {
                    this.log.info('PubNub subscribe Connected');
                    resolve();
                },
                disconnect: () =>
                    this.log.info('PubNub subscribe Disconnected'),
                reconnect: () =>
                    this.log.info('PubNub subscribe Reconnected'),
                error: (e) => {
                    this.log.error('PubNub subscribe - Network Error', e);
                    reject(e);
                },
                restore: true,
            });
        });
    }

    unsubscribe() {
        this.log.info('PubNub unsubscribe'),
            PubNubPubSub.pubnub.unsubscribe({
            channel : this.channel,
        });
    }
}