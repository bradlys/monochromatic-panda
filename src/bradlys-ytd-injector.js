function getDecryptSignature(){
    var url = '';
    var regularPlayer = false;
    for(var i in document.scripts){
        if(document.scripts[i].src && document.scripts[i].src.indexOf('html5player') !== -1){
            url = document.scripts[i].src;
            break;
        }
    }
    if(url === ''){
        for(var i in document.scripts){
            if(document.scripts[i].src && document.scripts[i].src.indexOf('player') !== -1){
                url = document.scripts[i].src;
                regularPlayer = true;
                break;
            }
        }
    }
    parseDecryptionFunction(url);
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
        var regexClearMainExecutionFunctionName = mainExecutionFunctionName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        var mainFunction = script.match(new RegExp("(function " + regexClearMainExecutionFunctionName + "\\(([\\w$]+)\\){[^}]*});"));
        if(!mainFunction) {
            mainFunction = script.match(new RegExp("(var " + regexClearMainExecutionFunctionName + "\\=function\\(([\\w$]+)\\){[^}]*});"));
            if(!mainFunction) {
                return '';
            }
        }
        var notNeedle = mainFunction[2];
        mainFunction = mainFunction[1];
        var subFunctions = mainFunction.match(new RegExp("[\\w$]+\\.[\\w$]+\\(" + notNeedle.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + "[^)]*\\)", 'g'));
        if(!subFunctions){
            return '';
        }
        var subFunctionName = subFunctions[0].match(new RegExp('(\\w+)\\.', 'g'))[0].replace('.', '');
        var regexClearSubFunctionName = subFunctionName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        var subFunction = script.match(new RegExp("(var " + regexClearSubFunctionName + "\\={[^}]*})[\\S\\s]*?(?=}};)}};"));
        if(!subFunction){
            subFunction = script.match(new RegExp("(var " + regexClearSubFunctionName + "\\=function\\(([\\w$]+)\\){[^}]*});"));
            if(!subFunction){
                return '';
            }
        }
        subFunction = subFunction[0];
        var decryptionScheme = 'decrypt_signature = function (sig) { ' + subFunction + ' ' + mainFunction + '; return ' + mainExecutionFunctionName + '(sig);};';
        var scriptElement = document.createElement('script');
        scriptElement.innerText = decryptionScheme;
        scriptElement.onload = function() { this.parentNode.removeChild(this);};
        (document.head||document.documentElement).appendChild(scriptElement);
    }
}

getDecryptSignature();

var s = document.createElement('script');
s.src = chrome.extension.getURL('bradlys-ytd.js');
s.onload = function() {
	this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(s);