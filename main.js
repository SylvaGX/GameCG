import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/libs/stats.module.js';
import {Sky} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/objects/Sky.js';

import {third_person_camera} from './entities/third-person-camera.js';
import {FreeCameraInput_controller} from './entities/FreeCameraInput-controller.js';
import {candeeiro} from './entities/candeeiro-component.js';
import {entity_manager} from './entities/entity-manager.js';
import {player_entity} from './entities/player-entity.js'
import {entity} from './entities/entity.js';
import {gltf_component} from './entities/gltf-component.js';
import {health_component} from './entities/health-component.js';
import {player_input} from './entities/player-input.js';
import {npc_entity} from './entities/npc-entity.js';
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
import {castelo} from './entities/castelo-component.js';
import {physics} from './entities/physics-component.js';

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
        this._threejs.localClippingEnabled = true;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        this._threejs.domElement.id = 'threejs';
		this._threejs.toneMapping = THREE.ACESFilmicToneMapping;
		this._DayMaxHours = 60; // por a 300 again
		this._DayTime = 0;
		this._stats = Stats();
		this._insetWidth = window.innerWidth / 4;
  		this._insetHeight = window.innerHeight / 4;

		this.effectController = {
			turbidity: 5,
			rayleigh: 3,
			mieCoefficient: 0.016,
			mieDirectionalG: 0.7,
			elevation: 2,
			azimuth: 180,
			exposure: 0.1002
		};

		document.body.appendChild(this._stats.dom)
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
		this._camera.position.copy(new THREE.Vector3(25, 10, 25));
		this._FreeCamera = false;

		//definições para a camara ortografica
		const nearOrtho = 1.0;
		const farOrtho = 155.0;
		this._cameraOrtho = new THREE.OrthographicCamera(100 / - 2, 100 / 2, 100 / 2, 100 / -2, nearOrtho, farOrtho);
		this._cameraOrtho.position.copy(new THREE.Vector3(0, 145, 0));
		this._cameraOrtho.lookAt(new THREE.Vector3(0, 0, 0));

		//criar uma scene
		this._scene = new THREE.Scene();
		this._scene.background = new THREE.Color(0xFFFFFF);
		
		// Criar a luz do sol
		let sun = new THREE.DirectionalLight(0xFFFF66, 0.0); // DirectionalLight(cor, itensidade)
		sun.theta = 45.0 * Math.PI / 180;
		sun.psi = (((this._DayTime * 360) / this._DayMaxHours) + 180) * Math.PI / 180;
		sun.ro = 950;
		sun.sunPos = new THREE.Vector3().set(sun.ro * Math.cos(sun.theta) * Math.sin(sun.psi), sun.ro * Math.cos(sun.psi), sun.ro * Math.sin(sun.theta) * Math.sin(sun.psi));
		sun.position.copy(sun.sunPos); //posição
		sun.target.position.set(0, 0, 0); //para aonde aponta
		sun.castShadow = true;
		sun.shadow.bias = -0.0001;
		sun.shadow.mapSize.width = 8192;
		sun.shadow.mapSize.height = 8192;
		sun.shadow.camera.near = 0.1;
		sun.shadow.camera.far = 1900.0;
		sun.shadow.camera.left = 300;
		sun.shadow.camera.right = -300;
		sun.shadow.camera.top = 300;
		sun.shadow.camera.bottom = -300;
		
		this._sun = sun;
		this._scene.add(this._sun);
		
		//Adicionar um pouco de luz ambiente
		let ambientLight = new THREE.AmbientLight( 0x908ABA );
    	this._scene.add( ambientLight );
		this._AmbientLight = ambientLight;

		//Ler texturas para o chão
		var grass = new THREE.TextureLoader().load( "./assets/models/textures/grass/Grass_Color.png" );
		var grassNMAP = new THREE.TextureLoader().load( "./assets/models/textures/grass/Grass_NormalGL.png" );
		var grassDisMap = new THREE.TextureLoader().load( "./assets/models/textures/grass/Grass_Displacement.png" );
		var grassAOMap = new THREE.TextureLoader().load( "./assets/models/textures/grass/Grass_AmbientOcclusion.png" );
		var grassRouhgMap = new THREE.TextureLoader().load( "./assets/models/textures/grass/Grass_Roughness.png" );

		grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
		grassNMAP.wrapS = grassNMAP.wrapT = THREE.RepeatWrapping;
		grassDisMap.wrapS = grassDisMap.wrapT = THREE.RepeatWrapping;
		grassRouhgMap.wrapS = grassRouhgMap.wrapT = THREE.RepeatWrapping;
		grassAOMap.wrapS = grassAOMap.wrapT = THREE.RepeatWrapping;

		grass.repeat.set( 200, 200 ); 

		//Criar um plano aplicando as texturas
		const plane = new THREE.Mesh(
			new THREE.PlaneGeometry(5000, 5000, 10, 10),
			new THREE.MeshStandardMaterial({
				map: grass,
				normalMap: grassNMAP,
				displacementMap: grassDisMap,
				aoMap: grassAOMap,
				roughnessMap: grassRouhgMap,
			  }));
		plane.castShadow = false;
		plane.receiveShadow = true;
		plane.rotation.x = -Math.PI / 2;
		this._scene.add(plane);
		
		//Criar um gestor de entidades
		this._entityManager = new entity_manager.EntityManager();

		//Criar uma grid para deteção de colissões e para deteção de entidades
		this._grid = new spatial_hash_grid.SpatialHashGrid(
			[[-1000, -1000], [1000, 1000]], [100, 100]);

		this._LoadControllers();//Criar os comandos
		this._LoadFoliage();//Adicionar folhagem entre outros
		this._LoadClouds();// Adicionar nuvens
        this._LoadSky();//Adicionar um ceu
		this._LoadPlayer();//Adicionar o player, um npc e monstros
		this._timeComplete = 0;
		const myTimeout = setTimeout(()=>{
			this._timeComplete = 1;
		}, 12000);

		this._previousRAF = null;
		this._RAF();//Função para o loop
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
		// Add Sky
		const sky = new Sky();
		sky.scale.setScalar( 450000 );
		this._scene.add( sky );
		this.sky = sky;
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
		const posCan = new THREE.Vector3(
			32,
			0,
			3);

		const e = new entity.Entity();
		e.AddComponent(new candeeiro.Candeeiro({
			scene: this._scene,
		}));

		e.AddComponent(
			new spatial_grid_controller.SpatialGridController({grid: this._grid}));

		e.AddComponent(
			new physics.Physics({distance: 4}));

		e.SetPosition(posCan);
		this._entityManager.Add(e);
		//e.SetActive(false);

		const posCast = new THREE.Vector3(
			100,
			0,
			0);
		const casteloModel = new entity.Entity();
		casteloModel.SetName("Castelo");
		casteloModel.AddComponent(new castelo.Castelo({
			scene: this._scene,
			renderer: this._threejs,
		}));

		casteloModel.AddComponent(
			new spatial_grid_controller.SpatialGridController({grid: this._grid}));

		casteloModel.AddComponent(
			new physics.Physics({distance: 40}));

		casteloModel.SetPosition(posCast);
		this._entityManager.Add(casteloModel, "Castelo");
		//casteloModel.SetActive(false);

		const names = [
			'CommonTree_Dead', 'CommonTree',
			'BirchTree', 'BirchTree_Dead',
			'Willow', 'Willow_Dead',
			'PineTree', 
		];

		for (let i = 0; i < 100; ++i) {

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
				
			e.AddComponent(
				new physics.Physics({distance: 6}));
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

		const girl = new entity.Entity();
		girl.AddComponent(new gltf_component.AnimatedModelComponent({
			scene: this._scene,
			resourcePath: './assets/models/girl/',
			resourceName: 'peasant_girl.fbx',
			resourceAnimation: 'Standing Idle.fbx',
			scale: 0.035,
			receiveShadow: true,
			castShadow: true,
		}));
		girl.AddComponent(new spatial_grid_controller.SpatialGridController({
			grid: this._grid,
		}));
		girl.AddComponent(new player_input.PickableComponent());
		girl.AddComponent(new quest_component.QuestComponent());
		girl.AddComponent(
			new physics.Physics({distance: 4}));
		girl.SetPosition(new THREE.Vector3(37, 0, 12));
		girl.SetQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), -Math.PI/2));
		this._entityManager.Add(girl);

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
		player.AddComponent(
			new physics.Physics({distance: 4}));
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

		const monsters = [
			{
				resourceName: 'Ghost.fbx',
				resourceTexture: 'Ghost_Texture.png',
			},
			{
				resourceName: 'Alien.fbx',
				resourceTexture: 'Alien_Texture.png',
			},
			{
				resourceName: 'Skull.fbx',
				resourceTexture: 'Skull_Texture.png',
			},
			{
				resourceName: 'GreenDemon.fbx',
				resourceTexture: 'GreenDemon_Texture.png',
			},
			{
				resourceName: 'Cyclops.fbx',
				resourceTexture: 'Cyclops_Texture.png',
			},
			{
				resourceName: 'Cactus.fbx',
				resourceTexture: 'Cactus_Texture.png',
			},
		];
		for (let i = 0; i < 50; ++i) {
			
			const m = monsters[math.rand_int(0, monsters.length - 1)];

			const npc = new entity.Entity();
			npc.AddComponent(new npc_entity.NPCController({
				camera: this._camera,
				scene: this._scene,
				resourceName: m.resourceName,
				resourceTexture: m.resourceTexture,
			}));
			npc.AddComponent(
				new health_component.HealthComponent({
					health: 50,
					maxHealth: 50,
					strength: 2,
					wisdomness: 2,
					benchpress: 3,
					curl: 1,
					experience: 0,
					level: 1,
					camera: this._camera,
					scene: this._scene,
				}));
			npc.AddComponent(
				new spatial_grid_controller.SpatialGridController({grid: this._grid}));
			npc.AddComponent(
				new physics.Physics({distance: 4}));
			npc.AddComponent(new health_bar.HealthBar({
				parent: this._scene,
				camera: this._camera,
			}));
			npc.AddComponent(new attack_controller.AttackController({timing: 0.35}));
			npc.SetPosition(new THREE.Vector3(
				(Math.random() * 2 - 1) * 500,
				0,
				(Math.random() * 2 - 1) * 500));
			this._entityManager.Add(npc);
		}
	}

	/***
	 * If windows resize update Procjet matrix
	 */
	_OnWindowResize() {
		this._camera.aspect = window.innerWidth / window.innerHeight;
		this._insetWidth = window.innerHeight / 4;
  		this._insetHeight = window.innerHeight / 4;
		this._cameraOrtho.aspect = this._insetWidth / this._insetHeight;
		this._cameraOrtho.updateProjectionMatrix();
		this._camera.updateProjectionMatrix();
		this._threejs.setSize(window.innerWidth, window.innerHeight);
	}

	_sigmoid(x){
		return ((1) / (1 + Math.exp(-x)));
	}

	_UpdateSun(timeElapsed) {
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

		const uniforms = this.sky.material.uniforms;

		this._sun.sunPos.set(this._sun.ro * Math.cos(this._sun.theta) * Math.sin(this._sun.psi), this._sun.ro * Math.cos(this._sun.psi), this._sun.ro * Math.sin(this._sun.theta) * Math.sin(this._sun.psi));
		this._sun.position.copy(this._sun.sunPos);
		uniforms[ 'sunPosition' ].value.copy( this._sun.sunPos );
		this._sun.target.position.copy(new THREE.Vector3(0, 0, 0));
		this._sun.updateMatrixWorld();
		this._sun.target.updateMatrixWorld();

		if (this._sun.psi >= THREE.Math.degToRad(270) && this._sun.psi <= THREE.Math.degToRad(450)) {//day
			//Função para a rotação o sol
			var f = this._sigmoid(2.5 * (this._sun.psi - THREE.Math.degToRad(180)) - 2.5 * Math.PI) * (1 - this._sigmoid(2.5 * (this._sun.psi - THREE.Math.degToRad(180)) - 2.5 * Math.PI)) * 4;
			this._sun.intensity = f * 5;
			this._AmbientLight.intensity = 1.5 + 6*((this._sun.psi - THREE.Math.degToRad(270)) / (THREE.Math.degToRad(450) - THREE.Math.degToRad(270))) - 6*Math.pow((this._sun.psi - THREE.Math.degToRad(270)) / (THREE.Math.degToRad(450) - THREE.Math.degToRad(270)),2);//(1.5 + 2*f - 34*Math.pow(f,2) + 64*Math.pow(f,3) - 32*Math.pow(f,4));
			if(this._sun.psi <= THREE.Math.degToRad(360))
				this._AmbientLight.color.lerp(new THREE.Color(0xFFFF66), (this._sun.psi - THREE.Math.degToRad(270)) / (THREE.Math.degToRad(360) - THREE.Math.degToRad(270)) );
			else
				this._AmbientLight.color.lerp(new THREE.Color(0x908ABA), -(this._sun.psi - THREE.Math.degToRad(360.0001)) / (THREE.Math.degToRad(450) - THREE.Math.degToRad(360.0001)) + 1);
		}
		else {
			// night
			var f = 0;
			this._sun.intensity = f;

			this._AmbientLight.intensity = 1.5;
			this._AmbientLight.color = new THREE.Color(0x908ABA);
		}
		this._AmbientLight.updateMatrixWorld();

		uniforms[ 'turbidity' ].value = this.effectController.turbidity;
		uniforms[ 'rayleigh' ].value = this.effectController.rayleigh;
		uniforms[ 'mieCoefficient' ].value = this.effectController.mieCoefficient;
		uniforms[ 'mieDirectionalG' ].value = this.effectController.mieDirectionalG;

		this._threejs.toneMappingExposure = this.effectController.exposure;
	}

	_RAF() {
		requestAnimationFrame((t) => {
			if (this._previousRAF === null) {
				this._previousRAF = t;
			}
	
			this._RAF();

			this._threejs.setViewport( 0, 0, window.innerWidth, window.innerHeight);
			this._threejs.setScissor(0, 0, window.innerWidth, window.innerHeight);

			this._threejs.setScissorTest(true);

			this._camera.aspect = window.innerWidth / window.innerHeight;
			this._camera.updateProjectionMatrix();

			this._threejs.render(this._scene, this._camera);
			
			this._threejs.setViewport( window.innerWidth/2.66, window.innerHeight/1.35, window.innerWidth/2 - window.innerWidth/4, window.innerHeight/4);
			this._threejs.setScissor( window.innerWidth/2.66, window.innerHeight/1.35, window.innerWidth/2 - window.innerWidth/4, window.innerHeight/4);

			this._threejs.setScissorTest(true);

			this._cameraOrtho.aspect = window.innerWidth / window.innerHeight;
			this._cameraOrtho.updateProjectionMatrix();

			this._threejs.render(this._scene, this._cameraOrtho);
			
			this._Step(t - this._previousRAF);
			this._previousRAF = t;
		});
	}

	_Step(timeElapsed) {
		const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001) * this._timeComplete;

		this._DayTime += timeElapsedS;

		if(this._DayTime >= this._DayMaxHours){
			this._DayTime -= this._DayMaxHours;
		}

		this._UpdateSun(timeElapsed);
		
		this._entityManager.Update(timeElapsedS);

		let p = this._entityManager.Get('player');

		if(p != null && p != undefined){
			let pos = p._position.clone();
			this._cameraOrtho.position.copy(new THREE.Vector3(pos.x, 145, pos.z));
		}

		this._stats.update()
	}
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new Main();
});