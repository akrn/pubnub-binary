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
class MemoryPubSub {
    constructor(log, channel) {
        this.log = log;
        this.channel = channel;
    }
    publish(message) {
        return __awaiter(this, void 0, Promise, function* () {
            if (MemoryPubSub.channelsCallbacks[this.channel]) {
                this.log.info('PubSub publish', { message: message });
                MemoryPubSub.channelsCallbacks[this.channel](message);
            }
        });
    }
    subscribe(callback) {
        return __awaiter(this, void 0, Promise, function* () {
            if (MemoryPubSub.channelsCallbacks[this.channel]) {
                throw new Error('');
            }
            MemoryPubSub.channelsCallbacks[this.channel] = callback;
        });
    }
    unsubscribe() {
        delete MemoryPubSub.channelsCallbacks[this.channel];
    }
    getChunkLimit() {
        return 10 * 1024 * 1024;
    }
    getChunkSize(chunk) {
        return JSON.stringify(chunk).length;
    }
}
MemoryPubSub.channelsCallbacks = {};
exports.MemoryPubSub = MemoryPubSub;
