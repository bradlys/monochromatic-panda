function getDecryptSignature(){
    var url = '';
    for(var i in document.scripts){
        if(document.scripts[i].src && document.scripts[i].src.indexOf('html5player') !== -1){
            url = document.scripts[i].src;
            break;
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
        var mainExecutionFunctionName = script.match(/\.set\("signature",(\w+)/);
        if(!mainExecutionFunctionName){
            return '';
        }
        mainExecutionFunctionName = mainExecutionFunctionName[1];
        var mainFunction = script.match(new RegExp("(function "+mainExecutionFunctionName+"\\(([\\w$]+)\\){[^}]*});"));
        if(!mainFunction) {
            return '';
        }
        var notNeedle = mainFunction[2];
        mainFunction = mainFunction[1];
        var subFunctions = mainFunction.match(new RegExp("[\\w$]+\\.[\\w$]+\\("+notNeedle+"[^)]*\\)", 'g'));
        var subFunctionName = subFunctions[0].match(new RegExp('(\\w+)\\.', 'g'))[0].replace('.', '');
        var subFunction =  script.match(new RegExp("(var "+subFunctionName+"\\={[^}]*}).*}};"))[0];
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