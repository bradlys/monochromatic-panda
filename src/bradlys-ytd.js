'use strict';
//Every 500ms, see if we can create the youtube downloader element
setInterval(function(){
    try {
        createYouTubeDownloader();
    } catch (e) {
        BYTDERRORS.push(e);
    }
}, 500);

//logging all errors that occur within the program
var BYTDERRORS = {
    errors: [],
    addError: function(err){
        this.errors.push(err);
        BYTDERRORS.createErrorButton();
    },
    createErrorButton: function(){
        var button = buttonTemplate.cloneNode(true);
        var link = button.querySelector('#bradlys-youtube-downloader-links a').cloneNode(true);
        button.querySelector('#bradlys-youtube-downloader-links').removeChild(button.querySelector('#bradlys-youtube-downloader-links a'));
        //TOBEDONE
    }
};

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
	if (typeof ytplayer === 'undefined' || ytplayer === null
		|| typeof ytplayer.config === 'undefined' || ytplayer.config === null
		|| typeof ytplayer.config.args === 'undefined' || ytplayer.config.args === null
		|| typeof ytplayer.config.args.url_encoded_fmt_stream_map === 'undefined' || ytplayer.config.args.url_encoded_fmt_stream_map === null) {
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
 * @param videos {Array}
 * @returns {Node}
 */
function videosToButton(videos) {
    var button = buttonTemplate.cloneNode(true);
    //For each video, create a corresponding list object and add it to the YTD Element
    var index, video, videoElement;
    var linkTemplate = button.querySelector('#bradlys-youtube-downloader-links-1').cloneNode(true);
    linkTemplate.removeAttribute('id');
    button.querySelector('#bradlys-youtube-downloader-links')
        .removeChild(button.querySelector('#bradlys-youtube-downloader-links-1'));
    var firstLinksPointer = button.querySelector('#bradlys-youtube-downloader-links');
    var nestedLinksPointer = button.querySelector('#bradlys-youtube-downloader-nested-links');
    var firstLinksNestedItem = button.querySelector('#bradlys-youtube-downloader-links-last');
    for (index in videos){
        video = videos[index];
        var visibleText = [];
        if ('height' in video && 'width' in video) {
            visibleText.push(video['width'] + 'x' + video['height'] + 'p');
        } else if ('height' in video) {
            visibleText.push(video['height'] + 'p');
        } else if ('width' in video) {
            visibleText.push(video['width'] + 'x?');
        } else if (!('audio' in video)) {
            visibleText.push('?x?');
        }
        if ('fps' in video) {
            visibleText.push(video['fps'] + 'fps');
        }
        if ('ext' in video) {
            visibleText.push(video['ext']);
        }
        if ('format_note' in video) {
            visibleText.push(video['format_note']);
        }
        if ('abr' in video) {
            visibleText.push(video['abr'] + 'kbps');
        }
        if ('flags' in video) {
            for (var flagIndex in video['flags']) {
                visibleText.push(video['flags'][flagIndex]);
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
	if (!(ytplayer && ytplayer.config && ytplayer.config.args)) {
		return false;
	}
	//grab the videos out of the ytplayer variable
    var videos = [];
    var video, index, YTPlayerVideos;
    if (ytplayer.config.args.url_encoded_fmt_stream_map) {
        YTPlayerVideos = ytplayer.config.args.url_encoded_fmt_stream_map.split(',');
        //parse out the information for each video and put it into the videos variable
        for (index in YTPlayerVideos) {
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
        for (index in YTPlayerVideos) {
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
    var video = {}; var itag = 0; var url = ''; var signature = '';
    for (var elem in currentVideo) {
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
        video['url'] = url;
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
                video['url'] += '&signature=' + decrypt_signature(signature);
            } catch (err) {
                console.log("Issue with decrypting signature for Bradly's YouTube Downloader.");
                return false;
            }
        }
        //add title to url so that the file downloads with a proper title
        video['url'] += '&title=' + videoTitle;
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
