/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, 
         bitwise:true, strict:true, undef:false, unused:true, 
         curly:true, browser:true, indent:4, maxerr:50 */

/*global node_unit:true, Stapes:true, 
         Logger:true, window:true, exports:false*/

/**
 * Model Class for User
 * 
 * @fileoverview Class definition user. This class need to be defined as singleton
 *               but I have not been able to figure of how to implement singleton
 *               pattern in stapes.
 * @author anshuk.kumar@essindia.co.in (Anshuk Kumar)
 * @license Commercial - Copyright 2013 Gizur AB
 * @see http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
 */

var User = Stapes.subclass({

    /**
     * @constructor
     *
     * @param {request} aReq       request class object which the user with use to send
     *                             requests to the API.
     * @param {object}  aLogConfig object containing the log configuration     
     */

    constructor : function(aReq, aLogConfig) {

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

        var lg = new Logger(aLogConfig.level, aLogConfig.type, aLogConfig.config);
        this.extend({
            _lg : lg,
            _req : aReq,
            _storage : window.localStorage,
            _wrapper : new Wrapper(lg)
        });

        /**
         * Fetch the current user if they are available in
         * cache. Else init var as blank.
         */

        var attrs = this._storage.getItem('user');

        if(typeof attrs === "object")
        	this._lg.log('DEBUG', 'js/models/user', 'stored attrs: ' + JSON.stringify(attrs));

        if (attrs) {

            attrs = JSON.parse(attrs);

            this.set({
                'id' : '',
                'username' : attrs.username,
                'password' : attrs.password,
                'authenticated' : attrs.authenticated,
                'refreshTime' : attrs.refreshTime
            }); 
        } else {
            this.set({
                'id' : '',
                'username' : '',
                'password' : '',
                'authenticated' : false,
                'refreshTime' : ''
            }); 
        }
        
        if(typeof this.getAll() !== "undefined" && typeof this.getAll() === "object")
        	this._lg.log('DEBUG', 'js/models/user', 'effective attrs: ' + JSON.stringify(this.getAll()));
    },

    /**
     * Send the request
     *
     * @param {string}   method    HTTP method to send the request with
     * @param {string}   url       the gizur api API path
     * @param {string}   body      request body
     * @param {function} successCb success callback function
     * @param {function} errorCb   error callback function
     * @param {array}    files     array of files to be sent 
     * @param {boolean}  silent    checks if internet connection error message has to be shown or not
     */ 

    send : function(method, url, body, successCb, errorCb, files, silent) {

        "use strict";

        var that = this;

        var headers = {
            'X_USERNAME': this.get('username'),
            'X_PASSWORD': this.get('password')
        };

        var successCbWrapper = function(data) {
            if (typeof successCb === 'function') {
                successCb(data);
            }
        };

        var errorCbWrapper = function(jqxhr, status, er) {

            try {

                var data;

                try {
                    data = JSON.parse(jqxhr.responseText);
                } catch (err) {
                    data = null;
                }

                if (data !== null &&
                    typeof data.error !== 'undefined' &&
                    typeof data.error.message !== 'undefined' &&
                    data.error.message === 'Invalid Username and Password') {

                    that._wrapper.clearNavigatorHistory();

                    /**
                     * Set authenticated flag off
                     */

                    that.setAuthenticated(false);

                    $('.modal').modal('hide');
                    
                    $('#errorDialogHeader').empty().html(app._lang.translate('Error'));
                	$('#errorDialogBody').empty().html(app._lang.translate('Your username and password settings are invalid. Please enter valid settings and try again') + '.');
                	
                	$('#errorDialog').modal('show');
                	
                    //$('#a_dialog_error_invalidcredentials').click();
                    return;
                }

            } catch (err) {

                that._lg.log('FATAL', 'js/models/user', JSON.stringify(err));
                
            } finally {

                if (typeof errorCb === 'function') {
                    errorCb(jqxhr, status, er);
                }

            }
        };

        this._req.send(method, url, headers, body, successCbWrapper, errorCbWrapper, files, silent);
    },

    setAuthenticated :  function (status) {

        "use strict";

        this.set('authenticated', status);
        this._storage.setItem('user', JSON.stringify(this.getAll()));             
    },

    /**
     * Authenticates the current user
     *
     * @param {function} success success callback function
     * @param {function} error   error callback function     
     */

    authenticate : function(success, error) {

        "use strict";

        var that = this;

        var successWrapper = function(data){
        	//alert("success");

            that._lg.log('TRACE', 'js/models/user', 'authenticate#successWrapper# enter' + data);                                

            /**
             * Set flag authenticated to true
             */

            that.set('authenticated', true);
            that.set('refreshTime', new Date().getTime());

            /**
             * Saving user attr to cache
             */

            that._storage.setItem('user', JSON.stringify(that.getAll()));  

            if (typeof data.contactinfo !== 'undefined') {
                that._lg.log('DEBUG', 'js/models/user', 'authenticate#successWrapper#attributes saved to cache data.contactinfo : ' + data.contactinfo);                
                window.localStorage.setItem('contact', data.contactinfo);
            }          

            that._lg.log('DEBUG', 'js/models/user', 'authenticate#successWrapper#attributes saved to cache: ' + JSON.stringify(that.getAll()));                

            /**
             * Execute caller's callback
             */

            success(data);

            that._lg.log('TRACE', 'js/models/user', 'authenticate#successWrapper# exit');
        };

        var errorWrapper = function(jqxhr, status, er){
        	//alert("error");
        	//alert(jqxhr);
        	//alert(status);
        //	alert(er);

            that._lg.log('TRACE', 'js/models/user', 'authenticate#errorWrapper# enter');                                

            /**
             * Set flag authenticated to true
             */

            that.set('authenticated', false);
            window.localStorage.removeItem('contact');

            /**
             * Saving user attr to cache
             */

            that._storage.setItem('user', JSON.stringify(that.getAll()));            

            that._lg.log('DEBUG', 'js/models/user', 'authenticate#errorWrapper#attributes saved to cache: ' + JSON.stringify(that.getAll()));                

            /**
             * execute caller's callback
             */

            error(jqxhr, status, er);

            that._lg.log('TRACE', 'js/models/user', 'authenticate#errorWrapper# exit');
        };            

        /**
         * Saving user attr to cache
         */

        this._storage.setItem('user', JSON.stringify(that.getAll()));            

        this._lg.log('DEBUG', 'js/models/user', 'authenticate#attributes saved to cache: ' + JSON.stringify(this.getAll()));

        /**
         * Send the request to authenticate
         */

        this._req.send(
            'POST',
            'Authenticate/login',
            {
                'X_USERNAME': this.get('username'),
                'X_PASSWORD': this.get('password')
            },
            '',
            successWrapper,
            errorWrapper
        );  
    },

    /**
     * Reset the password
     */

    resetPassword : function(success, error) {

        "use strict";

        var that = this;

        var successWrapper = function(data){

            that._lg.log('TRACE', 'js/models/user', 'reset#successWrapper# enter');

            that.set('password', '');
            that._storage.setItem('user', JSON.stringify(that.getAll())); 

            if (typeof success === 'function') {
                success(data);
            }

            that._lg.log('TRACE', 'js/models/user', 'reset#successWrapper# exit');
        };

        var errorWrapper = function(jqxhr, status, er){

            that._lg.log('TRACE', 'js/models/user', 'reset#errorWrapper# enter');                                

            if (typeof success === 'function') {
                error(jqxhr, status, er);
            }

            that._lg.log('TRACE', 'js/models/user', 'reset#errorWrapper# exit');
        };                     

        that._lg.log('TRACE', 'js/models/user', 'resetPassword send call');

        /**
         * Send the request to reset
         */

        this._req.send(
            'PUT',
            'Authenticate/reset',
            {
                'X_USERNAME': this.get('username')
            },
            '',
            successWrapper,
            errorWrapper
        );
    },

    /**
     * Change the password
     *
     * @param {string}   newpassword  password to be changed to  
     * @param {function} success      success callback function
     * @param {function} error        error callback function        
     */       

    changePassword : function( newpassword, success, error ) {

        "use strict";

        var that = this;

        that._lg.log('DEBUG', 'js/models/user', 'got new password ' + newpassword);


        var successWrapper = function( data ){

            that._lg.log('TRACE', 'js/models/user', 'changepassword#successWrapper# enter');

            that._lg.log('DEBUG', 'js/models/user', 'changepassword#successWrapper# new password ' + newpassword);

            that.set('password', newpassword);
            that._storage.setItem('user', JSON.stringify(that.getAll()));  

            if (typeof success === 'function') {
                success(data);
            }

            that._lg.log('TRACE', 'js/models/user', 'changepassword#successWrapper# exit');
        };

        var errorWrapper = function( jqxhr, status, er ){

            that._lg.log('TRACE', 'js/models/user', 'changepassword#errorWrapper# enter');                                

            if (typeof success === 'function') {
                error(jqxhr, status, er);
            }

            that._lg.log('TRACE', 'js/models/user', 'changepassword#errorWrapper# exit');
        };                     

        that._lg.log('TRACE', 'js/models/user', 'changepassword send call');

        /**
         * Send the request to reset
         */

        this._req.send(
            'PUT',
            'Authenticate/changepw',
            {
                'X_USERNAME' : this.get('username'),
                'X_PASSWORD' : this.get('password')
            },
            'newpassword=' + newpassword,
            successWrapper,
            errorWrapper
        );
    }    
});

/**
 * For node-unit test
 */

if (typeof node_unit !== 'undefined') {
    exports.User = User;
}