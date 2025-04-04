const API_BASE_URL = window.location.hostname === "localhost" 
? "http://localhost:3000"  // Local server
: "https://contribeat.onrender.com";  // Deployed server

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

var numTimeSteps = 52;
var timeStepCounter = 0;

// var pitches = [57,60,62,64,67,69,72]; // A minor pentatonic scale

var pitches = [60, 62, 66, 69, 71, 74, 76]; // Example: Raga Yaman (C, D, E, F#, G, A, B)
 // Predefined scales
 var scales = {
  major: [60, 62, 64, 65, 67, 69, 71, 72],
  minor: [60, 62, 63, 65, 67, 68, 70, 72],
  pentatonic: [60, 62, 64, 67, 69, 72],
  raag_yaman: [60, 62, 64, 66, 69, 71, 72] // Example: Raag Yaman
};

function updatePitches(inputString) {
  pitches = inputString.split(',').map(num => parseInt(num.trim(), 10)).filter(n => !isNaN(n));
  createSliders();
}

function setScale(scaleName) {
  if (scaleName === "custom") {
      document.getElementById('pitchInput').disabled = false;
  } else {
      pitches = scales[scaleName];
      document.getElementById('pitchInput').value = pitches.join(', ');
      document.getElementById('pitchInput').disabled = true;
  }
  createSliders();
}

function createSliders() {
  let sliderContainer = document.getElementById('sliders');
  sliderContainer.innerHTML = ""; // Clear existing sliders
  
  pitches.forEach((pitch, index) => {
      let sliderDiv = document.createElement('div');
      sliderDiv.innerHTML = `
          <label>Pitch ${index + 1} (MIDI: ${pitch}): </label>
          <input type="range" min="40" max="80" value="${pitch}" oninput="adjustPitch(${index}, this.value)">
          <span>${pitch}</span>
          <br>
      `;
      sliderContainer.appendChild(sliderDiv);
  });
}

function adjustPitch(index, value) {
  pitches[index] = parseInt(value, 10);
  document.querySelectorAll('#sliders span')[index].innerText = value;
}

var cells = [];
var cellWidth, cellHeight;
let data;
let started = false;
const defaultUsername = 'tarunjindal790';
let sketchWidth;
let sketchHeight;

function bpmSliderChange(){
  const bpmSliderValue = document.querySelector('#bpmSlider').value;
  bpm = bpmSliderValue;
  document.querySelector('#bpmSliderLabel').textContent = 'BPM : '+ bpm;
}

function onSearchClick() {
   const usernameVal = document.querySelector('#usernameInput').value;
   loadData(usernameVal);
}

function preload(){
  console.log('preload...')
  const avatarElem = document.querySelector('#githubUserAvatarImg');
  const loader = document.querySelector('#loader');
  const usernameInput = document.querySelector('#usernameInput');
  usernameInput.value = defaultUsername;
  loadData(defaultUsername);
  const defaultScale = document.getElementById('scaleSelect').options[0].value;
  setScale(defaultScale);
}

async function searchUsers() {
  const query = document.getElementById("usernameInput").value.trim();
  if (!query) {
      alert("Please enter a name or username!");
      return;
  }

  document.getElementById("searchResults").innerHTML = "Searching...";

  const res = await fetch(`/searchGithubUsers/${encodeURIComponent(query)}`);
  const users = await res.json();
  console.log("users:", users);

  if ((users.error && users.error.length) || users.length === 0) {
      document.getElementById("searchResults").innerHTML = "No users found!";
      return;
  }

  let resultsHTML = "<p>Select a user:</p><ul>";
  users.forEach(user => {
      resultsHTML += `
          <li>
              <img src="${user.avatarUrl}" width="30" height="30"> 
              <button class="btn btn-link" onclick="fetchUserData('${user.login}')">${user.login}</button>
          </li>
      `;
  });
  resultsHTML += "</ul>";

  document.getElementById("searchResults").innerHTML = resultsHTML;
}

async function fetchUserData(username) {
  // document.getElementById("searchResults").innerHTML = ``;
  loadData(username);
}


async function loadData(username) {
  stopMusic();

  const url = `${API_BASE_URL}/githubData/${username}`;
  loader.classList.add('d-block');

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (!json) {
      throw new Error("No data received");
    }

    data = json;
    console.log("I got data:", data);
    updateUserInfo();
    setup();
  } catch (err) {
    console.error("Failed to fetch user data:", err);
    alert("Failed to load data. Please try again later.");
  } finally {
    loader.classList.remove('d-block');
    loader.classList.add('d-none');
  }
}


function updateUserInfo(){
  const avatarElem = document.querySelector('#githubUserAvatarImg');
  avatarElem.src=data.avatarUrl;
  const userInfoContainer = document.getElementById("userInfo");
    userInfoContainer.innerHTML = `
        <h2>${data.name}</h2>
        <p>${data.bio}</p>
        <p>📍 ${data.location}</p>
        <p>👥 ${data.followers} followers | ${data.following} following</p>
    `;
}

function setup() {
  cellWidth = 12;
  cellHeight = 12;
  cells =[];
  let totalWidth = numTimeSteps * cellWidth;
  let totalHeight = pitches.length * cellHeight;
  sketchHeight = document.querySelector('#sketchContainer').offsetHeight;
  sketchWidth = document.querySelector('#sketchContainer').offsetWidth;

  
let xOffset = Math.max(0, (sketchWidth - totalWidth) / 2);
  if(!data) return;
  
  const myCanvas = createCanvas(sketchWidth, sketchHeight);
  myCanvas.parent("#sketchContainer");
  myCanvas.style("display", "block");
  myCanvas.style("margin", "0 auto");
  frameRate(10);


  for (var i=0; i<numTimeSteps; i++) {
    for (var j=0; j<pitches.length; j++) {
      var x = i * cellWidth + xOffset;
      var y = j * cellHeight;
      var pitch = pitches[pitches.length - j - 1]; // Pitches go from bottom to top
      cells.push(new Cell(createVector(x, y), pitch));
    }
  }
  populateCells();
  // Create a synth to make sound with
  synth = new p5.PolySynth();
  
  // Create SoundLoop with 8th-note-long loop interval
  sloop = new p5.SoundLoop(soundLoop, "16n");
  sloop.bpm = bpm;

  started = true;
}

function populateCells() {
  if (!data || !data.contributions || !data.contributions.contributionCalendar) {
    console.error("Invalid data format");
    return;
  }

  const contributionDays = data.contributions.contributionCalendar.weeks.flatMap(week => week.contributionDays);
  // console.log("Extracted contributionDays:", contributionDays); // Debugging line

  for (let i = 0; i < cells.length; i++) {
    if (i < contributionDays.length) {
      let commitCount = contributionDays[i].contributionCount;
      // console.log(`Cell ${i}: commitCount = ${commitCount}`); // Debugging line

      cells[i].enabled = commitCount > 0;
      cells[i].intensity = commitCount;
      cells[i].enabledColor = getColorValue(commitCount);
      // console.log(`Cell ${i} enabled: ${cells[i].enabled}, color: ${cells[i].enabledColor}`); // Debugging line
    } else {
      // Default state if no corresponding data
      cells[i].enabled = false;
      cells[i].intensity = 0;
      cells[i].enabledColor = COLOR_MAP[0];
    }
  }
}


function onUsernameChange(){
  loadData(this.value());
}

var talaPattern = [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]; // Teentaal

function soundLoop(cycleStartTime) {
  for (var i = 0; i < cells.length; i++) {
    let currentStep = timeStepCounter % numTimeSteps; // Ensure it wraps correctly
    if (Math.floor(i / pitches.length) === currentStep) {
      cells[i].active = true;
      if (cells[i].enabled) {
        // cells[i].active = true;

        var maxIntensity = Math.max(...cells.map(c => c.intensity)); 
        var velocity = map(cells[i].intensity, 0, maxIntensity, 0, 1);
        var quaverSeconds = this._convertNotation('16n');

        // if (talaPattern[timeStepCounter % talaPattern.length]) {
          var pitchIndex = i % pitches.length; 
          var freq = getIndianPitch(pitches[pitchIndex]);
          synth.play(freq, velocity, cycleStartTime, quaverSeconds);
        // }
      }
    }else {
      // ellipse(width / 2, height / 2, 2, 2);
      cells[i].active = false;
    }
  }

  this.bpm = bpm;
  timeStepCounter = (timeStepCounter + 1) % numTimeSteps;
}


function getIndianPitch(midiNote) {
  let microtoneVariation = random(-10, 10); // Small pitch shifts for natural feel
  return midiToFreq(midiNote) * (1 + microtoneVariation / 1000);
}


function draw() {
  // console.log("started:", started);
  if(!started) return;
  background(255);
  let currentStep = timeStepCounter % numTimeSteps;

  // console.log("cells:", cells);
  for (var i=0; i<cells.length; i++) {
    cells[i].checkIfHovered();
    cells[i].display();
  }
  bpm = bpm;
}

function mouseClicked() {
  for (var i=0; i<cells.length; i++) {
    if (cells[i].hovered) {
      cells[i].enabled = !cells[i].enabled;
      cells[i].enabledColor = getColorValue(1); 
    }
  }
}

function togglePlayPause() {
  sloop.isPlaying ? stopMusic() : startMusic();
}

function stopMusic(){
  if(sloop && sloop.isPlaying){
    document.querySelector('#playBtn').classList.toggle('d-none');
    document.querySelector('#pauseBtn').classList.toggle('d-none');
    sloop.stop();
    synth.noteRelease(); 
  }
}

function startMusic(){
  if(sloop){
    document.querySelector('#playBtn').classList.toggle('d-none');
    document.querySelector('#pauseBtn').classList.toggle('d-none');
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

  // Active when soundloop plays the cell
  this.active = false;
  this.activeColor = [230, 255, 255];
  // this.activeColor = [255, 0, 0];

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
