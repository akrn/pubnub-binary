'use strict';
var pubnub_pubsub_1 = require("./pubnub.pubsub");
var pusher_pubsub_1 = require("./pusher.pubsub");
function createPubSub(pubSubSetup, log, channelId) {
    if (pubSubSetup.pubsub === 'pubnub') {
        return new pubnub_pubsub_1.PubNubPubSub(log, channelId, pubSubSetup.pubnub);
    }
    else if (pubSubSetup.pubsub === 'pusher') {
        return new pusher_pubsub_1.PusherPubSub(log, channelId, pubSubSetup.pusher);
    }
}
exports.createPubSub = createPubSub;
