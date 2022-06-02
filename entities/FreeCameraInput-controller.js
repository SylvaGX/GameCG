import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {entity} from "./entity.js";


export const FreeCameraInput_controller = (() => {

  class FreeCameraInput extends entity.Component {
    constructor(params) {
      super();
      this._params = params;
      this._Init();
    }
  
    _Init() {
        this._keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
        };
      
        this._isMoving = false;
        this._x = 0;
        this._y = 0;
        this.CamTheta = 90.0 * Math.PI / 180;
        this.CamPsi = 90.0 * Math.PI / 180;
        
        
        this.keyDown = this._onKeyDown.bind(this);
        document.addEventListener('keydown', this.keyDown, false);
        this.keyUp = this._onKeyUp.bind(this);
        document.addEventListener('keyup', this.keyUp, false);
        this.mouseUp = this._onMouseUp.bind(this);
        document.addEventListener('mouseup', this.mouseUp, false);
        this.mouseMove = this._onMouseMove.bind(this);
        document.addEventListener('mousemove', this.mouseMove, false);
        this.mouseDown = this._onMouseDown.bind(this);
        document.getElementById('container').addEventListener('mousedown', this.mouseDown, false);
    }

    Delete(){
        document.removeEventListener('keydown', this.keyDown, false);
        document.removeEventListener('keyup', this.keyUp, false);
        document.removeEventListener('mouseup', this.mouseUp, false);
        document.removeEventListener('mousemove', this.mouseMove, false);
        document.getElementById('container').removeEventListener('mousedown', this.mouseDown, false);
    }
  
    _onMouseUp(event) {
        if (this._isMoving === true) {
            this._x = 0;
            this._y = 0;
            this._isMoving = false;
        }
    }

    _onMouseDown(e) {
        this._x = e.offsetX;
        this._y = e.offsetY;
        this._isMoving = true;
    }
  
    _onMouseMove(e) {
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
    }

    _onKeyDown(event) {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
    
        switch (event.key) {
            case "w":
                this._keys.forward = true;
                break;
            case "s":
                this._keys.backward = true;
                break;
            case "a":
                this._keys.left = true;
                break;
            case "d":
                this._keys.right = true;
                break;
            case "q":
                this._keys.up = true;
                break;
            case "e":
                this._keys.down = true;
                break;
            default:
                return; // Quit when this doesn't handle the key event.
        }
    
        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }
  
    _onKeyUp(event) {
        if (event.defaultPrevented) {
            return; // Do nothing if the event was already processed
        }
        
        switch (event.key) {
            case "w":
                this._keys.forward = false;
                break;
            case "s":
                this._keys.backward = false;
                break;
            case "a":
                this._keys.left = false;
                break;
            case "d":
                this._keys.right = false;
                break;
            case "q":
                this._keys.up = false;
                break;
            case "e":
                this._keys.down = false;
                break;
            default:
                return; // Quit when this doesn't handle the key event.
        }
        
        // Cancel the default action to avoid it being handled twice
        event.preventDefault();
    }

    Update(timeElapsed){
        const direction = new THREE.Vector3();

		direction.z = Number( this._keys.forward ) - Number( this._keys.backward );
		direction.y = Number( this._keys.up ) - Number( this._keys.down );
		direction.x = Number( this._keys.left ) - Number( this._keys.right );

		if(direction.z == 1){
			this._params.camera.position.x = this._params.camera.position.x + 20 * Math.cos(this.CamTheta) * Math.sin(this.CamPsi) * timeElapsed;
			this._params.camera.position.y = this._params.camera.position.y + 20 * Math.cos(this.CamPsi) * timeElapsed;
			this._params.camera.position.z = this._params.camera.position.z + 20 * Math.sin(this.CamTheta) * Math.sin(this.CamPsi) * timeElapsed;
		}
		else if(direction.z == -1){
			this._params.camera.position.x = this._params.camera.position.x - 20 * Math.cos(this.CamTheta) * Math.sin(this.CamPsi) * timeElapsed;
			this._params.camera.position.y = this._params.camera.position.y - 20 * Math.cos(this.CamPsi) * timeElapsed;
			this._params.camera.position.z = this._params.camera.position.z - 20 * Math.sin(this.CamTheta) * Math.sin(this.CamPsi) * timeElapsed;
		}

		if(direction.y == 1){
			this._params.camera.position.x = this._params.camera.position.x - 20 * Math.cos(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
			this._params.camera.position.y = this._params.camera.position.y - 20 * Math.cos(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
			this._params.camera.position.z = this._params.camera.position.z - 20 * Math.sin(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
		}
		else if(direction.y == -1){
			this._params.camera.position.x = this._params.camera.position.x + 20 * Math.cos(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
			this._params.camera.position.y = this._params.camera.position.y + 20 * Math.cos(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
			this._params.camera.position.z = this._params.camera.position.z + 20 * Math.sin(this.CamTheta) * Math.sin(this.CamPsi + 90 * Math.PI / 180) * timeElapsed;
		}

		if(direction.x == 1){
			this._params.camera.position.x = this._params.camera.position.x - 20 * Math.cos(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi) * timeElapsed;
			//this._params.camera.position.y = this._params.camera.position.y + Math.cos(this.CamPsi);
			this._params.camera.position.z = this._params.camera.position.z - 20 * Math.sin(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi) * timeElapsed;
		}
		else if(direction.x == -1){
			this._params.camera.position.x = this._params.camera.position.x + 20 * Math.cos(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi) * timeElapsed;
			//this._params.camera.position.y = this._params.camera.position.y + Math.cos(this.CamPsi);
			this._params.camera.position.z = this._params.camera.position.z + 20 * Math.sin(this.CamTheta + 90 * Math.PI / 180) * Math.sin(this.CamPsi) * timeElapsed;
		}

		/*
		Coordenadas de uma esfera
		x = p * cos(theta) * sin(psi)
		y = p * cos(psi)
		z = p * sin(theta) * sin(psi)

		-----------------------------
		Centra a esfera nas coordenadas da camara
		Fazendo uma rotação local e nao global
		this._params.camera.position.*
		*/
		this._params.camera.lookAt(this._params.camera.position.x + Math.cos(this.CamTheta) * Math.sin(this.CamPsi), this._params.camera.position.y + Math.cos(this.CamPsi), this._params.camera.position.z + Math.sin(this.CamTheta) * Math.sin(this.CamPsi));
    }

  };

  return {
    FreeCameraInput: FreeCameraInput,
  };

})();