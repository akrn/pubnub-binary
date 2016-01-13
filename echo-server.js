/// <reference path='typings/node/node.d.ts' />
"use strict";
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
            .then(() => {
            console.info(util.format('%s Echo+MSG: %s send #%s', (new Date()).toISOString(), message.uuid, message._msgId));
        })
            .catch((e) => console.log('Echo+Error sending message: ', e));
    }).catch((e) => console.log('Echo+Error subscribing'));
}, 1000);
