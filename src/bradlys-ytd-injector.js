let URLToDecryptionFunction = {};

/**
 * Takes in a URL to a text type file and returns the content once the promise resolves.
 * @param {string} url
 * @returns {Promise}
 */
function getContent(url) {
	return new Promise(function(resolve, reject) {
		let request = new XMLHttpRequest();
		request.onreadystatechange = function() {
			if (request.readyState === 4) {
				if (request.status === 200) {
					resolve(request.responseText);
				} else {
					reject(false);
				}
			}
		};
		request.open("GET", url);
		request.send();
	});
}

/**
 * Gets the URL to a file that matches the needle from document.scripts
 * @returns {string|boolean} Will return the url string or will return false if not found
 */
function getMatchingScript(needle) {
	let scripts = document.scripts;
	// try to get a url for a script that has needle in it
	for (let i of scripts) {
		if (scripts[i].src && scripts[i].src.indexOf(needle) !== -1) {
			return scripts[i].src;
		}
	}
	return false;
}

function getDecryptionSignatureFunctionName(haystack) {
	// First attempt at finding the main execution function for the decryption algorithm. This works usually.
	let functionName = haystack.match(/\.set\("signature",([^\(]*)\(/);
	if (!functionName) {
		return false;
	}
	return functionName[1];
}

function getFunction(functionName, haystack) {
	let mainFunction = parseMethodFromScript(functionName, haystack);
	if (!mainFunction) {
		return false;
	}
	let subFunction = parseSubFunctionFromMethodAndScript(mainFunction, functionName, haystack);
	if (!subFunction) {
		return false;
	}
	if (mainFunction[mainFunction.length - 1] !== ';') {
		mainFunction += ';';
	}
	if (subFunction[subFunction.length - 1] !== ';') {
		subFunction += ';';
	}
	return 'function (sig) { ' +
		subFunction + ' ' +
		mainFunction +
		' return ' + functionName + '(sig);};';
}

/**
 * Returns the declaration of a method when given the provided method name and haystack to search.
 *
 * @param methodName name of the method to search for
 * @param haystack string to search in
 * @returns {boolean|string}
 */
function parseMethodFromScript(methodName, haystack) {
	methodName = regexEscapeString(methodName);
	let methodMatch = haystack.match(new RegExp("(var " + methodName + "={[\\S\\s]*?(?=}};)}};)"), 'm');
	if (!methodMatch) {
		methodMatch = haystack.match(new RegExp("(var " + methodName + "=function\\([\\w$]+\\){[^}]*};)", 'm'));
	}
	if (!methodMatch) {
		methodMatch = haystack.match(new RegExp("(function " + methodName + "\\([\\w$]+\\){[^}]*};)", 'm'));
	}
	if (!methodMatch) {
		methodMatch = haystack.match(new RegExp("(" + methodName + "=function\\([\\w$]+\\){[^}]*})", 'm'));
	}
	if (!methodMatch) {
		return false;
	}
	return methodMatch[1];
}

/**
 * Returns the first parameter of the provided method that is within the haystack.
 *
 * @param methodName name of the method to search for
 * @param haystack string to search in
 * @returns {boolean|string}
 */
function parseMethodParameterFromScript(methodName, haystack) {
	methodName = regexEscapeString(methodName);
	let methodMatch = haystack.match(new RegExp("function " + methodName + "\\(([\\w$]+)\\){[^}]*};", 'm'));
	if (!methodMatch) {
		methodMatch = haystack.match(new RegExp("var " + methodName + "=function\\(([\\w$]+)\\){[^}]*};", 'm'));
	}
	if (!methodMatch) {
		methodMatch = haystack.match(new RegExp(methodName + "=function\\(([\\w$]+)\\){[^}]*}", 'm'));
	}
	if (!methodMatch) {
		return false;
	}
	return methodMatch[1];
}

/**
 * Obtains the first subfunction reference out of the provided method and then
 * returns that subfunction's declaration.
 *
 * @param method method to look for subfunctions in
 * @param methodName method name of the method provided
 * @param script script to search
 * @returns {boolean|string}
 */
function parseSubFunctionFromMethodAndScript(method, methodName, script) {
	let methodParameter = parseMethodParameterFromScript(methodName, method);
	if (!methodParameter) {
		return false;
	}
	methodParameter = regexEscapeString(methodParameter);
	let firstSubFunctionName = method.match(new RegExp("([\\w$]+)\\.[\\w$]+\\(" + methodParameter + "[^)]*\\)", 'm'));
	if (!firstSubFunctionName) {
		return false;
	}
	firstSubFunctionName = firstSubFunctionName[1];
	let subFunction = parseMethodFromScript(firstSubFunctionName, script);
	if (!subFunction) {
		return false;
	}
	return subFunction;
}

/**
 * Take a string and return the regex safe version of it.
 * Which is to say, a version that can be inserted into regexp as is.
 *
 * @param string
 * @returns {string}
 */
function regexEscapeString(string) {
	string = string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	return string;
}

/**
 * Starts the process of putting the decryption signature into state for use by other processes.
 *
 * @param {string} url optional parameter is the link to the JS file to get the decryption signature from
 * @returns {Promise} Promise will resolve when decryption is done or fail if a problem occurs.
 */
function putDecryptionSignatureIntoState(url) {
	if (!url) {
		// try to get a script that has html5player in the url
		url = getMatchingScript('html5player');
		// if not that then try to get a script that has player in the url
		if (!url) url = getMatchingScript('player');
		if (!url) return new Promise(function(resolve, reject) { reject(false); });
	}
	let p = getContent(url);
	p.then(function(text) {
		let functionName = getDecryptionSignatureFunctionName(text);
		if (!functionName) return false;

		let func = getFunction(functionName, text);
		if (!func) return false;

		// put the function into state
		URLToDecryptionFunction[url] = func;
		return url;
	});
}

/**
 * Add event listener to DOM to know when the injected script needs the decryption scheme.
 */
document.addEventListener('BYTD_connectExtension', function(e) {
	if (e.detail) {
		let p = putDecryptionSignatureIntoState(e.detail);
		p.then(function (url) {
			if (!url) return;
			// since we know the URL now and know that this is in state, we can add the function to the DOM.
			let scriptElement = document.createElement('script');
			scriptElement.innerText = 'decrypt_signature = ' + URLToDecryptionFunction[url];
			scriptElement.onload = function() { this.parentNode.removeChild(this);};
			(document.head||document.documentElement).appendChild(scriptElement);
		});
	}
}, false);

// inject our download button creator script into the user's current DOM
let s = document.createElement('script');
s.src = chrome.extension.getURL('bradlys-ytd.js');
s.onload = function() {
	this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);
