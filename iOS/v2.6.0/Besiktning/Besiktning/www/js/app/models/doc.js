/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, 
         bitwise:true, strict:true, undef:false, unused:true, 
         curly:true, browser:true, indent:4, maxerr:50 */

/*global node_unit:true, Stapes:true, 
         Logger:true, window:true, exports:false*/

/**
 * Model Class for Documents ie pictures
 * 
 * @fileoverview Class definition Documents
 * @author anshuk.kumar@essindia.co.in (Anshuk Kumar)
 * @license Commercial - Copyright 2013 Gizur AB
 * @see http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
 */

var Doc = Stapes.subclass({

    /**
     * @constructor
     *
     * @param {user} aUsr the user who will send the request
     * @param {object} aLogConfig object containing the log configuration     
     */ 

    constructor : function(aUsr, aLogConfig) {

        "use strict";

        /**
         * Set pseudo private vars
         * please dont change this using <objname>._privatevarname
         * method from outside of here.
         * Arggghh Stapes!!!!
         */        

        if (typeof aLogConfig === 'undefined') {
            aLogConfig = {
                level  : 'FATAL',
                type   : 'console',
                config : {}
            };
        } else {
            if (typeof aLogConfig.level === 'undefined') {
                aLogConfig.level = 'FATAL';
            }

            if (typeof aLogConfig.level === 'undefined') {
                aLogConfig.type = 'console';
            }

            if (typeof aLogConfig.config === 'undefined') {
                aLogConfig.config = {};
            }           
        }

        this.extend({
            _usr :  aUsr,
            _lg : new Logger(aLogConfig.level, 'js/models/doc', aLogConfig.type, aLogConfig.config)
        });

        this.set({
            'id' : '',
            'path' : ''
        });
    },

    /**
     * Download file from server
     *
     * @param  {function} successCb success callback executed in case of success
     * @param  {function} errorCb   executed in case of error
     * @return {void}      
     */

    download : function(successCb, errorCb) {

        "use strict";

        var that = this;
        var thatSuccessCb = successCb; 
        var thatErrorCb = errorCb;

        that._lg.log('DEBUG', ' doc getAll ' + JSON.stringify(this.getAll()));

        var successCbWrapper = function(data){
            that._lg.log('TRACE', ' download successCbWrapper start');

            window.localStorage.setItem(data.result.filename, data.result.filecontent); 
            that._lg.log('TRACE', 'Finished downloading image');
            that._lg.log('DEBUG', ' full path of file : ' + data.result.filename);
            that.set('path', data.result.filename);

            if (typeof thatSuccessCb === 'function') {
                thatSuccessCb(data);
            }
        };

        var errorCbWrapper = function(jqxhr, status, er){
            if (typeof errorCb === 'function') {
                thatErrorCb(jqxhr, status, er);
            }         
        };

        this._usr.send(
            'GET', 
            'DocumentAttachments/' + this.get('id'),
            '',
            successCbWrapper,
            errorCbWrapper
        );        
    }
});

/**
 * For node-unit test
 */

if (typeof node_unit !== 'undefined') {
    exports.Doc = Doc;
}