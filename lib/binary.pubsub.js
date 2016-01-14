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
var zlib = require('zlib');
;
/**
 * Which mode will BinaryPubSub wrapper will use.
 *  Buffer: messages objects in publish and subscribe functions are plain nodejs Buffers
 *  Object: messages are plain JS objects
 */
(function (BinaryPubSubMode) {
    BinaryPubSubMode[BinaryPubSubMode["Buffer"] = 0] = "Buffer";
    BinaryPubSubMode[BinaryPubSubMode["Object"] = 1] = "Object";
})(exports.BinaryPubSubMode || (exports.BinaryPubSubMode = {}));
var BinaryPubSubMode = exports.BinaryPubSubMode;
class BinaryPubSub {
    constructor(pubsub, mode) {
        this.pubsub = pubsub;
        this.incomingBinaries = {};
        this.mode = mode;
    }
    publish(message) {
        return __awaiter(this, void 0, Promise, function* () {
            if (this.mode === BinaryPubSubMode.Buffer && !(message instanceof Buffer)) {
                throw new Error('Buffer instance is required for BinaryPubSub');
            }
            let buffer;
            if (this.mode === BinaryPubSubMode.Buffer) {
                buffer = message;
            }
            else {
                buffer = new Buffer(JSON.stringify(message, null, 0), 'utf8');
            }
            let compressedBuffer = zlib.gzipSync(buffer), compressedBase64 = compressedBuffer.toString('base64');
            let chunk = this.createChunk(), offset = 0, chunkSize, chunkNumber = 0;
            while (offset <= compressedBase64.length) {
                chunkSize = this.pubsub.getChunkLimit();
                do {
                    // Substract 1KB each time chunk is greater then allowed size
                    chunkSize -= 1000;
                    chunk.data = compressedBase64.slice(offset, offset + chunkSize);
                } while (this.pubsub.getChunkSize(chunk) >= this.pubsub.getChunkLimit());
                if (offset + chunkSize > compressedBase64.length) {
                    // This is the last chunk, add termination flag
                    chunk.t = 1;
                }
                chunk.n = chunkNumber;
                // Publish each chunk synchronously
                yield this.pubsub.publish(chunk);
                offset += chunkSize;
                chunkNumber += 1;
            }
        });
    }
    subscribe(callback) {
        return __awaiter(this, void 0, Promise, function* () {
            this.pubsub.subscribe((message) => {
                if (!('id' in message)) {
                    // Unsupported message
                    return;
                }
                if (!(message.id in this.incomingBinaries)) {
                    // New binary data is coming
                    this.incomingBinaries[message.id] = [];
                }
                if ('t' in message) {
                    this.incomingBinaries[message.id].terminating = true;
                }
                if ('data' in message) {
                    // Next chunk
                    this.incomingBinaries[message.id][message.n] = message.data;
                    if (this.incomingBinaries[message.id].some((el) => (typeof el == 'undefined'))) {
                        // If some parts of the message are still not received - return and wait for them
                        // (even if termination flag is received)
                        return;
                    }
                    if (this.incomingBinaries[message.id].terminating) {
                        // Termination flag has been received and all chunks are here
                        let binary = this.incomingBinaries[message.id];
                        delete this.incomingBinaries[message.id];
                        let compressedBase64 = binary.join(''), compressedBuffer = new Buffer(compressedBase64, 'base64'), buffer = zlib.unzipSync(compressedBuffer), response;
                        if (this.mode === BinaryPubSubMode.Buffer) {
                            response = buffer;
                        }
                        else {
                            response = JSON.parse(buffer.toString('utf8'));
                        }
                        callback(response);
                        return;
                    }
                }
            });
        });
    }
    unsubscribe() {
        this.pubsub.unsubscribe();
    }
    createChunk() {
        let emptyChunkMessage = {
            id: Date.now(),
            data: '',
            n: 0
        };
        return emptyChunkMessage;
    }
}
exports.BinaryPubSub = BinaryPubSub;
