var utils = window.utils = {};

//========================================================================
//   fin.desktop.Application.getCurrent() shortcut
//========================================================================
/**
 * This is the current OpenFin application the test is started in
 */
utils.app = fin.desktop.Application.getCurrent();

//========================================================================
//   Converts bytes to kilobytes
//========================================================================
/**
 * Converts a number of bytes into a number of kilobytes.
 * @example
 * // returns 1
 * utils.bytesToKb(1024);
 * @param {Number} bytes
 * @returns {Number} - number of kilobytes
 */
utils.bytesToKB = function(bytes) {
    return Math.ceil(bytes/1024);
};

//========================================================================
//   Converts bytes to megabytes
//========================================================================
/**
 * Converts a number of bytes into a number of megabytes.
 * @example
 * // returns 1
 * utils.bytesToMb(1048576);
 * @param {Number} bytes
 * @returns {Number} - number of megabytes
 */
utils.bytesToMB = function(bytes) {
    return Math.ceil(bytes/1048576);
};

//========================================================================
//   Converts bytes to a readable size
//========================================================================
/**
 * Converts a number of bytes into readable size string.
 * @example
 * // returns '1KiB'
 * utils.bytesToSize(1024);
 * @example
 * // returns '1KB'
 * utils.bytesToSize(1000, true);
 * @param {Number} bytes
 * @param {Boolean} [si]
 * @returns {String} - readable size
 */
utils.bytesToSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    var units = ['KB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);

    return bytes.toFixed(0) + ' ' + units[u];
};

//=====================================================================
//   Canonical location for test assets
//=====================================================================
/**
 * This is the url on AWS where we put assets needed by tests.
 */
utils.CDN = 'http://testing-assets.openfin.co/test_runner/';

//========================================================================
//   Closes an OpenFin application
//========================================================================
/**
 * Properly closes OpenFin application using 'closed' event listener.
 * @example
 * utils.closeApp({OpenFin app});
 * @param {Object} app - OpenFin app to close
 * @param {Function} [callback] - function to execute when application is fully closed
 */
utils.closeApp = function(app, callback) {
    app.addEventListener(
        'closed',
        onClose,
        function() {
            app.close();
        },
        function(error) {
            if (typeof callback === 'function') {
                callback(false, error);
            }
        }
    );

    function onClose() {
        if (typeof callback === 'function') {
            app.removeEventListener('closed', onClose);
            callback(true);
        }
    }
};

//========================================================================
//   Closes OpenFin window
//========================================================================
/**
 * Properly closes OpenFin window using 'closed' event listener.
 * @example
 * utils.closeWindow({OpenFin window});
 * @param {Object} wnd - OpenFin window to be closed
 * @param {Function} [callback] - function to execute when window is fully closed
 */
utils.closeWindow = function(wnd, callback) {
    if (wnd === undefined) {
        console.error('No window was passed in to be closed');
        callback(false);
        return;
    }

    wnd.addEventListener(
        'closed',
        function listener() {
            if (typeof callback === 'function') {
                wnd.removeEventListener('closed', listener);
                callback(true);
            }
        },
        function() {
            wnd.close(true);
        },
        function() {
            if (typeof callback === 'function') {
                callback(false);
            }
        }
    );
};

//========================================================================
//   Closes multiple OpenFin windows
//========================================================================
/**
 * Helps properly close multiple OpenFin windows.
 * @example
 * utils.closeWindows([{OpenFin window 1}, {OpenFin window 1}]);
 * @param {Object[]} wnds - array of OpenFin windows to close
 * @param {Function} callback - function to execute after all windows are closed
 * @param {Function} [callback] - function to execute when all windows are fully closed
 */
utils.closeWindows = function(wnds, callback) {
    if (typeof wnds !== 'object') return;

    var windowQty = wnds.length;

    function onWindowClose() {
        if (--windowQty) return;
        if (typeof callback === 'function') callback(true);
    }

    for (var i = 0; i < wnds.length; i++) {
        var wnd = wnds[i];
        utils.closeWindow(wnd, onWindowClose);
    }
};

//========================================================================
//   Creates a new OpenFin application
//========================================================================
/**
 * Use this function for easier OpenFin app creation, providing properties you want to overwrite.
 * In addition to parameters mentioned below, you can pass in other parameters that OpenFin Window class accepts.
 * @example
 * // returns {OpenFin app}
 * utils.createApp();
 * @param {Object} [args] - app configuration
 * @param {String} [args.url] - url path for app html file
 * @param {String} [args.uuid] - uuid of the new app
 * @param {String} [args.name] - name fo the new app
 * @param {String} [args.testName] - test name
 * @param {String|Function} [args._code] - code that will be eval'ed in the new window
 * @param {String|Function} [args._codeOM] - code that will be eval'ed in the new window outside fin.desktop.main
 * @param {Boolean} [args._withIframe] - will have an iFrame on the page
 * @param {Boolean} [args._withCorsIframe] - will have a CORS iFrame on the page
 * @param {Boolean} [args._withinIframe] - will execute code inside an iFrame
 * @param {Boolean} [args._withinCorsIframe] - will execute code inside a CORS iFrame
 * @param {Object} [args._responseHeaders] - will add custom HTTP response headers to the app URL
 * @param {Object} [args.mainWindowOptions] - app's main window configuration
 * @param {Boolean} [args.mainWindowOptions.autoShow=true] - whether new app's window will be shown upon creation
 * @param {Number} [args.mainWindowOptions.defaultTop=220]
 * @param {Number} [args.mainWindowOptions.defaultLeft=0]
 * @param {Number} [args.mainWindowOptions.defaultWidth=300]
 * @param {Number} [args.mainWindowOptions.defaultHeight=120]
 * @param {Function} [callback] - function to execute after the app is fully created
 * @returns {Object} - newly created OpenFin app
 */
utils.createApp = function(args, callback) {
    var app;
    var wndOpts;
    var code;

    args = args || {};

    // Support old signatures
    args._code = args._code || args.code;
    args._codeOM = args._codeOM || args.codeOM;

    // Prepare arguments
    args.url = args.url || utils.url;
    args.uuid = args.uuid || utils.getUuid();
    args.name = args.name || args.uuid;
    (args.url.indexOf('?') === -1) && (args.url += '?');
    args.url += '&testName=' + window.encodeURIComponent(window.testName);
    
    if(args._responseHeaders) {
        args.url += '&responseHeaders=' + window.encodeURIComponent(JSON.stringify(args._responseHeaders));
    }  

    // Code
    if (typeof args._code === 'function') {
        code = args._code.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&code=' + window.encodeURIComponent(code);
    } else if (typeof args._code === 'string') {
        args.url += '&code=' + window.encodeURIComponent(args._code);
    }

    // Code outside of fin.desktop.main (OM)
    if (typeof args._codeOM === 'function') {
        code = args._codeOM.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&codeOM=' + window.encodeURIComponent(code);
    } else if (typeof args._codeOM === 'string') {
        args.url += '&codeOM=' + window.encodeURIComponent(args._codeOM);
    }

    // With iFrame
    if (args._withIframe === true) {
        args.url += '&withIframe=true';
    }
    // With CORS iFrame
    else if (args._withCorsIframe === true) {
        args.url += '&withCorsIframe=true';
    }
    // Within iFrame
    else if (args._withinIframe === true) {
        args.url += '&withinIframe=true';
    }
    // Within CORS iFrame
    else if (args._withinCorsIframe === true) {
        args.url += '&withinCorsIframe=true';
    }

    wndOpts = args.mainWindowOptions = args.mainWindowOptions || {};
    (wndOpts.autoShow !== false) && (wndOpts.autoShow = true);
    wndOpts.defaultTop = wndOpts.defaultTop || 220;
    wndOpts.defaultLeft = wndOpts.defaultLeft || 0;
    wndOpts.defaultWidth = wndOpts.defaultWidth || 300;
    wndOpts.defaultHeight = wndOpts.defaultHeight || 120;

    app = new fin.desktop.Application(
        args,
        function() {
            app.run(
                function() {
                    if (typeof callback === 'function') {
                        callback(true);
                    }
                },
                function(error) {
                    if (typeof callback === 'function') {
                        callback(false, error);
                    }
                }
            );
        },
        function(error) {
            if (typeof callback === 'function') {
                callback(false, error);
            }
        }
    );

    return app;
};

//========================================================================
//   Creates a new OpenFin notification
//========================================================================
/**
 * Use this function for easier OpenFin notification creation, providing properties you want to overwrite.
 * In addition to parameters mentioned below, you can pass in other parameters that OpenFin Notification class accepts.
 * @example
 * // returns {OpenFin notification}
 * utils.createNotification();
 * @param {Object} [args] - notification configuration
 * @param {String} [args.url] - url path to notification's html
 * @param {String} [args.title] - this title will be displayed in html of the notification
 * @param {String|Function} [args.code] - code that will be eval'ed inside newly created notification
 * @param {String|Function} [args.codeOM] - code that will be eval'ed inside newly created notification
 * @param {Number} [args.timeout] - timeout for the notification
 * @returns {Object} - newly created OpenFin notification
 */
utils.createNotification = function(args) {
    var code;
    var urlArgs = [];

    args = args || {};
    args.url = args.url || utils.url;
    (args.url.indexOf('?') === -1) && (args.url += '?');
    (!!args.title) && urlArgs.push('&title=' + window.encodeURIComponent(args.title));

    // Code
    if (typeof args.code === 'function') {
        code = args.code.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&code=' + window.encodeURIComponent(code);
    } else if (typeof args.code === 'string') {
        args.url += '&code=' + window.encodeURIComponent(args.code);
    }
    if (typeof args.codeOM === 'function') {
        code = args.codeOM.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&codeOM=' + window.encodeURIComponent(code);
    } else if (typeof args.codeOM === 'string') {
        args.url += '&codeOM=' + window.encodeURIComponent(args.codeOM);
    }

    (urlArgs.length > 0) && (args.url += urlArgs.join('&'));
    args.timeout = args.timeout || 500;

    return new fin.desktop.Notification(args);
};

//========================================================================
//   Creates a new OpenFin window
//========================================================================
/**
 * Use this function for easier OpenFin window creation, providing properties you want to overwrite.
 * In addition to parameters mentioned below, you can pass in other parameters that OpenFin Window class accepts.
 * @example
 * // returns {OpenFin window}
 * utils.createWindow();
 * @param {Object} [args] - window configuration
 * @param {String} [args.url] - url path to window html file
 * @param {String|Function} [args._code] - code that will be eval'ed in the new window
 * @param {String|Function} [args._codeOM] - code that will be eval'ed in the new window outside fin.desktop.main
 * @param {Boolean} [args._withIframe] - will have an iFrame on the page
 * @param {Boolean} [args._withCorsIframe] - will have a CORS iFrame on the page
 * @param {Boolean} [args._withinIframe] - will execute code inside an iFrame
 * @param {Boolean} [args._withinCorsIframe] - will execute code inside a CORS iFrame
 * @param {Object} [args._responseHeaders] - will add custom HTTP response headers to the window URL
 * @param {String} [args.name] - name of the new window
 * @param {Boolean} [args.autoShow=true] - whether new window will be shown upon creation
 * @param {Number} [args.defaultTop=220]
 * @param {Number} [args.defaultLeft=0]
 * @param {Number} [args.defaultWidth=300]
 * @param {Number} [args.defaultHeight=120]
 * @param {Function} [callback] - function to execute after the window creation
 * @returns {Object} - newly created OpenFin window
 */
utils.createWindow = function(args, callback) {
    var code;

    args = args || {};

    // Support old signatures
    args._code = args._code || args.code;
    args._codeOM = args._codeOM || args.codeOM;

    args.url = args.url || utils.url;
    (args.url.indexOf('?') === -1) && (args.url += '?');
    args.url += '&testName=' + window.encodeURIComponent(window.testName);
        
    if(args._responseHeaders) {
        args.url += '&responseHeaders=' + window.encodeURIComponent(JSON.stringify(args._responseHeaders));
    }  

    // Code
    if (typeof args._code === 'function') {
        code = args._code.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&code=' + window.encodeURIComponent(code);
    } else if (typeof args._code === 'string') {
        args.url += '&code=' + window.encodeURIComponent(args._code);
    }

    // Code outside of fin.desktop.main (OM)
    if (typeof args._codeOM === 'function') {
        code = args._codeOM.toString();
        code = code.slice(code.indexOf('{') + 1, -1);
        args.url += '&codeOM=' + window.encodeURIComponent(code);
    } else if (typeof args._codeOM === 'string') {
        args.url += '&codeOM=' + window.encodeURIComponent(args._codeOM);
    }

    // With iFrame
    if (args._withIframe === true) {
        args.url += '&withIframe=true';
    }
    // With CORS iFrame
    else if (args._withCorsIframe === true) {
        args.url += '&withCorsIframe=true';
    }
    // Within iFrame
    else if (args._withinIframe === true) {
        args.url += '&withinIframe=true';
    }
    // Within CORS iFrame
    else if (args._withinCorsIframe === true) {
        args.url += '&withinCorsIframe=true';
    }

    args.name = args.name || utils.getUuid();
    (args.autoShow !== false) && (args.autoShow = true);
    args.defaultTop = args.defaultTop || 220;
    args.defaultLeft = args.defaultLeft || 0;
    args.defaultWidth = args.defaultWidth || 300;
    args.defaultHeight = args.defaultHeight || 120;

    return new fin.desktop.Window(
        args,
        function() {
            if (typeof callback === 'function') {
                callback(true);
            }
        },
        function(error) {
            if (typeof callback === 'function') {
                callback(false, error);
            }
        }
    );
};

//========================================================================
//   Creates multiple new OpenFin windows
//========================================================================
/**
 * Function that helps create more than one OpenFin window.
 * @example
 * // returns [{OpenFin window 1}, {OpenFin window 2}]
 * utils.createWindows({}, 2);
 * @param {Object} [args] - parameters for OpenFin window creation
 * @param {Number} num - number of windows you need to create
 * @param {Function} [callback] - function to execute after all windows are created
 * @returns {Object[]} - array of newly created OpenFin windows
 */
utils.createWindows = function(args, num, callback) {
    if (!args || !num) return;

    var pendingWindows = num,
        wnds = [];

    function onWindowCreate() {
        if (--pendingWindows) return;
        if (typeof callback === 'function') callback(true);
    }

    while (num--) {
        var newArgs = JSON.parse(JSON.stringify(args));
        wnds.push(utils.createWindow(newArgs, onWindowCreate));
    }

    return wnds;
};

//========================================================================
//   UUID of the current test application
//========================================================================
/**
 * This will be the UUID of OpenFin
 * application your test will be executed in
 */
utils.currentUuid = fin.desktop.Application.getCurrent().uuid;

//========================================================================
//   Generates string of some specified length
//========================================================================
/**
 * Generates string of specified length
 * @example
 * // returns 'xxx'
 * utils.generateString(3);
 * @param {Number} length - length of the string
 * @param {String} char - characters that will build the string
 * @returns {String} - string of some specified length
 */
utils.generateString = function(length, char) {
    return Array.prototype.join.call({length: (length || -1) + 1}, char || 'x');
};

//========================================================================
//   Gets process info for current/specified OpenFin application
//========================================================================
/**
 * Gets process info for current/specified OpenFin application
 * @example
 * // {...current app process info...} is passed to the callback as Object
 * utils.getProcessInfo(null, callback);
 * // {...abc app process info...} is passed to the callback as Object
 * utils.getProcessInfo('abc', callback);
 * @param {String} [appUuid=currentAppUuid] - application uuid to retrieve process info for
 * @param {Function} [callback] - function to execute when process info is retrieved
 */
utils.getProcessInfo = function(appUuid, callback) {
    appUuid = appUuid || utils.app.uuid;

    fin.desktop.System.getProcessList(function(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].uuid === appUuid) {
                if (typeof callback === 'function') {
                    return callback(list[i]);
                }
            }
        }

        if (typeof callback === 'function') {
            return callback({});
        }
    });
};

//========================================================================
//   Generates unique id
//========================================================================
/**
 * Useful helper-function to get a random unique id
 * @returns {String} - random unique id
 */
utils.getUuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

//========================================================================
//   Sends JSON for temporary hosting (30 days)
//========================================================================
/**
 * Sends JSON for temporary hosting (30 days)
 * @example
 * utils.hostConfig({foo: 'bar'}, function(error, fileURL) {
 *    if (!error) {
 *       console.log('File is hosted at ' + fileURL);
 *    }
 * });
 * @param {Object} json - JavaScript's plain object that will be stringified and saved as a JSON file
 * @param {Function} callback - function to execute when the file is hosted and ready for access
 */
utils.hostConfig = function(json, callback) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 201) {
                if (typeof callback === 'function') {
                    callback(null, xhr.responseText);
                }
            } else {
                if (typeof callback === 'function') {
                    callback(xhr.statusText);
                }
            }
        }
    };

    xhr.open('POST', 'https://testing-dashboard.openfin.co/config-file', true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(json));
};

//========================================================================
//   Converts milliseconds into a readable time
//========================================================================
/**
 * Converts a number of milliseconds into a readable duration.
 * @example
 * // returns '1h 5m'
 * utils.humanizeMs(3900000);
 * @param {Number} milliseconds
 * @returns {String} - readable duration
 */
utils.humanizeMs = function(milliseconds) {
    if (!milliseconds || typeof milliseconds !== 'number') return milliseconds;
    if (milliseconds < 1000) return milliseconds + 'ms';

    var readableTime = '',
        seconds, minutes, hours;

    hours = Math.floor(milliseconds / 3600000);
    (hours > 0) && (readableTime += hours + 'h ');

    minutes = Math.floor((milliseconds - hours * 3600000) / 60000);
    (minutes > 0) && (readableTime += minutes + 'm ');

    seconds = Math.round((milliseconds - hours * 3600000 - minutes * 60000) / 1000);
    (seconds > 0) && (readableTime += seconds + 's ');

    readableTime = readableTime.replace(/\s*$/, '');

    return readableTime;
};

//========================================================================
//   Launches an external process
//========================================================================
/**
 * Helps to launch an external process.
 * Uuid property of processArgs is later populated with process' uuid.
 * @example
 * utils.launchExternalProcess({name: 'notepad'});
 * @param {Object} processArgs - process properties
 * @param {String} processArgs.name - name of the process to launch
 * @param {Function} [callback] - function to execute when process is launched
 */
utils.launchExternalProcess = function(processArgs, callback) {
    fin.desktop.System.launchExternalProcess(
        processArgs.name,
        '',
        function(r) {
            processArgs.uuid = r.uuid;
            if (typeof callback === 'function') {
                callback(true);
            }
        },
        function(error) {
            if (typeof callback === 'function') {
                callback(false, error);
            }
        }
    );
};

//========================================================================
//   Shape-tests an OpenFin API
//========================================================================
/**
 * Passes a collection of wrong/bad arguments to an API method
 * @example
 * // Calls completionCallback with true for success and false for failure
 * utils.shapeTest(utils.app.registerCustomData, ['_wrong', '_cb', '_ecb'], completionCallback);
 * @example
 * // Calls completionCallback with true for success and false for failure
 * utils.shapeTest(fin.desktop.System.getVersion, ['_wrong', '_wrong'], completionCallback);
 * @param {Function} api - API function that needs to be tested
 * @param {Object} scope - API function to bind to object
 * @param {String[]} argTypes - array of wrong argument types. For example: 'string', 'object', 'callback', 'errorCallback'
 * @param {Function} [callback] - function to execute when argument checks are done
 */
utils.shapeTest = function(api, scope, argTypes, callback) {
    var scheduled = 0;
    var executed = 0;
    var allArgsList = [undefined, null, true, false, 0, 0.01, '', {}, [], function() {}];

    allArgsList.forEach(function(argsListItem) {
        var atLeastOneBad = false;
        var hasCallback = false;

        var allArgs = argTypes.map(function() {
            return argsListItem;
        });

        var badArgs = argTypes.map(function(type) {
            if (type === 'callback') {
                hasCallback = true;

                return function() {
                    callback(false, 'Success callback was fired after receiving wrong argument');
                };
            }

            if (type === 'errorCallback') {
                hasCallback = true;

                return function() {
                    executed++;
                    if (executed === scheduled) {
                        callback(true);
                    }
                };
            }

            if (type !== 'various' && typeof argsListItem !== type) {
                atLeastOneBad = true;
            }

            return argsListItem;
        });

        api.apply(scope, allArgs); // make sure runtime doesn't crash when receiving all wrong arguments

        if (atLeastOneBad && hasCallback) {
            scheduled++;
            api.apply(scope, badArgs); // check wrong arguments with error callbacks
        }
    });

    if (executed === scheduled) {
        // Give some time to those API that were executed
        // with no callbacks, to make sure runtime doesn't
        // crash while executing with wrong arguments
        setTimeout(function() {
            callback(true);
        }, 2000);
    }
};

//========================================================================
//   Terminates an external process
//========================================================================
/**
 * Helps terminate a process.
 * @example
 * utils.terminateExternalProcess({uuid: 'notepad process uuid'});
 * @param {Object} processArgs - process properties
 * @param {String} processArgs.uuid - uuid of the process to terminate
 * @param {Function} [callback] - function to execute when process is terminated
 */
utils.terminateExternalProcess = function(processArgs, callback) {
    fin.desktop.System.terminateExternalProcess(
        processArgs.uuid,
        1000,
        true,
        function() {
            if (typeof callback === 'function') {
                callback(true);
            }
        },
        function(error) {
            if (typeof callback === 'function') {
                callback(false, error);
            }
        }
    );
};

//========================================================================
//   Path to the html file used for applications and windows
//========================================================================
/**
 * This is the url path to the html file you can use for
 * launching new applications, windows or notifications.
 * This file can parse 'code' url parameter name and eval it.
 * 'code' url parameter can be used for executing passed in code
 * in the new application, window or notification.
 */
utils.url = window.location.origin + '/agents/JavaScript/app.html';

//========================================================================
//   Path to an empty html file with minimal setup
//========================================================================
/**
 * This is the url path to the html file you can use for
 * launching new applications, windows or notifications.
 * This file is considered 'empty' because all it has is
 * minimal html setup and nothing else. No javascript at all.
 */
utils.urlEmpty = window.location.origin + '/agents/JavaScript/empty.html';

//========================================================================
//   fin.desktop.Window.getCurrent() shortcut
//========================================================================
/**
 * This is the current OpenFin window the test is started in
 */
utils.wnd = fin.desktop.Window.getCurrent();