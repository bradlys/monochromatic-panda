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
					reject('');
				}
			}
		};
		request.open("GET", url);
		request.send();
	});
}

/**
 * Gets the URL to a file that matches the needle from document.scripts
 * @returns {string} Will return the url string or will return empty if not found
 */
function getScriptURL(needle) {
	let haystacks = document.scripts;
	// try to get a url for a script that has needle in it
	for (let i of haystacks) {
		let haystack = haystacks[i].src;
		if (haystack && haystack.indexOf(needle) !== -1) {
			return haystack;
		}
	}
	return '';
}

function getDecryptionFunctionName(haystack) {
	// Use two different methods for getting the decryption function name. These vary but generally have these traits.
	// look for something like: `signature", functionName(` <-- capture functionName
	let gen2 = /signature['"]\s*,\s*([a-zA-Z0-9$]+)\(/;
	// look for something like: `.sig||functionName(` <-- capture functionName
	let gen1 = /\.sig\|\|([a-zA-Z0-9$]+)\(/;
	let functionName = haystack.match(gen1);
	if (!functionName) {
		functionName = haystack.match(gen2);
	}
	if (!functionName) return '';
	return functionName[1];
}

function getFunction(needle, haystack) {
	// group 1 is the function declaration up to but not including params. (3 different attempts) But don't capture it
	// group 2 is the params declaration
	// group 3 is the code for the function
	// JS doesn't support named capture groups (annoying!)
	let escaped_needle = regexEscapeString(needle);
	let functionCaptureRegex = `
	(?:function\\s+${ escaped_needle } | [{;,]\\s*${ escaped_needle }\\s*=\\s*function | var\\s+${ escaped_needle }\\s*=\\s*function)\\s*
	\\(([^)]*)\\)
	\\s*{([^}]+)}`.replace(/\s/g, ''); // JS has no free-spacing mode (also annoying!)

	let match = haystack.match(new RegExp(functionCaptureRegex), 'g');
	if (!match) return getObject(needle, haystack);

	let params = match[1]; // Although labeled params - this is usually 1 parameter with YouTube code.
	let code = match[2];
	let needleFunction = `var ${ needle } = function(${ params }) { ${ code } }`;

	let subFunction = getFirstSubFunction(needleFunction, params, needle, haystack);
	// if no subfunctions inside then we can just pass back the needleFunction we made
	if (!subFunction) {
		return needleFunction;
	}

	// otherwise, we need to add the subfunction code to the inside of the code.
	// Basically, put it in the same scope while retaining function names.
	return `var ${ needle } = function(${ params }) {
		${ subFunction }
		${ code }
	};`;
}

/**
 * Given a haystack and needle, get the declaration of the needle in the haystack. Presuming it's an object declaration.
 * @param {string} needle
 * @param {string} haystack
 * @returns {string}
 */
function getObject(needle, haystack) {
	let escaped_needle = regexEscapeString(needle);
	let match = haystack.match(new RegExp("(var " + escaped_needle + "={[\\S\\s]*?(?=}};)}};)"), 'm');
	if (!match) return '';
	return match[1];
}

/**
 * Obtains the first subfunction reference out of the provided haystack and then
 * returns that subfunction's declaration.
 *
 * WARNING: This is not a very generic method - as it is specifically tuned for YouTube.
 * Unlike getFunction which is more generic.
 *
 * @param {string} haystack haystack to look for subfunctions in
 * @param {string} haystackParameter function
 * @param {string} needle function to look for
 * @param {string} script script to search
 * @returns {string}
 */
function getFirstSubFunction(haystack, haystackParameter, needle, script) {
	haystackParameter = regexEscapeString(haystackParameter);
	// We know that the code generally is like `XX.YY(haystackParameter, arg2);` - Not bulletproof but good enough
	let firstSubFunctionName = haystack.match(new RegExp("([\\w$]+)\\.[\\w$]+\\(" + haystackParameter + "[^)]*\\)", 'm'));
	if (!firstSubFunctionName) return '';

	// Need to look for the function in the entire script
	let subFunction = getFunction(firstSubFunctionName[1], script);
	if (!subFunction) return '';

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
	return string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
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
		url = getScriptURL('html5player');
		// if not that then try to get a script that has player in the url
		if (!url) url = getScriptURL('player');
		if (!url) return new Promise(function(resolve, reject) { reject(false); });
	}
	let p = getContent(url);
	return p.then(function(text) {
		let functionName = getDecryptionFunctionName(text);
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
			// Get function name and then wrap the function in decrypt_signature so that we can call it consistently.
			let func = URLToDecryptionFunction[url];
			let funcName = func.slice(4, func.indexOf('=')-1);

			scriptElement.innerText = `decrypt_signature = function(zzzz) {
				${ func }
				return ${ funcName }(zzzz);
			}`;
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
