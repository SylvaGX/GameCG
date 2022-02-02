import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

let cameraLookAt = new THREE.Vector3(0, 2, 0);
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 2, 10);
camera.lookAt(cameraLookAt);

// Load the Orbitcontroller
var controls = new OrbitControls( camera, renderer.domElement ); 

controls.target = cameraLookAt;
controls.update();

const scene = new THREE.Scene();

// Load Light
var ambientLight = new THREE.AmbientLight( 0xcccccc );
scene.add( ambientLight );

var directionalLight = new THREE.DirectionalLight( 0xffffff );
directionalLight.position.set( 0, 1, 1 ).normalize();
scene.add( directionalLight );

const loader = new GLTFLoader();

loader.load( './assets/models/Gladiator/scene.gltf', function ( gltf ) {			
	gltf.scene.scale.set( 2, 2, 2 );			   
	gltf.scene.position.x = 0;				    //Position (x = right+ left-) 
    gltf.scene.position.y = 0;				    //Position (y = up+, down-)
	gltf.scene.position.z = 0;				    //Position (z = front +, back-)
	scene.add( gltf.scene );

}, undefined, function ( error ) {

	console.error( error );

} );

function animate() {
	render();
	requestAnimationFrame( animate );
}

function render() {
	renderer.render( scene, camera );
}

render();
animate();

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new HackNSlashDemo();
});