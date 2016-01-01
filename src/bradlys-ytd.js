/*global ytplayer, decrypt_signature */
//(function(){
'use strict';
//Every 500ms, see if we can create the youtube downloader element
setInterval(function(){
    try {
        createYouTubeDownloader();
    } catch (e) {
        BYTDERRORS.addError(e);
    }
}, 500);

const BUTTON_APPEND_SELECTOR = '#watch8-secondary-actions';

//logging all errors that occur within the program
var BYTDERRORS = {
    errors: [],
    addError: function(err){
        this.errors.push(err);
        addErrorToView(err);
    }
};

class Item {
    constructor(text, parent) {
        if (typeof text === 'string' ) {
            if (text.length < 0) {
                throw 'Length of 0 String provided for Text.';
            }
        } else {
            throw 'Non-String type provided for Text.';
        }
        this._text = text;
        let randomInt = intGen.next();
        let selector = '#' + intGen;
        while (document.querySelector(selector)) {
            randomInt = intGen.next();
            selector = '#' + intGen;
        }
        this._id = randomInt;
        //this is where things get weird
        if (parent === undefined || parent instanceof Menu) {
            this._parent = parent;
        } else {
            throw 'Incorrect type provided for parent.';
        }
    }
    getText() {
        return this._text;
    }
    getId() {
        return this._id;
    }
    getParent() {
        return this._parent;
    }
    getHTML() {
        let id = this.getId();
        let text = this.getText();
        let linkTemplate =
            `<li id="${id}">
                <span class="yt-ui-menu-item-label">${text}</span>
            </li>`;
        return linkTemplate;
    }
}

class Link extends Item {
    constructor(text, url, parent) {
        super(text, parent);
        if (typeof url === 'boolean') {
            if (url !== false) {
                throw 'True Boolean value provided for URL.';
            }
        } else if (typeof url === 'string') {
            if (url.length < 0) {
                throw 'Length of 0 String provided for URL.';
            }
            if (!validateURL(url)) {
                throw 'Invalid url format provided for URL.';
            }
        } else {
            throw 'Invalid type provided for URL.';
        }
        this._url = url;
    }
    getURL() {
        return this._url;
    }
    getHTML() {
        let id = this.getId();
        let text = this.getText();
        let url = this.getURL();
        let linkTemplate =
            `<li id="${id}">
                <a href="${url}" type="button" class="yt-ui-menu-item has-icon yt-uix-menu-close-on-select">
                    <span class="yt-ui-menu-item-label">${text}</span>
                </a>
            </li>`;
        return linkTemplate;
    }
}

class Menu extends Item {
    constructor(text, parent) {
        super(text, parent);
        this._children = [];
    }
    getChildren() {
        return this._children;
    }
    addChild(item) {
        if ((item instanceof Item) || (item instanceof Link)) {
            if (!this.contains(item)) {
                this._children.push(item);
            }
        } else {
            throw 'Provided item is not an instance of Item or Link.';
        }
    }
    contains(item) {
        if ((item instanceof Item)) {
            for (let child of this.getChildren()) {
                if (item.getId() === child.getId()) {
                    return true;
                }
                if (child instanceof Menu && child.contains(item)) {
                    return true;
                }
            }
            return false;
        } else {
            throw 'Provided item is not an instance of Item.';
        }
    }
    getHTML() {
        let text = this.getText();
        let id = this.getId();
        let items = '';
        for (let child of this.getChildren()) {
            items += child.getHTML();
        }
        let menuTemplate =
            `<button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-menu-trigger yt-uix-tooltip" type="button" onclick="return false;" aria-pressed="false" role="button" title="${text}" aria-haspopup="true" data-tooltip-text="${text}" aria-controls="${id}">
                <span class="yt-uix-button-content">${text}</span>
            </button>
            <div class="yt-uix-menu-content yt-ui-menu-content yt-uix-kbd-nav yt-uix-menu-content-hidden" role="menu" aria-expanded="false" id="${id}" style="min-width: 69px;">
                <ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">
                ${items}
                </ul>
            </div>`;
        return menuTemplate;
    }
}

class UniqueNumberGenerator {
    constructor() {
        this._queue = new Queue();
        this._allEver = {};
    }
    next() {
        let next = this._queue.dequeue();
        if (typeof next !== 'number') {
            let ints = {};
            for (let i = 0; i < 50; i++){
                let randomInt = getRandomIntInclusive(1e+50, 1e+200);
                if (randomInt in ints || randomInt in this._allEver) {
                    i--;
                } else {
                    ints[randomInt] = true;
                }
            }
            for (let key in ints) {
                if (ints.hasOwnProperty(key)) {
                    this._queue.enqueue(key);
                    this._allEver[key] = false;
                }
            }
            next = this._queue.dequeue();
        }
        this._allEver[next] = true;
        return next;
    }
}

class Queue {
    constructor() {
        this._queue = [];
        this._front = 0;
    }
    getLength() {
        return this._queue.length;
    }
    isEmpty() {
        return this._queue.length === 0
    }
    enqueue(item) {
        this._queue.push(item);
    }
    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        let item = this._queue[this._front];
        let length = this.getLength();
        if (length > 25 && (this._front * 2) > length) {
            this._queue = this._queue.slice(this._front+1);
            this._front = 0;
        } else {
            this._front++;
        }
        return item;
    }
    peek() {
        return this.isEmpty() ? undefined : this._queue[this._front];
    }
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function validateURL(textval) {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(textval);
}

function addErrorToView(message) {

}

/**
 * Adds the download button to the view.
 *
 * @param {Menu} menu
 */
function addDownloadButtonToView(menu) {
    if (!(menu instanceof Menu)) {
        throw 'Provided menu is not an instance of Menu.';
    }
    if (downloadButtonExist()) {
        //update? Do nothing?
    }
    let html = menu.getHTML();
    let element = document.createElement('p');
    element.innerHTML = html;
    for (let node of element.childNodes) {
        document.querySelector(BUTTON_APPEND_SELECTOR).appendChild(node);
    }
}

function downloadButtonExist() {
    return document.querySelector(BUTTON_APPEND_SELECTOR) !== null;
}

/**
 * Adds a link to the view. It will add the link to the download button.
 *
 * @param {Link} link - Link to be added to view.
 */
function addLinkToView(link) {

}

/**
 * Business logic for creating the YouTube Downloader. Call this when you want to attempt to create the downloader.
 *
 * @returns {boolean}
 */
function createYouTubeDownloader() {
	var YTDHolderElement = document.getElementById('watch8-secondary-actions');
	//if we can't find the element to append the button to then we should stop the program and wait for it to load
	if (!YTDHolderElement) {
		return false;
	}
	//ytplayer needs to be fully initialized for us to do anything
	if (typeof ytplayer === 'undefined' || typeof ytplayer.config === 'undefined' || typeof ytplayer.config.args === 'undefined' || typeof ytplayer.config.args.url_encoded_fmt_stream_map === 'undefined') {
		return false;
	}
    var existingElement = document.getElementById('bradlys-youtube-downloader');
    //if the element already exists and there's no errors then we don't need this program to run anymore
    if (existingElement && existingElement.getAttribute('class').indexOf('bytd-error') === -1) {
        return false;
    }
    //get the video title if it exists
    videoTitle = document.getElementById('watch-headline-title');
    if (videoTitle) {
        videoTitle = encodeURIComponent(videoTitle.children[0].innerText);
    } else {
        videoTitle = 'YouTube Video';
    }
	var videos = getYouTubeVideos();
	//if no videos are returned then we don't need to create the youtube downloader element
	if (!videos || videos.length < 1) {
        //actually, we want to put up an error element instead
        BYTDERRORS.addError('Issue retrieving videos. Returned empty.');
		return false;
	}
    var YTDElement = videosToButton(videos);
    if (!YTDElement || YTDElement.length < 1) {
        //log something, maybe put up false downloader to report a problem
        BYTDERRORS.addError('Issue converting videos to element.');
        return false;
    }
	YTDHolderElement.appendChild(YTDElement);
}

/**
 * Converts parsed videos Array into HTML Element used for downloading the videos.
 *
 * @param {Array} videos
 * @returns {Node}
 */
function videosToButton(videos) {
    var button = buttonTemplate.cloneNode(true);
    //For each video, create a corresponding list object and add it to the YTD Element
    var index, video, videoElement, visibleText, flagIndex;
    var linkTemplate = button.querySelector('#bradlys-youtube-downloader-links-1').cloneNode(true);
    linkTemplate.removeAttribute('id');
    button.querySelector('#bradlys-youtube-downloader-links')
        .removeChild(button.querySelector('#bradlys-youtube-downloader-links-1'));
    var firstLinksPointer = button.querySelector('#bradlys-youtube-downloader-links');
    var nestedLinksPointer = button.querySelector('#bradlys-youtube-downloader-nested-links');
    var firstLinksNestedItem = button.querySelector('#bradlys-youtube-downloader-links-last');
    for (index = 0; index < videos.length; index++) {
        video = videos[index];
        visibleText = [];
        if ('height' in video && 'width' in video) {
            visibleText.push(video.width + 'x' + video.height + 'p');
        } else if ('height' in video) {
            visibleText.push(video.height + 'p');
        } else if ('width' in video) {
            visibleText.push(video.width + 'x?');
        } else if (!('audio' in video)) {
            visibleText.push('?x?');
        }
        if ('fps' in video) {
            visibleText.push(video.fps + 'fps');
        }
        if ('ext' in video) {
            visibleText.push(video.ext);
        }
        if ('format_note' in video) {
            visibleText.push(video.format_note);
        }
        if ('abr' in video) {
            visibleText.push(video.abr + 'kbps');
        }
        if ('flags' in video) {
            for (flagIndex = 0; flagIndex < video.flags.length; flagIndex++) {
                visibleText.push(video.flags[flagIndex]);
            }
        }
        if ('video' in video && !('audio' in video)) {
            visibleText.push('VO');
        } else if (!('video' in video) && 'audio' in video) {
            visibleText.push('AO');
        }
        visibleText = visibleText.join(' ');
        videoElement = linkTemplate.cloneNode(true);
        videoElement.getElementsByTagName('span')[0].innerText = visibleText;
        videoElement.getElementsByTagName('a')[0].setAttribute('href', video.url);
        if ('video' in video && 'audio' in video) {
            firstLinksPointer.insertBefore(videoElement, firstLinksNestedItem);
        } else {
            videoElement.getElementsByTagName('a')[0].setAttribute('target', '_blank');
            nestedLinksPointer.appendChild(videoElement);
        }
    }
    return button;
}

/**
 * Gets YouTube videos out of YouTube's state and returns an array of all videos with relevant information.
 *
 * @returns {Array|boolean}
 */
function getYouTubeVideos() {
	//Make sure that the ytplayer variable is there and properly initialized
	if (!(typeof ytplayer !== 'undefined' && typeof ytplayer.config !== 'undefined' && typeof ytplayer.config.args !== 'undefined')) {
		return false;
	}
	//grab the videos out of the ytplayer variable
    var videos = [];
    var video, index, YTPlayerVideos;
    if (ytplayer.config.args.url_encoded_fmt_stream_map) {
        YTPlayerVideos = ytplayer.config.args.url_encoded_fmt_stream_map.split(',');
        //parse out the information for each video and put it into the videos variable
        for (index = 0; index < YTPlayerVideos.length; index++) {
            video = parseVideoURIIntoObject(YTPlayerVideos[index]);
            if (video) {
                videos.push(video);
            }
        }
    }
	//If we don't have adaptive formats available then just return videos we have so far.
	if (ytplayer.config.args.adaptive_fmts) {
        YTPlayerVideos = ytplayer.config.args.adaptive_fmts.split(',');
        //parse out the information for each video and put it into the videos variable
        for (index = 0; index < YTPlayerVideos.length; index++) {
            video = parseVideoURIIntoObject(YTPlayerVideos[index]);
            if (video) {
                videos.push(video);
            }
        }
	}
	return videos.length > 0 ? videos : false;
}

/**
 * Parses video URIs presented in the ytplayer variable into a digestable key/value object.
 * Also preps the object for being consumed by the createYoutubeDownloader function.
 *
 * @param {string} URI
 * @returns {object}
 */
function parseVideoURIIntoObject(URI) {
    //split parameters from URI to obtain all information
    var currentVideo = URI.split('&');
    if(currentVideo.length < 3){
        return false;
    }
    //find the itag, url, and signature elements where applicable
    var video = {}; var itag = 0; var url = ''; var signature = ''; var elem;
    for (elem = 0; elem < currentVideo.length; elem++) {
        if (currentVideo[elem].indexOf('itag=') === 0) {
            itag = currentVideo[elem].split('=')[1];
        } else if (currentVideo[elem].indexOf('url=') === 0) {
            url = decodeURIComponent(currentVideo[elem].split('=')[1]);
        } else if (currentVideo[elem].indexOf('s=') === 0) {
            signature = decodeURIComponent(currentVideo[elem].split('=')[1]);
        }
    }
    //if we found them then let's fetch the relevant information
    //and add it to the videos list
    if (url.length > 0 && itag !== 0) {
        //copy base itag information over
        video = YTVideoFormats[itag];
        //add in the URL
        video.url = url;
        //if the url doesn't contain the signature then we need to add it to the URL
        if (url.indexOf('signature') < 1 && signature.length > 0) {
            try {
                if(!(ytplayer.config.assets.js in dispatchedEvents)){
                    var event = new CustomEvent('BYTD_connectExtension',{
                        detail: ytplayer.config.assets.js
                    });
                    document.dispatchEvent(event);
                    dispatchedEvents[ytplayer.config.assets.js] = true;
                }
                //and if we have to add it then we need to decrypt it too
                //This is the single biggest source of the entire thing breaking.
                if (typeof decrypt_signature === 'undefined' || !decrypt_signature) {
                    return false;
                }
                video.url += '&signature=' + decrypt_signature(signature);
            } catch (err) {
                console.log("Issue with decrypting signature for Bradly's YouTube Downloader.");
                return false;
            }
        }
        //add title to url so that the file downloads with a proper title
        video.url += '&title=' + videoTitle;
    } else {
        //if we didn't find the URL or itag then something is wrong.
        console.log("Bradly's YouTube Downloader did not find an itag and/or URL for a video.");
        BYTDERRORS.addError("URI Parsing Issue w/ URI: " + URI);
        return false;
    }
    return video;
}

var videoTitle = 'YouTube Video';

var buttonTemplate = document.createElement('div');
buttonTemplate.id = "bradlys-youtube-downloader";
buttonTemplate.className = 'yt-uix-menu';
buttonTemplate.innerHTML =
    '<button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-menu-trigger yt-uix-tooltip" type="button" onclick="return false;" aria-pressed="false" role="button" title="Download" aria-haspopup="true" data-tooltip-text="Download" aria-labelledby="yt-uix-tooltip44-arialabel" aria-controls="aria-menu-id-99">' +
        '<span class="yt-uix-button-content">Download</span>' +
    '</button>' +
    '<div class="yt-uix-menu-content yt-ui-menu-content yt-uix-kbd-nav yt-uix-menu-content-hidden" role="menu" aria-expanded="false" id="aria-menu-id-99" style="min-width: 69px;">' +
        '<ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list" id="bradlys-youtube-downloader-links">' +
            '<li id="bradlys-youtube-downloader-links-1">' +
                '<a href="" type="button" class="yt-ui-menu-item has-icon yt-uix-menu-close-on-select">' +
                    '<span class="yt-ui-menu-item-label"></span>' +
                '</a>' +
            '</li>' +
            '<li id="bradlys-youtube-downloader-links-last">' +
                '<div class="yt-uix-menu">' +
                    '<button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-menu-trigger yt-uix-tooltip" type="button" onclick="return false;" aria-pressed="false" role="button" title="Alternative Formats (experimental)" aria-haspopup="true" data-tooltip-text="Alternative Formats (experimental)" aria-labelledby="yt-uix-tooltip44-arialabel" aria-controls="aria-menu-id-999">' +
                        '<span class="yt-uix-button-content">Alternative Formats (experimental) --></span>' +
                    '</button>' +
                    '<div class="yt-uix-menu-content yt-ui-menu-content yt-uix-kbd-nav yt-uix-menu-content-hidden" role="menu" aria-expanded="false" id="aria-menu-id-999" style="min-width: 69px;">' +
                        '<ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list" id="bradlys-youtube-downloader-nested-links">' +
                        '</ul>' +
                    '</div>' +
                '</div>' +
            '</li>' +
        '</ul>' +
    '</div>';

//URLs we have dispatched events for, we don't want to duplicate event calls too often.
var dispatchedEvents = {};

//video formats information taken from youtube-dl project
//each number corresponds to a unique type of video format
var YTVideoFormats = {
    '5': {'ext': 'flv', 'width': 400, 'height': 240, 'audio': true, 'video': true},
    '6': {'ext': 'flv', 'width': 450, 'height': 270, 'audio': true, 'video': true},
    '13': {'ext': '3gp', 'width': 176, 'height': 144, 'format_note' : 'Mono', 'audio': true, 'video': true},
    '17': {'ext': '3gp', 'width': 176, 'height': 144, 'audio': true, 'video': true},
    '18': {'ext': 'mp4', 'width': 640, 'height': 360, 'audio': true, 'video': true},
    '22': {'ext': 'mp4', 'width': 1280, 'height': 720, 'audio': true, 'video': true},
    '34': {'ext': 'flv', 'width': 640, 'height': 360, 'audio': true, 'video': true},
    '35': {'ext': 'flv', 'width': 854, 'height': 480, 'audio': true, 'video': true},
    '36': {'ext': '3gp', 'width': 320, 'height': 240, 'audio': true, 'video': true},
    '37': {'ext': 'mp4', 'width': 1920, 'height': 1080, 'audio': true, 'video': true},
    '38': {'ext': 'mp4', 'width': 4096, 'height': 3072, 'audio': true, 'video': true},
    '43': {'ext': 'webm', 'width': 640, 'height': 360, 'audio': true, 'video': true},
    '44': {'ext': 'webm', 'width': 854, 'height': 480, 'audio': true, 'video': true},
    '45': {'ext': 'webm', 'width': 1280, 'height': 720, 'audio': true, 'video': true},
    '46': {'ext': 'webm', 'width': 1920, 'height': 1080, 'audio': true, 'video': true},
    '59': {'ext': 'mp4', 'width': 854, 'height': 480, 'audio': true, 'video': true},
    '78': {'ext': 'mp4', 'width': 854, 'height': 480, 'audio': true, 'video': true},
    //3D videos
    '82': {'ext': 'mp4', 'height': 360, 'format_note': '3D', 'preference': -20, 'video': true},
    '83': {'ext': 'mp4', 'height': 480, 'format_note': '3D', 'preference': -20, 'video': true},
    '84': {'ext': 'mp4', 'height': 720, 'format_note': '3D', 'preference': -20, 'video': true},
    '85': {'ext': 'mp4', 'height': 1080, 'format_note': '3D', 'preference': -20, 'video': true},
    '100': {'ext': 'webm', 'height': 360, 'format_note': '3D', 'preference': -20, 'video': true},
    '101': {'ext': 'webm', 'height': 480, 'format_note': '3D', 'preference': -20, 'video': true},
    '102': {'ext': 'webm', 'height': 720, 'format_note': '3D', 'preference': -20, 'video': true},
    //Apple HTTP Live Streaming
    '92': {'ext': 'mp4', 'height': 240, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '93': {'ext': 'mp4', 'height': 360, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '94': {'ext': 'mp4', 'height': 480, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '95': {'ext': 'mp4', 'height': 720, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '96': {'ext': 'mp4', 'height': 1080, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '132': {'ext': 'mp4', 'height': 240, 'format_note': 'HLS', 'preference': -10, 'video': true},
    '151': {'ext': 'mp4', 'height': 72, 'format_note': 'HLS', 'preference': -10, 'video': true},
    //DASH mp4 video
    '133': {'ext': 'mp4', 'height': 240, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '134': {'ext': 'mp4', 'height': 360, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '135': {'ext': 'mp4', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '136': {'ext': 'mp4', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '137': {'ext': 'mp4', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '138': {'ext': 'mp4', 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '160': {'ext': 'mp4', 'height': 144, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '264': {'ext': 'mp4', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '298': {'ext': 'mp4', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'h264', 'video': true},
    '299': {'ext': 'mp4', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'h264', 'video': true},
    '266': {'ext': 'mp4', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'vcodec': 'h264', 'video': true},
    //DASH mp4 audio
    '139': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 48, 'preference': -50, 'container': 'm4a_dash', 'audio': true},
    '140': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 128, 'preference': -50, 'container': 'm4a_dash', 'audio': true},
    '141': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 256, 'preference': -50, 'container': 'm4a_dash', 'audio': true},
    //Dash webm
    '167': {'ext': 'webm', 'height': 360, 'width': 640, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '168': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '169': {'ext': 'webm', 'height': 720, 'width': 1280, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '170': {'ext': 'webm', 'height': 1080, 'width': 1920, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '218': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '219': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40, 'video': true},
    '278': {'ext': 'webm', 'height': 144, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'container': 'webm', 'vcodec': 'vp9', 'video': true},
    '242': {'ext': 'webm', 'height': 240, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '243': {'ext': 'webm', 'height': 360, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '244': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '245': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '246': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '247': {'ext': 'webm', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '248': {'ext': 'webm', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '271': {'ext': 'webm', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '272': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'video': true},
    '302': {'ext': 'webm', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9', 'video': true},
    '303': {'ext': 'webm', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9', 'video': true},
    '308': {'ext': 'webm', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9', 'video': true},
    '313': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'vcodec': 'vp9', 'video': true},
    '315': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9', 'video': true},
    //DASH webm audio
    '171': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'abr': 128, 'preference': -50, 'audio': true},
    '172': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'abr': 256, 'preference': -50, 'audio': true},
    //DASH webm audio with opus inside
    '249': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 50, 'preference': -50, 'audio': true},
    '250': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 70, 'preference': -50, 'audio': true},
    '251': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 160, 'preference': -50, 'audio': true}
};

let intGen = new UniqueNumberGenerator();
//})();
