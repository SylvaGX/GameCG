import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

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