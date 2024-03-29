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
        this.session.setTimeout(0);

        this.HTTP2Request = HTTP2Request;
        this.HTTP2Response = HTTP2Response;

        this.session.once('timeout', () => {
            log.debug('The session has ended due to a timeout');
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
        });


        // since node is telling me that i'm adding more than
        // 10 goaway handlers to one session i need ot track this
        // since i dont have an explanation for this
        if (this.session.listenerCount('goaway') > 1) {
            log.warn('[Server] Session has more than one goaway handler which is plain wrong!');
        }
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
        const http2Stream = new HTTP2Stream(stream, `Server: ${headers[':method']} ${headers[':path']}`);
        const response = new this.HTTP2Response(http2Stream);
        const request = new this.HTTP2Request(http2Stream, headers, response);

        response.once('error', (err) => {
            log.warn(`[Server Reponse ${headers[':method']} ${headers[':path']}] Error: ${err.message}`, err);
        });

        request.once('error', (err) => {
            log.warn(`[Server Request ${headers[':method']} ${headers[':path']}] Error: ${err.message}`, err);
        });

        this.emit('request', request);
    }


    /**
     * actively close the session
     */
    end() {
        this.session.close();
    }
}