import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from './entities/third-person-camera.js';
import {FreeCameraInput_controller} from './entities/FreeCameraInput-controller.js';
import {entity_manager} from './entities/entity-manager.js';
import {player_entity} from './entities/player-entity.js'
import {entity} from './entities/entity.js';
import {gltf_component} from './entities/gltf-component.js';
import {health_component} from './entities/health-component.js';
import {player_input} from './entities/player-input.js';
import {math} from './entities/math.js';
import {spatial_hash_grid} from './entities/spatial-hash-grid.js';
import {ui_controller} from './entities/ui-controller.js';
import {health_bar} from './entities/health-bar.js';
import {level_up_component} from './entities/level-up-component.js';
import {quest_component} from './entities/quest-component.js';
import {spatial_grid_controller} from './entities/spatial-grid-controller.js';
import {inventory_controller} from './entities/inventory-controller.js';
import {equip_weapon_component} from './entities/equip-weapon-component.js';
import {attack_controller} from './entities/attacker-controller.js';

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
        this._threejs.physicallyCorrectLights = true;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        this._threejs.domElement.id = 'threejs';
		this._DayMaxHours = 300;
		this._DayTime = 0;
  
        document.getElementById('container').appendChild(this._threejs.domElement);
  
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
		this._FreeCamera = false;

		//criar uma scene
		this._scene = new THREE.Scene();
		this._scene.background = new THREE.Color(0xFFFFFF);
		// dar uma visão de fog
		// para que a visão perto da camara seja limpa e de longe pareça com nevoeiro
		this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);
		
		// Criar a luz do sol
		let light = new THREE.DirectionalLight(0xFFFFFF, 1.0); // DirectionalLight(cor, itensidade)
		light.theta = 45.0 * Math.PI / 180;
		light.psi = (((this._DayTime * 360) / this._DayMaxHours) + 180) * Math.PI / 180;
		light.ro = 950;
		light.position.set(light.ro * Math.cos(light.theta) * Math.sin(light.psi), light.ro * Math.cos(light.psi), light.ro * Math.sin(light.theta) * Math.sin(light.psi)); //posição
		light.target.position.set(0, 0, 0); //para aonde aponta
		light.castShadow = true;
		light.shadow.bias = -0.0001;
		light.shadow.mapSize.width = 4096;
		light.shadow.mapSize.height = 4096;
		light.shadow.camera.near = 0.1;
		light.shadow.camera.far = 1900.0;
		light.shadow.camera.left = 300;
		light.shadow.camera.right = -300;
		light.shadow.camera.top = 300;
		light.shadow.camera.bottom = -300;
		this._scene.add(light);

		var cameraHelper = new THREE.CameraHelper(light.shadow.camera);
		this._scene.add(cameraHelper);

		this._sun = light;

		let ambientLight = new THREE.AmbientLight( 0x000000 );
    	this._scene.add( ambientLight );
		this._AmbientLight = ambientLight;

		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(5000, 5000, 10, 10),
			new THREE.MeshStandardMaterial({
				color: 0x1e601c,
			  }));
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
		this._LoadPlayer();

		this._previousRAF = null;
		this._RAF();
	}

	_LoadControllers() {
		const ui = new entity.Entity();
		ui.AddComponent(new ui_controller.UIController());
		this._entityManager.Add(ui, 'ui');
		let localMain = this;

		document.addEventListener("keyup", (event) => {

			if (event.defaultPrevented) {
				return; // Do nothing if the event was already processed
			}
		
			switch (event.key) {
				case "1":
					if(this._FreeCamera){
						const params = {
							camera: localMain._camera,
							scene: localMain._scene,
						};
						var free_cam = this._entityManager.Get('free-camera');
						free_cam.GetComponent("FreeCameraInput").Delete();
						free_cam.SetActive(false);
						var player = this._entityManager.Get('player');
						player.AddComponent(new player_input.BasicCharacterControllerInput(params));

						const camera = new entity.Entity();
						camera.AddComponent(
							new third_person_camera.ThirdPersonCamera({
								camera: this._camera,
								target: this._entityManager.Get('player')}));
						this._entityManager.Add(camera, 'player-camera');
						this._FreeCamera = false;
					}
					break;
				case "2":
					if(!this._FreeCamera){
						this._entityManager.Get('player-camera').SetActive(false);
						let e = this._entityManager.Get('player');
						e.GetComponent('BasicCharacterControllerInput').Delete();

						const camera = new entity.Entity();
						camera.AddComponent(
							new FreeCameraInput_controller.FreeCameraInput({
								camera: localMain._camera}));
						this._entityManager.Add(camera, 'free-camera');
						this._FreeCamera = true;
					}
				default:
					return; // Quit when this doesn't handle the key event.
			}
		
			// Cancel the default action to avoid it being handled twice
			event.preventDefault();

		}, false);

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
		
		this._sky = sky;
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

	_LoadPlayer(){
		const params = {
			camera: this._camera,
			scene: this._scene,
		};

		const levelUpSpawner = new entity.Entity();
		levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({
			camera: this._camera,
			scene: this._scene,
		}));
		this._entityManager.Add(levelUpSpawner, 'level-up-spawner');

		const axe = new entity.Entity();
		axe.AddComponent(new inventory_controller.InventoryItem({
			type: 'weapon',
			damage: 3,
			renderParams: {
			name: 'Axe',
			scale: 0.25,
			icon: 'war-axe-64.png',
			},
		}));
		this._entityManager.Add(axe);

		const sword = new entity.Entity();
		sword.AddComponent(new inventory_controller.InventoryItem({
			type: 'weapon',
			damage: 3,
			renderParams: {
			name: 'Sword',
			scale: 0.25,
			icon: 'pointy-sword-64.png',
			},
		}));
		this._entityManager.Add(sword);

		const player = new entity.Entity();
		player.AddComponent(new player_input.BasicCharacterControllerInput(params));
		player.AddComponent(new player_entity.BasicCharacterController({...params, ...{model: "Knight/Knight.glb"}}));
		player.AddComponent(
		  new equip_weapon_component.EquipWeapon({anchor: 'RightHandIndex1'}));
		player.AddComponent(new inventory_controller.InventoryController(params));
		player.AddComponent(new health_component.HealthComponent({
			updateUI: true,
			health: 100,
			maxHealth: 100,
			strength: 50,
			wisdomness: 5,
			benchpress: 20,
			curl: 100,
			experience: 0,
			level: 1,
		}));
		player.AddComponent(
			new spatial_grid_controller.SpatialGridController({grid: this._grid}));
		player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
		this._entityManager.Add(player, 'player');
	
		player.Broadcast({
			topic: 'inventory.add',
			value: axe.Name,
			added: false,
		});
	
		player.Broadcast({
			topic: 'inventory.add',
			value: sword.Name,
			added: false,
		});
	
		player.Broadcast({
			topic: 'inventory.equip',
			value: sword.Name,
			added: false,
		});

		const camera = new entity.Entity();
		camera.AddComponent(
			new third_person_camera.ThirdPersonCamera({
				camera: this._camera,
				target: this._entityManager.Get('player')}));
		this._entityManager.Add(camera, 'player-camera');
	}

	/***
	 * If windows resize update Procjet matrix
	 */
	_OnWindowResize() {
		this._camera.aspect = window.innerWidth / window.innerHeight;
		this._camera.updateProjectionMatrix();
		this._threejs.setSize(window.innerWidth, window.innerHeight);
	}

	_sigmoid(x){
		return ((1) / (1 + Math.exp(-x)));
	}

	_UpdateSun() {
		//const player = this._entityManager.Get('player');
		//const pos = this._sun.position /*player._position*/;

		//this._sun.theta += timeElapsedS / 16;
		//6 horas equivale a 1 dia
		//3 horas de dia e 3 horas de noite
		this._sun.psi = (((this._DayTime * 360) / this._DayMaxHours) + 180) * Math.PI / 180;

		if(this._sun.psi >= THREE.Math.degToRad(540)){
			this._sun.psi -= 2 * Math.PI;
		}
		else if(this._sun.psi < THREE.Math.degToRad(180)){
			this._sun.psi += 2 * Math.PI;
		}

		this._sun.position.set(this._sun.ro * Math.cos(this._sun.theta) * Math.sin(this._sun.psi), this._sun.ro * Math.cos(this._sun.psi), this._sun.ro * Math.sin(this._sun.theta) * Math.sin(this._sun.psi));
		this._sun.target.position.copy(new THREE.Vector3(0, 0, 0));
		this._sun.updateMatrixWorld();
		this._sun.target.updateMatrixWorld();

		if (this._sun.psi >= THREE.Math.degToRad(270) && this._sun.psi <= THREE.Math.degToRad(450)) {
			//console.log("x: " + ((this._sun.psi - THREE.Math.degToRad(180)) / THREE.Math.degToRad(270)) * 2 * Math.PI);
			//var f = 1.004311 * Math.exp(-Math.pow((((this._sun.psi - THREE.Math.degToRad(180)) / THREE.Math.degToRad(360)) * Math.PI) - 1.55503, 2) / (2 * Math.pow(0.5296424, 2)));
			var f = this._sigmoid(2.5 * (this._sun.psi - THREE.Math.degToRad(180)) - 2.5 * Math.PI) * (1 - this._sigmoid(2.5 * (this._sun.psi - THREE.Math.degToRad(180)) - 2.5 * Math.PI)) * 4
			//var f = Math.abs(Math.sin(((this._sun.psi - THREE.Math.degToRad(180)) / THREE.Math.degToRad(360)) * Math.PI));
			this._sun.intensity = f;
			this._AmbientLight.intensity = f * 0.1;
	
			this._sky.material.uniforms.topColor.value.setRGB(0.25 * f, 0.55 * f, 1 * f);
			this._sky.material.uniforms.bottomColor.value.setRGB(1 * f, 1 * f, 1 * f);
		}
		else {
			// night
			var f = 0;
			this._sun.intensity = f;
			this._AmbientLight.intensity = f * 0.7;
			this._sky.material.uniforms.topColor.value.setRGB(0, 0, 0);
			this._sky.material.uniforms.bottomColor.value.setRGB(0, 0, 0);
		}
		this._AmbientLight.updateMatrixWorld();
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

		this._DayTime += timeElapsedS;

		if(this._DayTime >= this._DayMaxHours){
			this._DayTime -= this._DayMaxHours;
		}

		this._UpdateSun();
		
		this._entityManager.Update(timeElapsedS);
	}
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Main();
});