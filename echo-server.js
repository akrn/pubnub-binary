/// <reference path='typings/node/node.d.ts' />
"use strict";
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
var ipubsub_1 = require('./lib/ipubsub');
var util = require('util');
var pubSubSetup = require('./config').pubSubSetup;
// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_send = ipubsub_1.createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_recv = ipubsub_1.createPubSub(pubSubSetup, console, pubSubSetup.room_recv);
setTimeout(() => {
    // Awaiting connection
    // Subscribing
    pubsub_recv.subscribe((message) => {
        // Message will be a buffer if BinaryPubSubMode is set to Buffer
        let delay = (new Date()).getTime() - message.time;
        console.log(util.format('%s Echo+MSG: %s recv #%s delay:%s', (new Date()).toISOString(), message.uuid, message._msgId, delay));
        message.msgType = 'pong';
        pubsub_send.publish(message)
            .then((m) => {
            if (m[0] !== 1 || m[1] !== 'Sent') {
                console.error('Echo+MSG Unexpected answer', m, message);
            }
            else {
                console.info(util.format('%s Echo+MSG: %s send #%s', (new Date()).toISOString(), message.uuid, message._msgId));
            }
        })
            .catch((e) => console.log('Echo+Error sending message: ', e));
    });
}, 1000);
