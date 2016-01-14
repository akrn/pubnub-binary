/// <reference path='typings/node/node.d.ts' />
"use strict";

import {createPubSub, IPubSub} from './lib/ipubsub';
import {BinaryPubSub, BinaryPubSubMode} from './lib/binary.pubsub';
import fs = require('fs');

// Create IPubSub object and wrap it with BinaryPubSub wrapper
var pubSubSetup = require('./config').pubSubSetup;

// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_recv = createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_recv_binary: IPubSub = new BinaryPubSub(pubsub_recv, BinaryPubSubMode.Object);
let pubsub_send = createPubSub(pubSubSetup, console, pubSubSetup.room_recv);
let pubsub_send_binary: IPubSub = new BinaryPubSub(pubsub_send, BinaryPubSubMode.Object);

setTimeout(() => {
    // Awaiting connection

    // Subscribing
    pubsub_recv_binary.subscribe((message) => {
        // Message will be a buffer if BinaryPubSubMode is set to Buffer
        fs.writeFileSync('./received_file', new Buffer(message.file, 'base64'));
        console.log('+MSG: Saved to ./received_file');

        // Unsubscribe
        pubsub_recv_binary.unsubscribe();
    });

    // Sending a message after a small timeout
    setTimeout(() => {
        let fileName = process.argv[2];
        if (!fileName) {
            console.log('+ERR: No file specified. Specify a binary file as the first argument');
            process.exit(1);
        }
        console.log('Sending a file ', fileName);
        let buffer = fs.readFileSync(fileName),
            message = {
                key: 'value',
                file: buffer.toString('base64')
            };

        pubsub_send_binary.publish(message)
            .then(() => console.log('Message sent'))
            .catch((e) => console.log('Error sending message: ', e));
    }, 1000);

}, 1000);
