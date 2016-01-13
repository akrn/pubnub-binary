'use strict';

import {IPubSub} from "./ipubsub";
const Pusher = require('pusher');
const PusherClient = require('pusher-client');

type SubscribeCallback = (message: Object) => void;

export class PusherPubSub implements IPubSub {
    channel: string;
    static pusher: any;
    static pusherClient: any;
    log: any;

    constructor(log: any, channel: string, settings: any) {
        this.channel = channel;
        if (!PusherPubSub.pusher) {
            PusherPubSub.pusher = new Pusher(settings);

            PusherPubSub.pusherClient = new PusherClient(settings.key, {
                encrypted: settings.encrypted
            });
            PusherPubSub.pusherClient.connection.bind('state_change', (states) => {
                console.log('Pusher client state: %s', states.current);
            });
        }
        this.log = log;
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
        this.log.info('Pusher unsubscribe'),
        PusherPubSub.pusher.unsubscribe(this.channel);
    }
}