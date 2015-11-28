function parseDecryptionFunction(url) {
    var functionString = '';
    if (!url) {
        return functionString;
    }
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            parseScript(url, request.responseText);
        }
    };
    request.open("GET", url);
    request.send();
    return '';
}

function parseScript(url, script){
    if(!script || !url){
        return '';
    }
    var mainExecutionFunctionName = script.match(/\.set\("signature",(.+)\(/);
    if(!mainExecutionFunctionName){
        return '';
    }
    mainExecutionFunctionName = mainExecutionFunctionName[1];
    var mainFunction = parseMethodFromScript(mainExecutionFunctionName, script);
    if(!mainFunction){
        return '';
    }
    var subFunction = parseSubFunctionFromMethodAndScript(mainFunction, mainExecutionFunctionName, script);
    if(!subFunction){
        return '';
    }
    var decryptionScheme = 'decrypt_signature = function (sig) { ' +
                                subFunction + ' ' +
                                mainFunction +
                                ' return ' + mainExecutionFunctionName + '(sig);};';
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

function getDecryptSignature(){
    var url = '';
    var regularPlayer = false;
    var i;
    for(i in document.scripts){
        if(document.scripts[i].src && document.scripts[i].src.indexOf('html5player') !== -1){
            url = document.scripts[i].src;
            break;
        }
    }
    if(url === ''){
        for(i in document.scripts){
            if(document.scripts[i].src && document.scripts[i].src.indexOf('player') !== -1){
                url = document.scripts[i].src;
                regularPlayer = true;
                break;
            }
        }
    }
    parseDecryptionFunction(url);
}

getDecryptSignature();

var s = document.createElement('script');
s.src = chrome.extension.getURL('bradlys-ytd.js');
s.onload = function() {
	this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);
