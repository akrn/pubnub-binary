/// <reference path='typings/node/node.d.ts' />
"use strict";

import {createPubSub, IPubSub} from './lib/ipubsub';
import fs = require('fs');
import * as util from 'util';

var pubSubSetup = require('./config').pubSubSetup;

// Create IPubSub object and wrap it with BinaryPubSub wrapper
let pubsub_recv : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_send);
let pubsub_send : IPubSub = createPubSub(pubSubSetup, console, pubSubSetup.room_recv);

let uuid = generate_short_id();
let idSent = [];


setTimeout(() => {
    // Awaiting connection

    // Subscribing
    pubsub_recv.subscribe((message) => {
        // Message will be a buffer if BinaryPubSubMode is set to Buffer
        let delay = (new Date()).getTime() - message.time;
        console.log(util.format('%s Client+MSG: %s recv #%s delay:%s - %s', (new Date()).toISOString(), message.uuid, message._msgId, delay, idSent));
        let msgIndex = idSent.indexOf(message._msgId);

        if (idSent.length === 0 ||
            msgIndex === -1 ||
            message.uuid != uuid) {

            console.error(util.format('%s Client+MSG: %s recv #%s != %s Unexpected message Id, ', (new Date()).toISOString(), message.uuid, message._msgId, idSent[0], idSent));
        } else {
            idSent.splice(msgIndex, 1);
        }

    });

    runTest()
    .then(() => console.log('Client+Test done'))
    .catch((err) => console.error('Client+Test done', err.stack));

}, 1000);


async function pause(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            resolve();
        }, delay);
    });
}

function generate_short_id() {
    var u = 'xxxxx'.replace(/[xy]/g,
        function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    return u;
}


async function sendPing(i) {
    let message = {
        time: (new Date()).getTime(),
        uuid: uuid,
        _msgId: i,
        msgType: 'ping',
    };

    console.log('%s Client+MSG: %s send #%s', (new Date()).toISOString(), message.uuid, message._msgId);
    idSent.push(i);
    await pubsub_send.publish(message);
    return message;
}

async function runTest() {
    for (let j=0; j<10; j++) {
        for (let i = 0; i < 10; i++) {
            let msgId = j * 1000 + i * 2;
            await pause(2000);
            var message = sendPing(msgId);
            var message = sendPing(msgId + 1);
            //var message = sendPing(msgId + 2);
            //var message = sendPing(msgId + 3);
        }
        console.log('Pause 3 min before next batch');
        await pause(3 * 60000);
    }
}
