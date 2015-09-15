var allTracks = [],
    playlist = [],
    i = 0,
    shuffle = false,
    repeat = false,
    timer = 0,
    lastPlayed = [],
    volume = 1;


startPlayerWhenReady();

var dropDiv = $('#drop-here');

$(document).on('dragover', function(event) {
  event.stopPropagation();
  event.preventDefault();
  dropDiv.removeClass('hidden');
});


dropDiv.on('dragleave', function(event) {
  event.stopPropagation();
  event.preventDefault();
  dropDiv.addClass('hidden');
});


dropDiv.on('dragover', function(e) {
	e.stopPropagation();
	e.preventDefault();
	e.originalEvent.dataTransfer.dropEffect = 'copy';
});


dropDiv.on('drop', function(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.originalEvent.dataTransfer.files;
  for(var j = 0; j < files.length; j++){
    if(files[j].type.match(/audio\/(mp3|wav|mpeg)/)){
      getID3Data(files[j], function (song) {
        allTracks.push(song);
        playlist.push(song);
        $('#list').append($(returnTrackHTML(song, playlist.length-1)));
      });
    }
  }
  dropDiv.addClass('hidden');
});


function getID3Data(file, done) {
	getTags(file,function(result){
		result.audioTrack = file;
		result.playing = false;
		done(result);
	});
}


function getTags(file,done){
	var result = {};
	ID3.loadTags(file.name, function() {
		var tags = ID3.getAllTags(file.name);
		result.artist = tags.artist || "Unknown Artist";
		result.title = tags.title || file.name.split('.')[0];
			done(result);
	}, {
		tags: ["artist", "title"],
		dataReader: FileAPIReader(file)
	});
}


var wavesurfer = Object.create(WaveSurfer);


wavesurfer.init({
  container: document.querySelector('#wave'),
  cursorColor: 'gray',
  cursorWidth: 1,
  height: 40,
  waveColor: '#c478ff',
  progressColor: '#f874ff'
});

function readFile(file,done) {
	var reader = new FileReader();
	reader.onload = function(data){
		done(data);
	};
	reader.readAsDataURL(file);
}


function playTrack(num){
	if(playlist[num] && playlist[i]) {
    lastPlayed.push(num);
		var file = playlist[i].audioTrack, result = {};
		readFile(file, function(result){
			result = file;
			wavesurfer.loadBlob(result);
		});
	}
	else{
		wavesurfer.stop();
	}
}


wavesurfer.on('ready', function () {
	wavesurfer.play();
	var duration = wavesurfer.getDuration();

	if(playlist[i]){
		document.title = playlist[i].title + ' - ' + playlist[i].artist; //changes Webpage's title.

		$('#now-play').html('<b>' + playlist[i].title + '</b> by ' + playlist[i].artist);

		$('#current').text('0:00');
		$('#total').text(formatTime(duration));

		clearInterval(timer);
		timer = setInterval(function() {
			$('#current').text(formatTime(wavesurfer.getCurrentTime()));
		}, 1000);

		allTracks.forEach(function (track) {
			track.playing = false;
		});
		playlist[i].playing = true;
	}
});


wavesurfer.on('finish', function () {
	if (shuffle){
    if(repeat == true){
      if(playlist[i]){
        playTrack(i);
      }
    }
    else if(playlist.length > 1){
      var temp = i;
      while(i == temp){
        i = Math.floor(Math.random() * playlist.length);
      }
      if(playlist[i]){
        playTrack(i);
      }
    }
	}
	else {
		if (!repeat) {
			if (i >= playlist.length - 1) {
				wavesurfer.stop();
			}
			else {
				i++;
				playTrack(i);
			}
		}
		else if (repeat == true) {
			if (playlist[i]) {
				playTrack(i);
			}
		}
	}
});


wavesurfer.on('seek', function () {
	$('#current').text(formatTime(wavesurfer.getCurrentTime()));
});

/**************************************/
/*              Controls              */
/**************************************/

function next(){
  if (shuffle) {
    if (playlist.length > 1) {
			var temp = i;
			while (i == temp) {
				i = Math.floor(Math.random() * playlist.length);
			}
		}
	}
	else {
    i++;
		if (i > playlist.length - 1) {
			i = 0;
		}
	}
	if(playlist[i]) {
		playTrack(i);
	}
}

function prev(){
  if(shuffle){
    lastPlayed.pop();
		i = lastPlayed.pop();
	}
	else{
    if(i == 0){
			i = playlist.length-1;
		}
		else{
			i--;
		}
	}
	if(i == undefined || i < 0){
		i = 0;
	}
	playTrack(i);
}

function play_pause(){
  wavesurfer.playPause();
}

function repeat_fun(){
  console.log("in repeat function");
	var that = $('#repeat');
  console.log(that);
  if(that.hasClass('active')){
		that.removeClass('active');
		repeat = false;
	}
	else{
		that.addClass('active');
		repeat = true;
	}
}

function shuffle_fun(){
	var that = $('#shuffle');

	if(that.hasClass('active')){
		that.removeClass('active');
		shuffle = false;
	}
	else{
		that.addClass('active');
		shuffle = true;
	}
}

function mute(){
  var that = $('#mute');
  if(that.hasClass('active')){
    that.removeClass('active');
    volume = 1.0;
    console.log("unmute",volume);
    wavesurfer.setVolume(volume);
  }
  else{
    volume = 0;
    wavesurfer.setVolume(volume);
    that.addClass('active');
  }
}

function stop_fun(){
  wavesurfer.stop();
}

function playlist_fun(){
  var list = $('#list');
  var button = $('#playlist');
  if(list.hasClass('hidden')){
    list.removeClass('hidden');
    button.addClass('active');
  }
  else{
    list.addClass('hidden');
    button.removeClass('active');
  }
}

function volumeUp(){
  if(volume < 1){
    volume += 0.1;
  }
  volume = Math.round(volume * 10) / 10;
  if(volume > 0 && ($('#mute').hasClass('active'))){
    $('#mute').removeClass('active');
  }
  volume = Math.round(volume * 10) / 10;
  console.log("up", volume);
  wavesurfer.setVolume(volume);
}

function volumeDown(){
  if(volume > 0){
    volume -= 0.1;
  }
  volume = Math.round(volume * 10) / 10;
  if(volume > 0 && ($('#mute').hasClass('active'))){
    $('#mute').removeClass('active');
  }
  if(volume == 0){
    var that = $('#mute');
    if(that.hasClass('active')){

    }
    else{
      that.addClass('active');
    }
  }
  volume = Math.round(volume * 10) / 10;
  console.log("down", volume);

  wavesurfer.setVolume(volume);
}

$('#next').on('click', next);

$('#prev').on('click', prev);

$('#play-pause').on('click', play_pause);

$('#repeat').on('click', repeat_fun);

$('#shuffle').on('click', shuffle_fun);

$('#playlist').on('click', playlist_fun);

$('#mute').on('click', mute);

$('#stop').on('click', stop_fun);

wavesurfer.on('play',function(){
  console.log("playing");
  var that = $('#play-pause')
  that.html('<i id="pausebutton" class="fa fa-pause" fa-3x></i>');
});

wavesurfer.on('pause',function(){
  console.log("paused");
  var that = $('#play-pause')
  that.html('<i id="playbutton" class="fa fa-play" fa-3x></i>');
});

wavesurfer.on('finish',function(){
  console.log("finished");
  var that = $('#play-pause')
  that.html('<i id="playbutton" class="fa fa-play" fa-3x></i>');
});

$(document).bind('keypress', function(e) {
	if(e.keyCode == 32){
    play_pause();
	}
  if(e.keyCode == 114){
    repeat_fun();
  }
  if(e.keyCode == 115){
    shuffle_fun();
  }
  if(e.keyCode == 109){
    mute();
  }
  if(e.keyCode == 112){
    playlist_fun();
  }
  if(e.keyCode == 120){
    stop_fun();
  }
});

$(document).bind('keydown', function(e){
  if(e.keyCode == 37){
    prev();
  }
  if(e.keyCode == 39){
    next();
  }
  if(e.keyCode == 38){
    volumeUp();
  }
  if(e.keyCode == 40){
    volumeDown();
  }
});


$('#list').on('click', function (e) {
	var target = $(e.target),
		index = target.closest('.track').data('index');

	if(index!=undefined){

		if(!target.hasClass('remove-track')){
			i = index;
			playTrack(i);
		}
		else{
			var position, track;
			track = playlist[index];
			position = allTracks.indexOf(track);
			if(position != -1) {
				allTracks.splice(position, 1);
			}
			position = playlist.indexOf(track);
			if(position != -1) {
				playlist.splice(position, 1);
			}
			if (track.playing) {
				if (i >= playlist.length) {
					i = 0;
				}
				playTrack(i);
			}

      renderTrackList(playlist);

			if(!playlist.length){
				if(allTracks.length){
					playlist = allTracks.slice(0);
					renderTrackList(playlist);
					i = 0;
					playTrack(i);
				}
				else{
					wavesurfer.empty();
					clearInterval(timer);
          playlist_fun();
          document.title = "Music Player";
					$('#now-play').html('There are no tracks loaded in the player. Drag them here!');
					$('#current').text('-');
					$('#total').text('-');
					startPlayerWhenReady()
				}
			}
		}
	}
});


function startPlayerWhenReady(){
	var interval = setInterval(function () {
		if(playlist[0]){
			playTrack(0);
			clearInterval(interval);
		}
	},200);
}

function returnTrackHTML(song, index){
	var html = '<li class="track';
	if(song.playing){
		html+= ' active'
	}
	html+='" data-index="'+ index +'">' +
	'<div>'	+
	'<span class="title"> <b>' + song.title + '</b></span>' +
	'<span class="artist"> by <i>' + song.artist + '</i></span>' + '<span  class="remove-track">x</span>'
	'</div>' +
	'</li>';
	return html;
}


function renderTrackList(list){
	$('.track').remove();
	var html = list.map(function (tr,index) {
		return returnTrackHTML(tr,index);
	}).join('');
	$('#list').append($(html));
}


function formatTime(time){
	time = Math.round(time);
	var minutes = Math.floor(time / 60), seconds = time - minutes * 60;
	seconds = seconds < 10 ? '0' + seconds : seconds;
	return minutes + ":" + seconds;
}
