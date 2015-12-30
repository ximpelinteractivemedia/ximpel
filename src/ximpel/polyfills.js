// polyfills.js
// Register any polyfills here (ie. functionality that is expected to be 
// supported natively by the browser but isnt).

// ############################################################################

// Polyfill for: console.log() console.debug() console.warn() console.error()
// The console is not supported by all browsers, so we create a polyfill for
// all the console methods that we use for logging.
if( !console ){
  console = {
        log: function(){},
        debug: function(){},
        warn: function(){},
        error: function(){}
    };
}

// ############################################################################

// Polyfill for: Object.keys()
// Object.keys is an ECMAScript 5 feature which lacks some browser support.
// It returns an array containing an object's own properties (so not the 
// properties of its prototype). Below is a polyfill to include the same
// functionality for older browsers that do not natively support it.
if ( ! Object.keys ){
	Object.keys = function( obj ){
		if( obj !== Object( obj ) ){
  		   ximpel.error('Object.keys() called on a non-object');
		}
		var properties=[], property;
		for( property in obj ){
			if( Object.prototype.hasOwnProperty.call( obj, property ) ){
				keys.push( property );
			}
		}
		return keys;
	}
}

// ############################################################################

// Polyfill for Array.prototype.forEach()
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if( !Array.prototype.forEach ){
    Array.prototype.forEach = function( callback, thisArg ){
        var T, k;
        if( this == null ){
            throw new TypeError(' this is null or not defined');
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }

        // 6. Let k be 0
        k = 0;

        // 7. Repeat, while k < len
        while ( k < len ){
            var kValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if( k in O ){

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[k];

                // ii. Call the Call internal method of callback with T as the this value and
                // argument list containing kValue, k, and O.
                callback.call( T, kValue, k, O );
            }
            
            // d. Increase k by 1.
            k++;
        }
    // 8. return undefined
    };
}

// ############################################################################

// Polyfill for: Array.filter()
if( !Array.prototype.filter ){
    Array.prototype.filter = function( func /*, thisp */ ){
        "use strict";
        if( this == null ){
            throw new TypeError();
        }

        var t = Object( this );
        var len = t.length >>> 0;
        if( typeof func != "function" ){
            throw new TypeError();
        }

        var res = [];
        var thisp = arguments[1];
        for( var i=0; i<len; i++ ){
            if( i in t ){
                var val = t[i]; // in case func mutates this
                if( func.call( thisp, val, i, t ) ){
                    res.push( val );
                }
            }
        }
        return res;
    };
}

// ############################################################################

// A polyfill for Date.now() function
if( !Date.now ){
    Date.now = function(){ 
        return new Date().getTime();
    }
}

