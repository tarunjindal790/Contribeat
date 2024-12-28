const COLOR_MAP = {
  0: [235,237,240],
  1: [155,233,168],
  2: [64,196,99],
  3: [48,161,78],
  4: [33,110,57]
};

function getColorValue(commitCount){
  if(commitCount<=4) return COLOR_MAP[commitCount];
  else return COLOR_MAP[4];
}
var sloop;
var bpm = 140; // 140 beats per minute

// var numTimeSteps = 16;
var numTimeSteps = 52;
var timeStepCounter = 0;
// var pitches = [57,60,62,64,67,69,72,74,76,79,81,84]; // A minor pentatonic scale

var pitches = [57,60,62,64,67,69,72]; // A minor pentatonic scale

var cells = [];
var cellWidth, cellHeight;
// var controlPanelHeight;
let data;
let started = false;
const defaultUsername = 'tarunjindal790';
let sketchWidth;
let sketchHeight;

// document.querySelector('#bpmSliderLabel').textContent('BPM : '+ bpm);


function bpmSliderChange(){
  const bpmSliderValue = document.querySelector('#bpmSlider').value;
  bpm = bpmSliderValue;
  // document.querySelector('#bpmSliderLabel').textContent('BPM : '+ bpm);
}

function onSearchClick() {
   const usernameVal = document.querySelector('#usernameInput').value;
   loadData(usernameVal);
}

// let sketch = function(p) {
//   p.setup = setup;
//   p.preload = preload;
//   p.draw = draw;
// }

// new p5(sketch, 'sketchContainer')

function preload(){
  console.log('preload...')
  const avatarElem = document.querySelector('#githubUserAvatarImg');
  // const sketchContainer = document.querySelector('#sketchContainer');
  const loader = document.querySelector('#loader');
  const usernameInput = document.querySelector('#usernameInput');
  usernameInput.value = defaultUsername;
  // sketchContainer.hide();
  // loader.show();

  const url = `https://contribeat.onrender.com/githubData/${defaultUsername}`;
  httpGet(url, 'json', false, function(response) {
    data = response;
    avatarElem.src=data.imgLink;
    setup();
    loader.classList.toggle('d-none');
    // sketchContainer.classList.toggle('d-none');
    // sketchContainer.classList.add('d-block');
  });
  
  // loadData(defaultUsername);
  // setup();
}

function loadData(username) {
  const avatarElem = document.querySelector('#githubUserAvatarImg');
  const url = `https://contribeat.onrender.com/githubData/${username}`;
  httpGet(url, 'json', false, function(response) {
    data = response;
    // togglePlayPause();
    populateCells();
    avatarElem.src=data.imgLink;
    // togglePlayPause();
    // setup();
  });
}

function setup() {
  
  if(!data) return;
  sketchHeight = document.querySelector('#sketchContainer').offsetHeight;
  sketchWidth = document.querySelector('#sketchContainer').offsetWidth;
  const myCanvas = createCanvas(sketchWidth, sketchHeight);
  myCanvas.parent("#sketchContainer");
  // controlPanelHeight = 0;
  frameRate(10);

  // Prepare cells
  // cellWidth = width / numTimeSteps;
  // cellHeight = (height) / pitches.length;

  cellWidth = 12;
  cellHeight = 12;

  for (var i=0; i<numTimeSteps; i++) {
    for (var j=0; j<pitches.length; j++) {
      var x = i*cellWidth;
      var y = j*cellHeight;
      var pitch = pitches[pitches.length - j - 1]; // Pitches go from bottom to top
      cells.push(
        new Cell(createVector(x, y), pitch)
      );
    }
  }
  populateCells();
  // Create a synth to make sound with
  synth = new p5.PolySynth();
  
  // Create SoundLoop with 8th-note-long loop interval
  sloop = new p5.SoundLoop(soundLoop, "16n");
  sloop.bpm = bpm;
  
  // UI
  // playPauseButton = createButton('PLAY/PAUSE');
  // playPauseButton.mousePressed(togglePlayPause);
  // playPauseButton.position(0, 0);
  // playPauseButton.size(width/4, controlPanelHeight);

  // tempoSlider = createSlider(30, 300, bpm);
  // tempoSlider.position(width/4, 0);
  // tempoSlider.size(width/4, controlPanelHeight);
  // tempoText = createP("BPM: " + bpm);
  // tempoText.position(width/2, 0);
  // tempoText.size(width/4, controlPanelHeight);
  
  // clearButton = createButton('CLEAR ALL');
  // clearButton.mousePressed(clearAll);
  // clearButton.position(width*3/4, 0);
  // clearButton.size(width/4, controlPanelHeight);

  started = true;
}

function populateCells(){
  const myCells = data.myCells;
  for(let i=0;i<cells.length;i++){
    cells[i].enabled = false;
    cells[i].enabledColor = COLOR_MAP[0];
    if(myCells[i]>0){
      cells[i].enabled = true;
      cells[i].intensity = myCells[i];
      cells[i].enabledColor = getColorValue(cells[i].intensity);
    }
  }
  
}

function onUsernameChange(){
  loadData(this.value());
}

function soundLoop(cycleStartTime) {
  for (var i=0; i<cells.length; i++) {
    if (floor(i / pitches.length) == timeStepCounter) {
      cells[i].active = true;
      if (cells[i].enabled) {
        // Play sound


        // var velocity = 1; // Between 0-1
        var velocity = map(cells[i].intensity,0,Math.max(cells),0,1);
        
        var quaverSeconds = this._convertNotation('16n'); // 8th note = quaver duration
        var freq = midiToFreq(cells[i].pitch);
        synth.play(freq, velocity, cycleStartTime, quaverSeconds);

        // ellipse(width/2, height/2,cells[i].intensity*4,cells[i].intensity*4);
      }
    } else {
      ellipse(width/2, height/2,2,2);
      cells[i].active = false;
    }
  }
  this.bpm = bpm;
  timeStepCounter = (timeStepCounter + 1) % numTimeSteps;
}

function draw() {
  if(!started) return;
  background(255);
  for (var i=0; i<cells.length; i++) {
    cells[i].checkIfHovered();
    cells[i].display();
  }
  // bpm = tempoSlider.value();
  bpm = bpm;
  // tempoText.html("BPM: " + bpm);
}

function mouseClicked() {
  for (var i=0; i<cells.length; i++) {
    if (cells[i].hovered) {
      cells[i].enabled = !cells[i].enabled;
    }
  }
}

function togglePlayPause() {
  if (sloop.isPlaying) {
    sloop.pause();
  } else {
    sloop.start();
  }
}

function clearAll() {
  for (var i=0; i<cells.length; i++) {
    cells[i].enabled = false;
  }
}


var Cell = function(position, pitch) {
  //commit count
  this.intensity = 0;
  
  // Sound
  this.pitch = pitch;
  // Appearance
  this.padding = 2;
  this.position = position.copy();
  this.width = cellWidth - 2 * this.padding;
  this.height = cellHeight - 2 * this.padding;
  // this.defaultColor = [190, 240, 255];
  this.defaultColor = COLOR_MAP[0];
  // Mouse hover
  this.hovered = false;
  this.hoverColor = [230, 255, 255];
  // Enabled when clicked
  this.enabled = false;
  var varyingColorVal = 22 * (this.pitch % pitches.length);
  this.enabledColor = [20 + varyingColorVal, 255 - varyingColorVal, 255];

  // this.enabledColor = getColorValue(this.intensity);

  // Active when soundloop plays the cell
  this.active = false;
  this.activeColor = [230, 255, 255];
}

Cell.prototype.display = function() {
  noStroke();
  if (this.enabled) {
    fill(this.enabledColor[0], this.enabledColor[1], this.enabledColor[2]);
  } else if (this.hovered) {
    fill(this.hoverColor[0], this.hoverColor[1], this.hoverColor[2]);
  } else if (this.active) {
    fill(this.activeColor[0], this.activeColor[1], this.activeColor[2]);
  } else {
    fill(this.defaultColor[0], this.defaultColor[1], this.defaultColor[2]);
  }
  rect(this.position.x + this.padding, this.position.y + this.padding, this.width, this.height);
}

Cell.prototype.checkIfHovered = function() {
  var xMin = this.position.x + this.padding;
  var xMax = xMin + this.width;
  var yMin = this.position.y + this.padding;
  var yMax = yMin + this.height;
  if ((mouseX > xMin && mouseX < xMax) && (mouseY > yMin && mouseY < yMax)) {
    this.hovered = true;
  } else {
    this.hovered = false;
  }
}
