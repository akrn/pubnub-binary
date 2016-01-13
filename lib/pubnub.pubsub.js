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
var PubNub = require("pubnub");
class PubNubPubSub {
    constructor(log, channel, settings) {
        this.channel = channel;
        if (!PubNubPubSub.pubnub) {
            PubNubPubSub.pubnub = PubNub(settings);
        }
        this.log = log;
        PubNubPubSub.pubnub.time(function (time) {
            log.info('Confirm PubNub connection', time);
        });
    }
    publish(message) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
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
        });
    }
    subscribe(callback) {
        return new Promise((resolve, reject) => {
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
                disconnect: () => this.log.info('PubNub subscribe Disconnected'),
                reconnect: () => this.log.info('PubNub subscribe Reconnected'),
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
                channel: this.channel,
            });
    }
}
exports.PubNubPubSub = PubNubPubSub;
