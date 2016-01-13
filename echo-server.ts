/// <reference path='typings/node/node.d.ts' />
"use strict";

import {createPubSub, IPubSub} from './lib/ipubsub';
import fs = require('fs');
import * as util from 'util';

var pubSubSetup = require('./config').pubSubSetup;

// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_send : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_recv : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_recv);

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
                    console.error('Echo+MSG Unexpected answer',m, message);
                } else {
                    console.info(util.format('%s Echo+MSG: %s send #%s',
                        (new Date()).toISOString(), message.uuid, message._msgId));
                }
            })
            .catch((e) => console.log('Echo+Error sending message: ', e));

    });
}, 1000);
