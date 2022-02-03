import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {entity_manager} from './entities/entity-manager.js';
import {entity} from './entities/entity.js';
import {gltf_component} from './entities/gltf-component.js';
import {math} from './entities/math.js';
import {spatial_hash_grid} from './entities/spatial-hash-grid.js';
import {ui_controller} from './entities/ui-controller.js';
import {quest_component} from './entities/quest-component.js';
import {spatial_grid_controller} from './entities/spatial-grid-controller.js';

//Vertex Shader for sky
const _VS = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

//Fragment Shader for sky
const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

class Main {

	constructor() {
		this._Initialize();
	}

	_Initialize() {

		//Render threejs
		this._threejs = new THREE.WebGLRenderer({
			antialias: true,
		});
		this._threejs.outputEncoding = THREE.sRGBEncoding;
		this._threejs.gammaFactor = 2.2;
		this._threejs.shadowMap.enabled = true;
		this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
		this._threejs.setPixelRatio(window.devicePixelRatio);
		this._threejs.setSize(window.innerWidth, window.innerHeight);
		this._threejs.domElement.id = 'threejs';

		document.getElementById('container').appendChild(this._threejs.domElement);

		//listener para se for feito resize
		window.addEventListener('resize', () => {
			this._OnWindowResize();
		}, false);

		//Opções para a câmara
		//fov(field of view)
		const fov = 60;
		const aspect = window.innerWidth / window.innerHeight;
		const near = 1.0;
		const far = 10000.0;
		this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this._camera.position.set(25, 10, 25);

		//criar uma scene
		this._scene = new THREE.Scene();
		this._scene.background = new THREE.Color(0xFFFFFF);
		// dar uma visão de fog
		// para que a visão perto da camara seja limpa e de longe pareça com nevoeiro
		this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);
		
		// Criar a luz do sol
		let light = new THREE.DirectionalLight(0xFFFFFF, 1.0); // DirectionalLight(cor, itensidade)
		light.theta = 45.0 * Math.PI / 180;
		light.psi = 0.0 * Math.PI / 180;
		light.ro = 1;
		light.position.set(light.ro * Math.cos(light.theta) * Math.sin(light.psi), light.ro * Math.cos(light.psi), light.ro * Math.sin(light.theta) * Math.sin(light.psi)); //posição
		light.target.position.set(0, 0, 0); //para aonde aponta
		light.castShadow = true;
		light.shadow.bias = -0.001;
		light.shadow.mapSize.width = 4096;
		light.shadow.mapSize.height = 4096;
		light.shadow.camera.near = 0.1;
		light.shadow.camera.far = 1000.0;
		light.shadow.camera.left = 100;
		light.shadow.camera.right = -100;
		light.shadow.camera.top = 100;
		light.shadow.camera.bottom = -100;
		this._scene.add(light);

		this._sun = light;

		//Criar um plano para ser o chão
		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(5000, 5000, 10, 10),
			new THREE.MeshStandardMaterial({
				color: 0x1e601c,
			  })
		);
		plane.castShadow = false;
		plane.receiveShadow = true;
		plane.rotation.x = -Math.PI / 2;
		this._scene.add(plane);

		this._entityManager = new entity_manager.EntityManager();
		this._grid = new spatial_hash_grid.SpatialHashGrid(
			[[-1000, -1000], [1000, 1000]], [100, 100]);

		this._LoadControllers();
		//this._LoadPlayer();
		this._LoadFoliage();
		this._LoadClouds();
		this._LoadSky();

		this._previousRAF = null;
		this._RAF();
	}

	_LoadControllers() {
		const ui = new entity.Entity();
		ui.AddComponent(new ui_controller.UIController());
		this._entityManager.Add(ui, 'ui');
		this._isMoving = false;
		this._x = 0;
		this._y = 0;
		this.CamTheta = 90.0 * Math.PI / 180;
		this.CamPsi = 90.0 * Math.PI / 180;
		this._CamMovFoward = false;
		this._CamMovBackward = false;
		this._CamMovLeft = false;
		this._CamMovRight = false;
		this._CamMovUp = false;
		this._CamMovDown = false;
		let localMain = this;

		//Camera rotation
		document.getElementById('container').addEventListener('mousedown', e => {
			this._x = e.offsetX;
			this._y = e.offsetY;
			this._isMoving = true;
		});

		window.addEventListener('mousemove', e => {
			if (this._isMoving === true) {
				this.CamTheta -= (this._x - e.offsetX > 0) ? 1 * Math.PI / 180 : (this._x - e.offsetX < 0) ? -1 * Math.PI / 180 : 0.0;
				this.CamPsi -= (this._y - e.offsetY > 0) ? 1 * Math.PI / 180 : (this._y - e.offsetY < 0) ? -1 * Math.PI / 180 : 0.0;

				if(this.CamPsi >= Math.PI){
					this.CamPsi = Math.PI - 0.0000001;
				}
				else if(this.CamPsi < 0){
					this.CamPsi = 0.00001;
				}

				if(this.CamTheta >= 2 * Math.PI){
					this.CamTheta -= 2 * Math.PI;
				}
				else if(this.CamTheta < 0){
					this.CamTheta += 2 * Math.PI;
				}

				this._x = e.offsetX;
				this._y = e.offsetY;
			}
		});
		
		window.addEventListener('mouseup', e => {
			if (this._isMoving === true) {
				this._x = 0;
				this._y = 0;
				this._isMoving = false;
			}
		});

		//Inputs wasd & other keys
		window.addEventListener("keydown", function (event) {
			if (event.defaultPrevented) {
			  return; // Do nothing if the event was already processed
			}
		  
			switch (event.key) {
				case "w":
					localMain._CamMovFoward = true;
					break;
				case "s":
					localMain._CamMovBackward = true;
					break;
				case "a":
					localMain._CamMovLeft = true;
					break;
				case "d":
					localMain._CamMovRight = true;
					break;
				case "q":
					localMain._CamMovUp = true;
					break;
				case "e":
					localMain._CamMovDown = true;
					break;
				default:
					return; // Quit when this doesn't handle the key event.
			}
		  
			// Cancel the default action to avoid it being handled twice
			event.preventDefault();
		}, true);

		//Inputs wasd & other keys
		window.addEventListener("keyup", function (event) {
			if (event.defaultPrevented) {
				return; // Do nothing if the event was already processed
			}
			
			switch (event.key) {
				case "w":
					localMain._CamMovFoward = false;
					break;
				case "s":
					localMain._CamMovBackward = false;
					break;
				case "a":
					localMain._CamMovLeft = false;
					break;
				case "d":
					localMain._CamMovRight = false;
					break;
				case "q":
					localMain._CamMovUp = false;
					break;
				case "e":
					localMain._CamMovDown = false;
					break;
				default:
					return; // Quit when this doesn't handle the key event.
			}
			
			// Cancel the default action to avoid it being handled twice
			event.preventDefault();
		}, true);
	}

	_LoadSky() {
		const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
		hemiLight.color.setHSL(0.6, 1, 0.6);
		hemiLight.groundColor.setHSL(0.095, 1, 0.75);
		this._scene.add(hemiLight);

		this._sky = hemiLight;
	
		const uniforms = {
		  "topColor": { value: new THREE.Color(0x0077ff) },
		  "bottomColor": { value: new THREE.Color(0xffffff) },
		  "offset": { value: 33 },
		  "exponent": { value: 0.6 }
		};
		uniforms["topColor"].value.copy(hemiLight.color);
	
		this._scene.fog.color.copy(uniforms["bottomColor"].value);
	
		const skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
		const skyMat = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: _VS,
			fragmentShader: _FS,
			side: THREE.BackSide
		});
	
		const sky = new THREE.Mesh(skyGeo, skyMat);
		this._scene.add(sky);
	}
	
	_LoadClouds() {
		for (let i = 0; i < 20; ++i) {
			const index = math.rand_int(1, 3);
			const pos = new THREE.Vector3(
				(Math.random() * 2.0 - 1.0) * 500,
				160,
				(Math.random() * 2.0 - 1.0) * 500);

			const e = new entity.Entity();
			e.AddComponent(new gltf_component.StaticModelComponent({
				scene: this._scene,
				resourcePath: './assets/models/nature2/GLTF/',
				resourceName: 'Cloud' + index + '.glb',
				position: pos,
				scale: Math.random() * 5 + 10,
				emissive: new THREE.Color(0x808080),
				receiveShadow: true,
				castShadow: true,
			}));
			e.SetPosition(pos);
			this._entityManager.Add(e);
			e.SetActive(false);
		}
	}

	_LoadFoliage() {
		for (let i = 0; i < 100; ++i) {
			const names = [
				'CommonTree_Dead', 'CommonTree',
				'BirchTree', 'BirchTree_Dead',
				'Willow', 'Willow_Dead',
				'PineTree', 
			];
			const name = names[math.rand_int(0, names.length - 1)];
			const index = math.rand_int(1, 5);

			const pos = new THREE.Vector3(
				(Math.random() * 2.0 - 1.0) * 500,
				0,
				(Math.random() * 2.0 - 1.0) * 500);

			const e = new entity.Entity();
			e.AddComponent(new gltf_component.StaticModelComponent({
			scene: this._scene,
			resourcePath: './assets/models/nature/FBX/',
			resourceName: name + '_' + index + '.fbx',
			scale: 0.25,
			emissive: new THREE.Color(0x000000),
			specular: new THREE.Color(0x000000),
			receiveShadow: true,
			castShadow: true,
			}));
			e.AddComponent(
				new spatial_grid_controller.SpatialGridController({grid: this._grid}));
			e.SetPosition(pos);
			this._entityManager.Add(e);
			e.SetActive(false);
		}
	}

	/***
	 * If windows resize update Procjet matrix
	 */
	_OnWindowResize() {
		this._camera.aspect = window.innerWidth / window.innerHeight;
		this._camera.updateProjectionMatrix();
		this._threejs.setSize(window.innerWidth, window.innerHeight);
	}

	_UpdateSun(timeElapsedS) {
		//const player = this._entityManager.Get('player');
		//const pos = this._sun.position /*player._position*/;

		//this._sun.theta += timeElapsedS / 16;
		this._sun.psi += timeElapsedS / 16;

		if(this._sun.psi >= 2 * Math.PI){
			this._sun.psi -= 2 * Math.PI;
		}
		else if(this._sun.psi < 0){
			this._sun.psi += 2 * Math.PI;
		}

		this._sun.position.set(this._sun.ro * Math.cos(this._sun.theta) * Math.sin(this._sun.psi), this._sun.ro * Math.cos(this._sun.psi), this._sun.ro * Math.sin(this._sun.theta) * Math.sin(this._sun.psi));
		this._sun.target.position.copy(new THREE.Vector3(0, 0, 0));
		this._sun.shadow.camera.left = 100;
		this._sun.shadow.camera.right = -100;
		this._sun.shadow.camera.top = 100;
		this._sun.shadow.camera.bottom = -100;
		this._sun.updateMatrixWorld();
		this._sun.target.updateMatrixWorld();
	}

	_RAF() {
		requestAnimationFrame((t) => {
			if (this._previousRAF === null) {
				this._previousRAF = t;
			}
	
			this._RAF();
	
			this._threejs.render(this._scene, this._camera);
			this._Step(t - this._previousRAF);
			this._previousRAF = t;
		});
	}

	_Step(timeElapsed) {
		const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
		
		this._UpdateSun(timeElapsedS);
		
		const direction = new THREE.Vector3();

		direction.z = Number( this._CamMovFoward ) - Number( this._CamMovBackward );
		direction.y = Number( this._CamMovUp ) - Number( this._CamMovDown );
		direction.x = Number( this._CamMovLeft ) - Number( this._CamMovRight );

		if(direction.z == 1){
			this._camera.position.x = this._camera.position.x + Math.cos(this.CamTheta) * Math.sin(this.CamPsi);
			this._camera.position.y = this._camera.position.y + Math.cos(this.CamPsi);
			this._camera.position.z = this._camera.position.z + Math.sin(this.CamTheta) * Math.sin(this.CamPsi);
		}
		else if(direction.z == -1){
			this._camera.position.x = this._camera.position.x - Math.cos(this.CamTheta) * Math.sin(this.CamPsi);
			this._camera.position.y = this._camera.position.y - Math.cos(this.CamPsi);
			this._camera.position.z = this._camera.position.z - Math.sin(this.CamTheta) * Math.sin(this.CamPsi);
		}

		if(direction.y == 1){
			this._camera.position.x = this._camera.position.x - Math.cos(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180);
			this._camera.position.y = this._camera.position.y - Math.cos(this.CamPsi + 90 * Math.PI / 180);
			this._camera.position.z = this._camera.position.z - Math.sin(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180);
		}
		else if(direction.y == -1){
			this._camera.position.x = this._camera.position.x + Math.cos(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180);
			this._camera.position.y = this._camera.position.y + Math.cos(this.CamPsi + 90 * Math.PI / 180);
			this._camera.position.z = this._camera.position.z + Math.sin(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180);
		}

		if(direction.x == 1){
			this._camera.position.x = this._camera.position.x - Math.cos(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi);
			//this._camera.position.y = this._camera.position.y + Math.cos(this.CamPsi);
			this._camera.position.z = this._camera.position.z - Math.sin(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi);
		}
		else if(direction.x == -1){
			this._camera.position.x = this._camera.position.x + Math.cos(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi);
			//this._camera.position.y = this._camera.position.y + Math.cos(this.CamPsi);
			this._camera.position.z = this._camera.position.z + Math.sin(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi);
		}

		/*
		Coordenadas de uma esfera
		x = p * cos(theta) * sin(psi)
		y = p * cos(psi)
		z = p * sin(theta) * sin(psi)

		-----------------------------
		Centra a esfera nas coordenadas da camara
		Fazendo uma rotação local e nao global
		this._camera.position.*
		*/
		this._camera.lookAt(this._camera.position.x + Math.cos(this.CamTheta) * Math.sin(this.CamPsi), this._camera.position.y + Math.cos(this.CamPsi), this._camera.position.z + Math.sin(this.CamTheta) * Math.sin(this.CamPsi));
	
		this._entityManager.Update(timeElapsedS);
	}
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Main();
});