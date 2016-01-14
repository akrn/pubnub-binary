'use strict';

import {IPubSubTransport} from "./ipubsub";
const Pusher = require('pusher');
const PusherClient = require('pusher-client');

type SubscribeCallback = (message: Object) => void;

export class PusherPubSub implements IPubSubTransport {
    channel: string;
    static pusher: any;
    static pusherClient: any;
    log: any;

    constructor(log: any, channel: string, settings: any) {
        this.channel = channel;
        this.log = log;

        if (!PusherPubSub.pusher) {
            PusherPubSub.pusher = new Pusher(settings);

            PusherPubSub.pusherClient = new PusherClient(settings.key, {
                encrypted: settings.encrypted
            });
            PusherPubSub.pusherClient.connection.bind('state_change', (states) => {
                log.info('Pusher client state: %s', states.current);
            });
        }
    }

    async publish(message: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            PusherPubSub.pusher.trigger(this.channel, 'message', message, null, (err, req, res) => {
                if (err) {
                    this.log.error('Pusher publish Error');
                    return reject(err);
                }
                resolve();
            });
        });
    }

    async subscribe(callback: SubscribeCallback): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            var channel = PusherPubSub.pusherClient.subscribe(this.channel);

            channel.bind('message', (message) => {
                callback(message);
            });
            resolve();
        });
    }

    unsubscribe() {
        this.log.info('Pusher unsubscribe');
        PusherPubSub.pusherClient.unsubscribe(this.channel);
        PusherPubSub.pusherClient.disconnect();
    }

    getChunkLimit(): number {
        return 10240;
    }

    getChunkSize(chunk: any): number {
        return JSON.stringify({
            "name": "message",
            "data": JSON.stringify(chunk),
            "channels": [this.channel]
        }).length;
    }
}
