'use strict';

export type SubscribeCallback = (message: any) => void;
import {IPubSub, IPubSubTransport} from "./ipubsub";
import zlib = require('zlib');

export interface IBinaryPubSub extends IPubSub { };

/**
 * Which mode will BinaryPubSub wrapper will use.
 *  Buffer: messages objects in publish and subscribe functions are plain nodejs Buffers
 *  Object: messages are plain JS objects
 */
export enum BinaryPubSubMode {
    Buffer,
    Object
}

export class BinaryPubSub implements IBinaryPubSub {
    pubsub: IPubSubTransport;
    channel: string;

    mode: BinaryPubSubMode;
    incomingBinaries: any;

    constructor(pubsub: IPubSubTransport, mode: BinaryPubSubMode) {
        this.pubsub = pubsub;
        this.incomingBinaries = {};
        this.mode = mode;
    }

    async publish(message: any): Promise<any> {
        if (this.mode === BinaryPubSubMode.Buffer && !(message instanceof Buffer)) {
            throw new Error('Buffer instance is required for BinaryPubSub');
        }

        let buffer;
        if (this.mode === BinaryPubSubMode.Buffer) {
            buffer = message;
        } else {
            buffer = new Buffer(JSON.stringify(message, null, 0), 'utf8');
        }

        let compressedBuffer = zlib.gzipSync(buffer),
            compressedBase64 = compressedBuffer.toString('base64');

        let chunk = this.createChunk(),
            offset = 0,
            chunkSize,
            chunkNumber = 0;

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
            await this.pubsub.publish(chunk);

            offset += chunkSize;
            chunkNumber += 1;
        }
    }

    async subscribe(callback: SubscribeCallback): Promise<any> {
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

                    let compressedBase64 = binary.join(''),
                        compressedBuffer = new Buffer(compressedBase64, 'base64'),
                        buffer = zlib.unzipSync(compressedBuffer),
                        response;

                    if (this.mode === BinaryPubSubMode.Buffer) {
                        response = buffer;
                    } else {
                        response = JSON.parse(buffer.toString('utf8'));
                    }

                    callback(response);
                    return;
                }
            }

        });
    }

    unsubscribe() {
        this.pubsub.unsubscribe();
    }

    private createChunk(): any {
        let emptyChunkMessage = {
            id: Date.now(),
            data: '',
            n: 0
        };
        return emptyChunkMessage;
    }

}