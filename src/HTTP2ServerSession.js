import logd from 'logd';
import EventEmitter from 'events'
import { HTTP2Stream } from '@distributed-systems/http2-lib';

const log = logd.module('HTTP2ServerSession');



export default class HTTP2ServerSession extends EventEmitter {

    constructor(session, {
        HTTP2Request,
        HTTP2Response,
        timeout = 60* 1000
    }) {
        super();

        this.session = session;
        this.session.setTimeout(timeout);

        this.HTTP2Request = HTTP2Request;
        this.HTTP2Response = HTTP2Response;

        this.session.once('timeout', () => {
            this.end();
        });

        this.session.on('stream', (stream, headers) => {
            this._handleStream(stream, headers);
        });

        this.session.once('close', () => {
            this._handleDestroyedSession();
        });
        
        this.session.once('error', (err) => {
            this._handleDestroyedSession(err);
        });
        
        this.session.once('goaway', () => {
            log.debug('The session has ended due to a goaway frame');
            this._handleDestroyedSession();
        });
    }


    /**
     * Handle sessions that are destroyed
     * 
     * @param {Error} err 
     */
    _handleDestroyedSession(err) {
        if (err) {
            log.error(`Session error: ${err.message}`, err);
            this.emit('error', err);
        }

        this.emit('close');
        this._end(err);
    }


    /**
     * clean up events in preparation for the session termination
     */
    _end(err) {
        // make sure no events are handled anymore
        this.session.removeAllListeners();

        // tell the outside that the stream has ended
        this.emit('end', err);

        // remove all event handlers
        this.removeAllListeners();

        // remove all references
        this.session = null;
        this.HTTP2Request = null;
        this.HTTP2Response = null;
    }


    /** 
     * handles an incoming stream
     * 
     * @param {stream} stream
     */
    _handleStream(stream, headers) {
        const http2Stream = new HTTP2Stream(stream);
        const response = new this.HTTP2Response(http2Stream);
        const request = new this.HTTP2Request(http2Stream, headers, response);

        this.emit('request', request);
    }


    /**
     * actively close the session
     */
    end() {
        this.session.close();
    }
}