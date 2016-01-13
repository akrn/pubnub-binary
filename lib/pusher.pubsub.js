'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
const Pusher = require('pusher');
const PusherClient = require('pusher-client');
class PusherPubSub {
    constructor(log, channel, settings) {
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
    publish(message) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                PusherPubSub.pusher.trigger(this.channel, 'message', message, null, (err, req, res) => {
                    if (err) {
                        this.log.error('Pusher publish Error');
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }
    subscribe(callback) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                var channel = PusherPubSub.pusherClient.subscribe(this.channel);
                channel.bind('message', (message) => {
                    callback(message);
                });
                resolve();
            });
        });
    }
    unsubscribe() {
        this.log.info('Pusher unsubscribe'),
            PusherPubSub.pusher.unsubscribe(this.channel);
    }
}
exports.PusherPubSub = PusherPubSub;
