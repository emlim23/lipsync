// AUDIO CONTEXT
window.AudioContext = window.AudioContext || window.webkitAudioContext ;

if (!AudioContext) alert('This site cannot be run in your Browser. Try a recent Chrome or Firefox. ');

var audioContext = new AudioContext();
var currentBuffer  = null;

// CANVAS
var canvasWidth = 512,  canvasHeight = 120 ;
var newCanvas   = createCanvas (canvasWidth, canvasHeight);
var context     = null;
var waveArr = [];
var highestVocal = 0;
var duration = 0;
var currTime = 0;
var timeIdx = 0;
var mouth = document.getElementById("mouth");
var playPauseBtn = document.getElementById("playPause");
var selection = document.getElementsByName("audioSelect");


// MUSIC LOADER + DECODE
function loadMusic(url) {
  waveArr = [];
  highestVocal = 0;
  duration = 0;
  currTime = 0;
  timeIdx = 0;

  var req = new XMLHttpRequest();
  req.open( "GET", url, true );
  req.responseType = "arraybuffer";
  req.onreadystatechange = function (e) {
        if (req.readyState == 4) {
           if(req.status == 200)
                audioContext.decodeAudioData(req.response,
                  function(buffer) {
                           currentBuffer = buffer;
                           displayBuffer(buffer);
                  }, onDecodeError);
           else
                alert('error during the load.Wrong url or cross origin issue');
        }
  } ;
  req.send();
}

function onDecodeError() {  alert('error while decoding your file.');  }

// MUSIC DISPLAY
function displayBuffer(buff /* is an AudioBuffer */) {
  var leftChannel = buff.getChannelData(0); // Float32Array describing left channel
  var lineOpacity = canvasWidth / leftChannel.length  ;

  var buffWidth = 1000
    , ticker = 0
    , highPoint = 0
    , lowPoint = 0;

  for (var i=0; i<  leftChannel.length; i++) {
    if(ticker < buffWidth){
      highPoint = getHighPoint(leftChannel[i], highPoint);
      lowPoint = getLowPoint(leftChannel[i], lowPoint);
      ticker++;
    }
    else{
      var diff = highPoint - lowPoint;

      waveArr.push({high: highPoint, low: lowPoint, diff: diff});

      if(diff > highestVocal)
        highestVocal = diff;

      highPoint = 0;
      lowPoint = 0;
      ticker = 0;
    }
  }

   for(var c=0; c<waveArr.length; c++){
      waveArr[c].vocal = getVocalRange(waveArr[c].diff);
   }

   // context.restore();
   console.log('done', buff);

   playSound(buff);
}

function getHighPoint(current, highPoint){
  if(current > highPoint)
    return current;
  else
    return highPoint;
}

function getLowPoint(current, lowPoint){
  if(current < lowPoint)
    return current;
  else
    return lowPoint;
}

function getVocalRange(diff){
  var range = (highestVocal+.2) / 6; //.25;

  //these values are just guesses based on the range of the audio I have. There might be a range more than 1.5

  return(Math.floor(diff / range));
}

function createCanvas ( w, h ) {
  var newCanvas = document.createElement('canvas');
  newCanvas.width  = w;     newCanvas.height = h;
  return newCanvas;
};

function playSound(buffer) {
var interval = (buffer.duration / waveArr.length) * 1000;

var source = audioContext.createBufferSource(); // creates a sound source
source.buffer = buffer;                    // tell the source which sound to play
source.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
source.start(0);                           // play the source now
                                           // note: on older systems, may have to use deprecated noteOn(time)

var ticker = setTimeout(function(){
    currTime += interval;

    if(waveArr[timeIdx]){
      mouth.style = "background-image: url('/assets/mouth-"+waveArr[timeIdx].vocal+".jpg');";
    }

    timeIdx++;

    if((currTime / 1000) <= buffer.duration)
      ticker = setTimeout(arguments.callee, interval)
  }, interval);
}

function timeUpdate() {

}

playPauseBtn.onclick = function(){
  var url = "";
  for (var i = 0; i < selection.length; i++) {
    if (selection[i].checked) {
        // do whatever you want with the checked radio
        url = selection[i].value;

        // only one radio can be logically checked, don't check the rest
        break;
    }
  }
  loadMusic(url);
}
