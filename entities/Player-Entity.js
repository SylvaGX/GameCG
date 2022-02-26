import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js';

import {entity} from './entity.js';
import {finite_state_machine} from './finite-state-machine.js';
import {player_state} from './player-state.js';

export const player_entity = (() => {

	class CharacterFSM extends finite_state_machine.FiniteStateMachine {
	  constructor(proxy) {
		super();
		this._proxy = proxy;
		this._Init();
	  }
	
	  _Init() {
		this._AddState('idle', player_state.IdleState);
		this._AddState('walk', player_state.WalkState);
		this._AddState('walk_back', player_state.WalkBackState);
		this._AddState('run', player_state.RunState);
		this._AddState('run_back', player_state.RunBackState);
		this._AddState('attack', player_state.AttackState);
		this._AddState('death', player_state.DeathState);
	  }
	};
	
	class BasicCharacterControllerProxy {
	  constructor(animations) {
		this._animations = animations;
	  }
	
	  get animations() {
		return this._animations;
	  }
	};
  
  
	class BasicCharacterController extends entity.Component {
	  constructor(params) {
		super();
		this._Init(params);
	  }
  
	  _Init(params) {
		this._params = params;
		this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
		this._acceleration = new THREE.Vector3(1, 0.125, 50.0);
		this._velocity = new THREE.Vector3(0, 0, 0);
		this._position = new THREE.Vector3();
	
		this._animations = {};
		this._stateMachine = new CharacterFSM(
			new BasicCharacterControllerProxy(this._animations));
	
		this._LoadModels(params.model);
	  }
  
	  InitComponent() {
		this._RegisterHandler('health.death', (m) => { this._OnDeath(m); });
	  }
  
	  _OnDeath(msg) {
		this._stateMachine.SetState('death');
	  }
  
	  _LoadModels(model) {
		const loader = new GLTFLoader();
		console.log(model);
		loader.load('./assets/models/' + model, (glb) => {
			this._target = glb.scene;
			this._target.scale.setScalar(5);
			this._params.scene.add(this._target);
			this._target.visible = false;
		
			this._bones = {};

			this._target.traverse(c => {
				if (!c.skeleton) {
					return;
				}

				for (let b of c.skeleton.bones) {
					this._bones[b.name] = b;
				}
			});
  
			this._target.traverse(c => {
				c.castShadow = true;
				c.receiveShadow = true;
				if (c.material && c.material.map) {
					c.material.map.encoding = THREE.sRGBEncoding;
				}
			});
  
		  	this._mixer = new THREE.AnimationMixer(this._target);

			const _FindAnim = (animName) => {
				for (let i = 0; i < glb.animations.length; i++) {
					if (glb.animations[i].name.includes(animName)) {
						const clip = glb.animations[i];
						const action = this._mixer.clipAction(clip);
						return {
							clip: clip,
							action: action
						}
					}
				}
				return null;
			};

			this._animations['idle'] = _FindAnim('Idle');
			this._animations['walk'] = _FindAnim('Walk');
			this._animations['walk_back'] = _FindAnim('Walk_Back');
			this._animations['run_back'] = _FindAnim('Run_Back');
			this._animations['run'] = _FindAnim('Run');
			this._animations['death'] = _FindAnim('Death');
			this._animations['attack'] = _FindAnim('Attack');

			this._target.visible = true;

			this._stateMachine = new CharacterFSM(
				new BasicCharacterControllerProxy(this._animations));
	
			this._stateMachine.SetState('idle');

			this.Broadcast({
				topic: 'load.character',
				model: this._target,
				bones: this._bones,
			});
		});
	  }
  
	  _FindIntersections(pos) {
		const _IsAlive = (c) => {
		  const h = c.entity.GetComponent('HealthComponent');
		  if (!h) {
			return true;
		  }
		  return h._health > 0;
		};
  
		const grid = this.GetComponent('SpatialGridController');
		const nearby = grid.FindNearbyEntities(5).filter(e => _IsAlive(e));
		const collisions = [];
  
		for (let i = 0; i < nearby.length; ++i) {
		  const e = nearby[i].entity;
		  const d = ((pos.x - e._position.x) ** 2 + (pos.z - e._position.z) ** 2) ** 0.5;
  
		  // HARDCODED
		  if (d <= 4) {
			collisions.push(nearby[i].entity);
		  }
		}
		return collisions;
	  }
  
	  Update(timeInSeconds) {
		if (!this._stateMachine._currentState) {
		  return;
		}
  
		const input = this.GetComponent('BasicCharacterControllerInput');
		this._stateMachine.Update(timeInSeconds, input);
  
		if (this._mixer) {
		  this._mixer.update(timeInSeconds);
		}
  
		// HARDCODED
		if (this._stateMachine._currentState._action) {
		  this.Broadcast({
			topic: 'player.action',
			action: this._stateMachine._currentState.Name,
			time: this._stateMachine._currentState._action.time,
		  });
		}
  
		const currentState = this._stateMachine._currentState;
		if (currentState.Name != 'walk' &&
			currentState.Name != 'walk_back' &&
			currentState.Name != 'run' &&
			currentState.Name != 'run_back' &&
			currentState.Name != 'idle') {
		  return;
		}
	  
		const velocity = this._velocity;
		const frameDecceleration = new THREE.Vector3(
			velocity.x * this._decceleration.x,
			velocity.y * this._decceleration.y,
			velocity.z * this._decceleration.z
		);
		frameDecceleration.multiplyScalar(timeInSeconds);
		frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
			Math.abs(frameDecceleration.z), Math.abs(velocity.z));
	
		velocity.add(frameDecceleration);
	
		const controlObject = this._target;
		const _Q = new THREE.Quaternion();
		const _A = new THREE.Vector3();
		const _R = controlObject.quaternion.clone();
	
		const acc = this._acceleration.clone();
		
	
		if (input._keys.forward) {
			if (input._keys.shift) {
				acc.multiplyScalar(5.0);
			}
		  velocity.z += acc.z * timeInSeconds;
		}
		if (input._keys.backward) {
		  if (input._keys.shift) {
			acc.multiplyScalar(2.5);
		  }
		  velocity.z -= acc.z * timeInSeconds;
		}
		if (input._keys.left) {
		  _A.set(0, 1, 0);
		  _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
		  _R.multiply(_Q);
		}
		if (input._keys.right) {
		  _A.set(0, 1, 0);
		  _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
		  _R.multiply(_Q);
		}
	
		controlObject.quaternion.copy(_R);
	
		const oldPosition = new THREE.Vector3();
		oldPosition.copy(controlObject.position);
	
		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(controlObject.quaternion);
		forward.normalize();
	
		const sideways = new THREE.Vector3(1, 0, 0);
		sideways.applyQuaternion(controlObject.quaternion);
		sideways.normalize();
	
		sideways.multiplyScalar(velocity.x * timeInSeconds);
		forward.multiplyScalar(velocity.z * timeInSeconds);
	
		const pos = controlObject.position.clone();
		pos.add(forward);
		pos.add(sideways);
  
		const collisions = this._FindIntersections(pos);
		if (collisions.length > 0) {
		  return;
		}
  
		controlObject.position.copy(pos);
		this._position.copy(pos);
	
		this._parent.SetPosition(this._position);
		this._parent.SetQuaternion(this._target.quaternion);
	  }
	};
	
	return {
		BasicCharacterControllerProxy: BasicCharacterControllerProxy,
		BasicCharacterController: BasicCharacterController,
	};
  
  })();