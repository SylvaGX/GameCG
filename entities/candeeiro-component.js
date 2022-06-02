import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {entity} from './entity.js';

export const candeeiro = (() => {

    class Candeeiro extends entity.Component {

        constructor(params) {
            super();
            this._Init(params);
        }
        
        _Init(params) {
            this._params = params;

            this._pala = null;
            this._tronco = null;
            this._light = null;

            this.keyUp = this._onKeyUp.bind(this);
            document.addEventListener('keyup', this.keyUp, false);

            this._lightOff = false;
        
            this._CreateModel();
        }

        _onKeyUp(event) {
            if (event.defaultPrevented) {
                return; // Do nothing if the event was already processed
            }
            
            switch (event.key) {
                case "0":
                    this._lightOff = !this._lightOff;
                    break;
                default:
                    return; // Quit when this doesn't handle the key event.
            }
            
            // Cancel the default action to avoid it being handled twice
            event.preventDefault();
        }
        
        InitComponent() {
            this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
        }
        
        _OnPosition(m) {
            if (this._pala && this._light && this._tronco) {
                this._tronco.position.x = m.value.x;
                this._tronco.position.z = m.value.z;
                this._pala.position.x = m.value.x;
                this._pala.position.z = m.value.z;
                this._light.position.x = m.value.x;
                this._light.position.z = m.value.z;
            }
        }
        
        _CreateModel() {
            // ***** Clipping planes: *****
            const localPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 15.5);

            const palaGeometry = new THREE.ConeGeometry(2, 2, 32, 1, true);

            // Geometry
            const palaMaterial = new THREE.MeshStandardMaterial({
                color: 0xc0c0c0,
                side: THREE.DoubleSide,

                // ***** Clipping setup (material): *****
                clippingPlanes: [ localPlane ],
                clipShadows: true
            });

            this._pala = new THREE.Mesh(palaGeometry, palaMaterial);
            this._pala.castShadow = true;
            this._pala.receiveShadow = true;
            this._pala.position.copy(new THREE.Vector3(0, 15.5, 0));

            const troncoGeometry = new THREE.CylinderGeometry( 0.1, 0.1, 15, 64, 1);
            const troncoMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00
            });
            this._tronco = new THREE.Mesh( troncoGeometry, troncoMaterial );
            this._tronco.castShadow = true;
            this._tronco.receiveShadow = true;
            this._tronco.position.copy(new THREE.Vector3(0, 7.5, 0));

            this._light = new THREE.PointLight(0xffbb73, 8550, 0, 2);
            this._light.position.set(0, 15, 0);
            this._light.castShadow = true; // default false
            //Set up shadow properties for the light
            this._light.shadow.bias = -0.0001;
            this._light.shadow.mapSize.width = 1024; // default
            this._light.shadow.mapSize.height = 1024; // default
            this._light.shadow.camera.near = 0.5; // default
            this._light.shadow.camera.far = 500; // default

            this._params.scene.add( this._tronco );
            this._params.scene.add( this._pala );
            this._params.scene.add( this._light );
        }

        Update(){
            if(this._lightOff){
                this._light.visible = false;
            }
            else
                this._light.visible = true;
        }
    }

    return {
        Candeeiro: Candeeiro
    }
})();