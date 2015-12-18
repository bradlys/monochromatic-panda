function parseDecryptionFunction(url) {
    if (!url) {
        return false;
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            parseScript(url, request.responseText);
        }
    };
    request.open("GET", url);
    request.send();
    return true;
}

function parseScript(url, script){
    if(!script || !url){
        return false;
    }
    var mainExecutionFunctionName = script.match(/\.set\("signature",([^\(]*)\(/);
    if(!mainExecutionFunctionName){
        return false;
    }
    mainExecutionFunctionName = mainExecutionFunctionName[1];
    var mainFunction = parseMethodFromScript(mainExecutionFunctionName, script);
    if(!mainFunction){
        return false;
    }
    var subFunction = parseSubFunctionFromMethodAndScript(mainFunction, mainExecutionFunctionName, script);
    if(!subFunction){
        return false;
    }
    if(mainFunction[mainFunction.length - 1] !== ';'){
        mainFunction += ';';
    }
    if(subFunction[subFunction.length - 1] !== ';'){
        subFunction += ';';
    }
    var decryptionScheme = 'decrypt_signature = function (sig) { ' +
                                subFunction + ' ' +
                                mainFunction +
                                ' return ' + mainExecutionFunctionName + '(sig);};';
    decrypted_signatures[url] = decryptionScheme;
    var scriptElement = document.createElement('script');
    scriptElement.innerText = decryptionScheme;
    scriptElement.onload = function() { this.parentNode.removeChild(this);};
    (document.head||document.documentElement).appendChild(scriptElement);
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
    var methodMatch = haystack.match(new RegExp("(var " + methodName + "={[\\S\\s]*?(?=}};)}};)"), 'm');
    if(!methodMatch) {
        methodMatch = haystack.match(new RegExp("(var " + methodName + "=function\\([\\w$]+\\){[^}]*};)", 'm'));
    }
    if(!methodMatch) {
        methodMatch = haystack.match(new RegExp("(function " + methodName + "\\([\\w$]+\\){[^}]*};)", 'm'));
    }
    if(!methodMatch) {
        methodMatch = haystack.match(new RegExp("(" + methodName + "=function\\([\\w$]+\\){[^}]*})", 'm'));
    }
    if(!methodMatch) {
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
    var methodMatch = haystack.match(new RegExp("function " + methodName + "\\(([\\w$]+)\\){[^}]*};", 'm'));
    if(!methodMatch) {
        methodMatch = haystack.match(new RegExp("var " + methodName + "=function\\(([\\w$]+)\\){[^}]*};", 'm'));
    }
    if(!methodMatch) {
        methodMatch = haystack.match(new RegExp(methodName + "=function\\(([\\w$]+)\\){[^}]*}", 'm'));
    }
    if(!methodMatch) {
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
function parseSubFunctionFromMethodAndScript(method, methodName, script){
    var methodParameter = parseMethodParameterFromScript(methodName, method);
    if(!methodParameter){
        return false;
    }
    methodParameter = regexEscapeString(methodParameter);
    var firstSubFunctionName = method.match(new RegExp("([\\w$]+)\\.[\\w$]+\\(" + methodParameter + "[^)]*\\)", 'm'));
    if(!firstSubFunctionName){
        return false;
    }
    firstSubFunctionName = firstSubFunctionName[1];
    var subFunction = parseMethodFromScript(firstSubFunctionName, script);
    if(!subFunction){
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
function regexEscapeString(string){
    string = string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    return string;
}

function getDecryptSignature(url){
    if(!url || url.length < 1){
        url = '';
        var scripts = document.scripts;
    }
    var regularPlayer = false;
    var i;
    if(url === '') {
        for (i in scripts) {
            if (scripts[i].src && scripts[i].src.indexOf('html5player') !== -1) {
                url = scripts[i].src;
                break;
            }
        }
    }
    if(url === ''){
        for(i in scripts){
            if(scripts[i].src && scripts[i].src.indexOf('player') !== -1){
                url = scripts[i].src;
                regularPlayer = true;
                break;
            }
        }
    }
    if(url === ''){
        console.log("Couldn't parse script URL for Bradly's YouTube Downloader.");
        return false;
    }
    parseDecryptionFunction(url);
}

getDecryptSignature();

var decrypted_signatures = {};

/**
 * Add event listener to DOM to know when the injected script needs the decryption scheme.
 */
document.addEventListener('BYTD_connectExtension', function(e) {
    if(e.detail){
        getDecryptSignature(e.detail);
    }
}, false);

var s = document.createElement('script');
s.src = chrome.extension.getURL('bradlys-ytd.js');
s.onload = function() {
	this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);
