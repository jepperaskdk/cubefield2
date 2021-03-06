
var gamePlaying = true;
var gamePaused = false;
var speed = 1;
var distance = 0;
var currentLevel = 1;


var left = false;
var right = false;

const WIDTH = 800;
const HEIGHT = 600;
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.9;
const FAR = 10000;

const container = document.querySelector('#container');
const renderer = new THREE.WebGLRenderer({antialiasing: true});
const camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
const scene = new THREE.Scene();

// constants for objects
const LENGTH = 50;
const SEGMENTS = 1;

scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);
container.appendChild(renderer.domElement);



const pointLight = new THREE.PointLight(0xFFFFFF);
pointLight.position.x = 0;
pointLight.position.y = 50;
pointLight.position.z = 0;

const ambientLight = new THREE.AmbientLight(0xFFFFFF);
scene.add(ambientLight);
scene.add(pointLight);

//scene.fog = new THREE.FogExp2(0x000000, 0.0028);
//renderer.setClearColor(scene.fog.color, 1);
var groundMaterial = new THREE.MeshBasicMaterial({ color: 0x999999 });
var ground = new THREE.Mesh(
	new THREE.PlaneGeometry(10000, 10000, 32),
	groundMaterial
);
ground.position.y = -10;
ground.rotation.x = -1.57;
scene.add(ground);

camera.position.y = 10;
camera.position.z = 50;
camera.lookAt(new THREE.Vector3(0, 0, 0));

const numSquares = 200;
const SQUARELENGTH = 5;
var squareArray = [];

const driver = new THREE.Mesh(
	new THREE.BoxGeometry(SQUARELENGTH / 3, SQUARELENGTH / 3, SQUARELENGTH / 2, SEGMENTS, SEGMENTS, SEGMENTS),
	new THREE.MeshLambertMaterial({ color: 0x0000ff })
);

driver.position.z = 15;
scene.add(driver);

function createSquare() {
	var sq = new THREE.Mesh(
		new THREE.BoxGeometry(SQUARELENGTH, SQUARELENGTH, SQUARELENGTH / 3, SEGMENTS, SEGMENTS, SEGMENTS),
		getLevelProperties().material
	);
	sq.position.z = 300;
	//sq.position.y = (SQUARELENGTH / 2);
	return sq;
}

function init() {
	squareArray.forEach(function(sq) {
		scene.remove(sq);
	});
	
	squareArray = [];
	distance = 0;
	currentLevel = 1;
	
	for (var i = 0; i < numSquares; i++) {
		var sq = createSquare();
		scene.add(sq);
		squareArray.push(sq);
	}
	
	camera.position.z = 0;
	camera.rotation.z = 0;
	driver.position.z = 0;
	driver.rotation.z = 0;
	gamePaused = false;
	gamePlaying = true;
}

function getRandomFloat(min, max) {
	return Math.random() * (max - min) + min;
}

function cleanSquares() {
	function cleanSquare(sq) {
		if (sq.position.z > camera.position.z) {
			sq.position.z = camera.position.z - 500 - (Math.random() * 500);
			var rndX = getRandomFloat(-1.0, 1.0);
			sq.position.x = camera.position.x + (rndX * 600);
			sq.material = getLevelProperties().material;
		}
	}
	squareArray.forEach(cleanSquare);
}

function updatePositions() {
	pointLight.position.z = camera.position.z;
	ground.position.z = camera.position.z;

	driver.position.z = camera.position.z - 17;
	driver.position.x = camera.position.x;
}

function degToRad(deg) {
	return deg * (Math.PI / 180);
}

function outsideMaxRotate(offset) {
	let rot = camera.rotation.z + offset;
	return rot < -0.3 || rot > 0.3;
}

function updateControls() {
	let oneDegree = degToRad(0.2);
	if (!left && !right) {
		if (Math.abs(camera.rotation.z) <= oneDegree) {
			camera.rotation.z = 0;
			driver.rotation.z = 0;
		}
		else {
			if (camera.rotation.z >= oneDegree) {
				camera.rotation.z = camera.rotation.z - oneDegree;
				driver.rotation.z = driver.rotation.z - oneDegree;
			}
			else if (camera.rotation.z <= oneDegree) {
				camera.rotation.z = camera.rotation.z + oneDegree;
				driver.rotation.z = driver.rotation.z + oneDegree;
			}
		}
	}
	else if (left && !right) {
		camera.position.x -= 0.5;
		if (outsideMaxRotate(oneDegree)) {
			return;
		}
		
		camera.rotation.z += oneDegree;
		driver.rotation.z += oneDegree;
	}
	else if (right && !left) {
		camera.position.x += 0.5;
		if (outsideMaxRotate(-oneDegree)) {
			return;
		}
		
		camera.rotation.z -= oneDegree;
		driver.rotation.z -= oneDegree;
	}
}


function driverCollidesElement(element) {
	var a = new THREE.Box3().setFromObject(driver);
	var b = new THREE.Box3().setFromObject(element);
	return (a.min.x <= b.max.x && a.max.x >= b.min.x) &&
		(a.min.y <= b.max.y && a.max.y >= b.min.y) &&
		(a.min.z <= b.max.z && a.max.z >= b.min.z);
}

function collisionDetection() {
	squareArray.forEach(function(e) {
		if (driverCollidesElement(e)) {
			gamePlaying = false;
			console.log("You lost");
			return;
		}
	});
}

var speedText = document.querySelector('#speed');
var pointText = document.querySelector('#points');
var levelText = document.querySelector('#level');
var fpsText = document.querySelector('#fps');
var FPS = 0, lastTimestamp = 0;
var lastFrame = -1;

function nextColor(multiplier) {
	return multiplier * 20 << 16;
}

function getLevelProperties(level) {
	if (typeof(level) == "undefined") {
		level = currentLevel;
	}
	
	switch (level) {
		// case 1:
			// return {
				// speed: 1,
				// material : new THREE.MeshLambertMaterial({ color: 0xCC0000 }),
				// nextLevelDistance: 1000
			// };
		// case 2:
			// return {
				// speed: 1.5,
				// material: new THREE.MeshLambertMaterial({ color: 0x00CC00 }),
				// nextLevelDistance: 5000
			// };
		// case 3:
			// return {
				// speed: 2.5,
				// material: new THREE.MeshLambertMaterial({ color: 0x0000CC }),
				// nextLevelDistance: 15000
			// };
		default: 
			return {
				speed: level * 2,
				material: new THREE.MeshLambertMaterial({color: nextColor(level)}),
				nextLevelDistance: Math.pow(level, 1.5) * 2000
			};
	}
}

var specialEvent = false;
var specialEventInit = false;

function specialEventF() {
	var distance = 56;
	for (var i = 0; i < 50; i++) {
		var sq1 = createSquare();
		var sq2 = createSquare();
		scene.add(sq1);
		scene.add(sq2);
		sq1.position.x = camera.position.x - distance;
		sq2.position.x = camera.position.x + distance;
		sq1.position.z = camera.position.z - 100 - (i * 10);
		sq2.position.z = camera.position.z - 100 - (i * 10);
		distance--;
	}
	specialEventInit = true;
}

function update(timestamp) {
	if (gamePlaying && !gamePaused) {
		camera.position.z -= getLevelProperties().speed;
		distance += getLevelProperties().speed;
		
		updateControls();
		if (specialEvent) {
			if (!specialEventInit) {
				specialEventF();
			}
		} else {
			cleanSquares();
		}
		updatePositions();

		collisionDetection();
		// Draw!
		renderer.render(scene, camera);

		if (getLevelProperties().nextLevelDistance < distance) {
			currentLevel++;
		}
		
		speedText.innerHTML = getLevelProperties().speed;
		pointText.innerHTML = distance;
		levelText.innerHTML = currentLevel;
		
		FPS = 1000 / (timestamp - lastTimestamp);
		fpsText.innerHTML = FPS;
		lastTimestamp = timestamp;
	}
	
	// Schedule the next frame.
	lastFrame = requestAnimationFrame(update);
}

function UpdateKey(key, down) {
	switch (key) {
		case "a":
			left = down;
			break;
		case "d":
			right = down;
			break;
		case "p":
			if (down) {
				gamePaused = !gamePaused;
			}
			break;
		case "h":
			if (down) {
				window.cancelAnimationFrame(lastFrame);
				init();
				lastFrame = requestAnimationFrame(update);
			}
			break;
	}
}

var body = document.querySelector('body');
body.onkeydown = function (e) {
	UpdateKey(e.key, true);
};
body.onkeyup = function (e) {
	UpdateKey(e.key, false);
};