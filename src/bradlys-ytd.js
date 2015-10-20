//Every 500ms, see if we can create the youtube downloader element
var timerID = setInterval(function(){createYouTubeDownloader();}, 500);

function createYouTubeDownloader() {
	var YTDHolderElement = document.getElementById('watch8-secondary-actions');
	//if we can't find the element to append the button to then we should stop the program and wait for it to load
	if (YTDHolderElement === null) {
		return null;
	}
	//if the element already exists then we don't need this program to run anymore
	if (document.getElementById('bradlys-youtube-downloader') !== null) {
		return null;
	}
	//ytplayer needs to be fully initialized for us to do anything
	if (typeof ytplayer === 'undefined' || ytplayer === null
		|| typeof ytplayer.config === 'undefined' || ytplayer.config === null
		|| typeof ytplayer.config.args === 'undefined' || ytplayer.config.args === null
		|| typeof ytplayer.config.args.url_encoded_fmt_stream_map === 'undefined' || ytplayer.config.args.url_encoded_fmt_stream_map === null) {
		return null;
	}
	var regularAndAdaptiveVideos = getYouTubeVideos();
	//if no videos are returned then we don't need to create the youtube downloader element
	if (regularAndAdaptiveVideos === []) {
		return null;
	}
	//Base YTDElement HTML
	var YTDElement =
	'<div class="yt-uix-menu" id="bradlys-youtube-downloader">' +
		'<button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-menu-trigger yt-uix-tooltip" type="button" onclick=";return false;" aria-pressed="false" role="button" title="Download" aria-haspopup="true" data-tooltip-text="Download" aria-labelledby="yt-uix-tooltip44-arialabel" aria-controls="aria-menu-id-99">' +
			'<span class="yt-uix-button-content">Download</span>' +
		'</button>' + 
		'<div class="yt-uix-menu-content yt-ui-menu-content yt-uix-kbd-nav yt-uix-menu-content-hidden" role="menu" aria-expanded="false" id="aria-menu-id-99" style="min-width: 69px;">' +
			'<ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">';
	//For each video, create a corresponding list object and add it to the YTD Element
	var count = 0;
	for (var raavi in regularAndAdaptiveVideos){
		var videos = regularAndAdaptiveVideos[raavi];
		if (count === 1){
			YTDElement += 
			'<div class="yt-uix-menu">' +
				'<button class="yt-uix-button yt-uix-button-size-default yt-uix-button-opacity yt-uix-button-has-icon no-icon-markup pause-resume-autoplay yt-uix-menu-trigger yt-uix-tooltip" type="button" onclick=";return false;" aria-pressed="false" role="button" title="Alternative Formats (experimental)" aria-haspopup="true" data-tooltip-text="Alternative Formats (experimental)" aria-labelledby="yt-uix-tooltip44-arialabel" aria-controls="aria-menu-id-999">' +
					'<span class="yt-uix-button-content">Alternative Formats (experimental) --></span>' +
				'</button>' + 
				'<div class="yt-uix-menu-content yt-ui-menu-content yt-uix-kbd-nav yt-uix-menu-content-hidden" role="menu" aria-expanded="false" id="aria-menu-id-999" style="min-width: 69px;">' +
					'<ul tabindex="0" class="yt-uix-kbd-nav yt-uix-kbd-nav-list">';
		}
		for (var index in videos) {
			var video = videos[index];
			var url = video.url;
			var visibleText = '';
			if ('height' in video && 'width' in video) {
				visibleText = video['width'] + 'x' + video['height'] + 'p';
			} else if ('height' in video) {
				visibleText = video['height'] + 'p';
			} else if ('width' in video) {
				visibleText = video['width'] + 'x?';
			} else {
				visibleText = '?x?';
			}
			if ('fps' in video) {
				visibleText += ' ' + video['fps'] + 'fps';
			}
			if ('ext' in video) {
				visibleText += ' ' + video['ext'];
			}
			if ('format_note' in video) {
				visibleText += ' ' + video['format_note'];
			}
			if ('abr' in video) {
				visibleText += ' ' + video['abr'] + 'kbps';
			}
			if ('flags' in video) {
				for (var flagIndex in video['flags']) {
					visibleText += ' ' + video['flags'][flagIndex];
				}
			}
			YTDElement += 
			'<li>' +
				'<a href="'+ url + '" type="button" class="yt-ui-menu-item has-icon yt-uix-menu-close-on-select" target="_blank">' +
					'<span class="yt-ui-menu-item-label">' + visibleText + '</span>' +
				'</a>' +
			'</li>';
		}
		if (count === 1){
			YTDElement += '</ul></div></div>';
		}
		count += 1;
	}
	//contain and inject the newly created download element into the page
	YTDElement += '</ul></div></div>';
	YTDHolderElement.innerHTML += YTDElement;
}

//obtains all youtube videos from the ytplayer variable and parses them into an array
function getYouTubeVideos() {
	//Make sure that the ytplayer variable is there and properly initialized
	if (!ytplayer || !ytplayer.config || !ytplayer.config.args || !ytplayer.config.args.url_encoded_fmt_stream_map) {
		return null;
	}
	//video formats information taken from youtube-dl project
	//each number corresponds to a unique type of video format
	var YTVideoFormats = {
		'5': {'ext': 'flv', 'width': 400, 'height': 240},
		'6': {'ext': 'flv', 'width': 450, 'height': 270},
		'13': {'ext': '3gp', 'width': 176, 'height': 144, 'format_note' : 'Mono'},
		'17': {'ext': '3gp', 'width': 176, 'height': 144},
		'18': {'ext': 'mp4', 'width': 640, 'height': 360},
		'22': {'ext': 'mp4', 'width': 1280, 'height': 720},
		'34': {'ext': 'flv', 'width': 640, 'height': 360},
		'35': {'ext': 'flv', 'width': 854, 'height': 480},
		'36': {'ext': '3gp', 'width': 320, 'height': 240},
		'37': {'ext': 'mp4', 'width': 1920, 'height': 1080},
		'38': {'ext': 'mp4', 'width': 4096, 'height': 3072},
		'43': {'ext': 'webm', 'width': 640, 'height': 360},
		'44': {'ext': 'webm', 'width': 854, 'height': 480},
		'45': {'ext': 'webm', 'width': 1280, 'height': 720},
		'46': {'ext': 'webm', 'width': 1920, 'height': 1080},
		'59': {'ext': 'mp4', 'width': 854, 'height': 480},
		'78': {'ext': 'mp4', 'width': 854, 'height': 480},
		//3D videos
		'82': {'ext': 'mp4', 'height': 360, 'format_note': '3D', 'preference': -20},
		'83': {'ext': 'mp4', 'height': 480, 'format_note': '3D', 'preference': -20},
		'84': {'ext': 'mp4', 'height': 720, 'format_note': '3D', 'preference': -20},
		'85': {'ext': 'mp4', 'height': 1080, 'format_note': '3D', 'preference': -20},
		'100': {'ext': 'webm', 'height': 360, 'format_note': '3D', 'preference': -20},
		'101': {'ext': 'webm', 'height': 480, 'format_note': '3D', 'preference': -20},
		'102': {'ext': 'webm', 'height': 720, 'format_note': '3D', 'preference': -20},
		//Apple HTTP Live Streaming
		'92': {'ext': 'mp4', 'height': 240, 'format_note': 'HLS', 'preference': -10},
		'93': {'ext': 'mp4', 'height': 360, 'format_note': 'HLS', 'preference': -10},
		'94': {'ext': 'mp4', 'height': 480, 'format_note': 'HLS', 'preference': -10},
		'95': {'ext': 'mp4', 'height': 720, 'format_note': 'HLS', 'preference': -10},
		'96': {'ext': 'mp4', 'height': 1080, 'format_note': 'HLS', 'preference': -10},
		'132': {'ext': 'mp4', 'height': 240, 'format_note': 'HLS', 'preference': -10},
		'151': {'ext': 'mp4', 'height': 72, 'format_note': 'HLS', 'preference': -10},
		//DASH mp4 video
		'133': {'ext': 'mp4', 'height': 240, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'134': {'ext': 'mp4', 'height': 360, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'135': {'ext': 'mp4', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'136': {'ext': 'mp4', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'137': {'ext': 'mp4', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'138': {'ext': 'mp4', 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'160': {'ext': 'mp4', 'height': 144, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'264': {'ext': 'mp4', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'298': {'ext': 'mp4', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'h264'},
		'299': {'ext': 'mp4', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'h264'},
		'266': {'ext': 'mp4', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'vcodec': 'h264'},
		//DASH mp4 audio
		'139': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 48, 'preference': -50, 'container': 'm4a_dash'},
		'140': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 128, 'preference': -50, 'container': 'm4a_dash'},
		'141': {'ext': 'm4a', 'format_note': 'DASH audio', 'acodec': 'aac', 'vcodec': 'none', 'abr': 256, 'preference': -50, 'container': 'm4a_dash'},
		//Dash webm
		'167': {'ext': 'webm', 'height': 360, 'width': 640, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'168': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'169': {'ext': 'webm', 'height': 720, 'width': 1280, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'170': {'ext': 'webm', 'height': 1080, 'width': 1920, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'218': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'219': {'ext': 'webm', 'height': 480, 'width': 854, 'format_note': 'DASH video', 'acodec': 'none', 'container': 'webm', 'vcodec': 'vp8', 'preference': -40},
		'278': {'ext': 'webm', 'height': 144, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'container': 'webm', 'vcodec': 'vp9'},
		'242': {'ext': 'webm', 'height': 240, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'243': {'ext': 'webm', 'height': 360, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'244': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'245': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'246': {'ext': 'webm', 'height': 480, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'247': {'ext': 'webm', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'248': {'ext': 'webm', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'271': {'ext': 'webm', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'272': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40},
		'302': {'ext': 'webm', 'height': 720, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9'},
		'303': {'ext': 'webm', 'height': 1080, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9'},
		'308': {'ext': 'webm', 'height': 1440, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9'},
		'313': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'vcodec': 'vp9'},
		'315': {'ext': 'webm', 'height': 2160, 'format_note': 'DASH video', 'acodec': 'none', 'preference': -40, 'fps': 60, 'vcodec': 'vp9'},
		//DASH webm audio
		'171': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'abr': 128, 'preference': -50},
		'172': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'abr': 256, 'preference': -50},
		//DASH webm audio with opus inside
		'249': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 50, 'preference': -50},
		'250': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 70, 'preference': -50},
		'251': {'ext': 'webm', 'vcodec': 'none', 'format_note': 'DASH audio', 'acodec': 'opus', 'abr': 160, 'preference': -50}
	}
	//grab the videos out of the ytplayer variable
	var YTPlayerVideos = ytplayer.config.args.url_encoded_fmt_stream_map.split(',');
	var videos = [];
	//get the video title if it exists
	var videoTitle = document.getElementById('watch-headline-title');
	if (videoTitle !== null) {
		videoTitle = escape(videoTitle.children[0].innerText);
	} else {
		videoTitle = 'YouTube Video';
	}
	//parse out the information for each video and put it into the videos variable
	for (var index in YTPlayerVideos) {
		//split up the elements that make up the info for the video element
		var currentVideo = YTPlayerVideos[index].split('&');
		//find the itag, url, and sig elements where applicable
		var video = {}; var itag = 0; var url = ''; var signature = '';
		for (var elem in currentVideo) {
			if (currentVideo[elem].indexOf('itag=') === 0) {
				itag = currentVideo[elem].split('=')[1];
			} else if (currentVideo[elem].indexOf('url=') === 0) {
				url = unescape(currentVideo[elem].split('=')[1]);
			} else if (currentVideo[elem].indexOf('s=') === 0) {
				signature = unescape(currentVideo[elem].split('=')[1]);
			}
		}
		//if we found them then let's fetch the relevant information
		//and add it to the videos list
		if (url !== '' && itag !== 0) {
			video = YTVideoFormats[itag];
			video['url'] = url;
			//if the url contains the signature then we're good
			if (url.indexOf('signature') < 1 && signature !== '') {
				//otherwise we need to decrypt the signature from the signature element we found
				video['url'] += '&signature=' + decrypt_signature(signature);
			}
			//add title to url so that the file downloads with a proper title
			video['url'] += '&title=' + videoTitle;
			videos.push(video);
		}
	}
	//If we have adaptive formats available then let's utilize them, otherwise just return videos.
	if (!ytplayer || !ytplayer.config || !ytplayer.config.args || !ytplayer.config.args.adaptive_fmts) {
		return [videos];
	}
	var regularAndAdaptiveVideos = [videos];
	YTPlayerVideos = ytplayer.config.args.adaptive_fmts.split(',');
	videos = [];
	//parse out the information for each video and put it into the videos variable
	for (var index in YTPlayerVideos) {
		//split up the elements that make up the info for the video element
		var currentVideo = YTPlayerVideos[index].split('&');
		//find the itag, url, and sig elements where applicable
		var video = {}; var itag = 0; var url = ''; var signature = '';
		for (var elem in currentVideo) {
			if (currentVideo[elem].indexOf('itag=') === 0) {
				itag = currentVideo[elem].split('=')[1];
			} else if (currentVideo[elem].indexOf('url=') === 0) {
				url = unescape(currentVideo[elem].split('=')[1]);
			} else if (currentVideo[elem].indexOf('s=') === 0) {
				signature = unescape(currentVideo[elem].split('=')[1]);
			}
		}
		//if we found them then let's fetch the relevant information
		//and add it to the videos list
		if (url !== '' && itag !== 0) {
			video = YTVideoFormats[itag];
			video['url'] = url;
			//if the url contains the signature then we're good
			if (url.indexOf('signature') < 1 && signature !== '') {
				//otherwise we need to decrypt the signature from the signature element we found
				video['url'] += '&signature=' + decrypt_signature(signature);
			}
			//add title to url so that the file downloads with a proper title
			video['url'] += '&title=' + videoTitle;
			videos.push(video);
		}
	}
	regularAndAdaptiveVideos.push(videos);
	return regularAndAdaptiveVideos;
}

//YouTube likes to change this; pulled this straight from their source.
//Decrypts a signature when necessary. Isn't needed sometimes. This is probably going to break /a lot/.
//Last updated on October 6th, 2015
function decrypt_signature(signature) {
	var es={mu:function(a,b){a.splice(0,b)},cY:function(a){a.reverse()},UH:function(a,b){var c=a[0];a[0]=a[b%a.length];a[b]=c}};
	function fs(a){a=a.split("");es.mu(a,2);es.cY(a,15);es.mu(a,3);es.UH(a,54);es.UH(a,60);es.UH(a,55);es.UH(a,65);return a.join("")};
	return fs(signature);
}