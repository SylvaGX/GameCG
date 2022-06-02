import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {entity} from './entity.js';

export const castelo = (() => {

    class Castelo extends entity.Component {

        constructor(params) {
            super();
            this._Init(params);
        }
        
        _Init(params) {
            this._params = params;

            this._center = new THREE.Object3D();
            this._canto1 = null;
            this._canto2 = null;
            this._canto3 = null;
            this._canto4 = null;
            this._parede1 = null;
            this._parede2 = null;
            this._parede3 = null;
            this._parede4 = null;
        
            this._CreateModel();
        }
        
        InitComponent() {
            this._RegisterHandler('update.position', (m) => { this._OnPosition(m); });
        }
        
        _OnPosition(m) {
            if (this._center) {
                this._center.position.x = m.value.x;
                this._center.position.z = m.value.z;
            }
        }
        
        _CreateModel() {
            const Parede1Geometry = new THREE.BoxBufferGeometry( 60, 30, 6);
            const Parede2Geometry = new THREE.BoxBufferGeometry( 60, 30, 6);
            const Parede3Geometry = new THREE.BoxBufferGeometry( 60, 30, 6);
            const Parede4Geometry = new THREE.BoxBufferGeometry( 60, 30, 6);
            var block = new THREE.TextureLoader().load( "./assets/models/textures/castelo/castelo_Color.png" );
            var blockNMAP = new THREE.TextureLoader().load( "./assets/models/textures/castelo/castelo_NormalGL.png" );
            var blockAOMap = new THREE.TextureLoader().load( "./assets/models/textures/castelo/castelo_AmbientOcclusion.png" );
            var blockRouhgMap = new THREE.TextureLoader().load( "./assets/models/textures/castelo/castelo_Roughness.png" );

            // how many times to repeat in each direction; the default is (1,1),
            // which is probably why your example wasn't working
            block.repeat.set( 1, 1);

            // assuming you want the texture to repeat in both directions:
            block.wrapS = block.wrapT = THREE.RepeatWrapping;
            blockNMAP.wrapS = blockNMAP.wrapT = THREE.RepeatWrapping;
            blockRouhgMap.wrapS = blockRouhgMap.wrapT = THREE.RepeatWrapping;
            blockAOMap.wrapS = blockAOMap.wrapT = THREE.RepeatWrapping; 

            const Material = new THREE.MeshStandardMaterial({
                map: block,
				normalMap: blockNMAP,
				aoMap: blockAOMap,
				roughnessMap: blockRouhgMap,
            });
            this._parede1 = new THREE.Mesh( Parede1Geometry, Material );
            this._parede2 = new THREE.Mesh( Parede2Geometry, Material );
            this._parede3 = new THREE.Mesh( Parede3Geometry, Material );
            this._parede4 = new THREE.Mesh( Parede4Geometry, Material );
            this._parede1.castShadow = true;
            this._parede2.castShadow = true;
            this._parede3.castShadow = true;
            this._parede4.castShadow = true;
            this._parede1.receiveShadow = true;
            this._parede2.receiveShadow = true;
            this._parede3.receiveShadow = true;
            this._parede4.receiveShadow = true;
            this._parede1.position.copy(new THREE.Vector3(0, 15, -30));
            this._parede2.position.copy(new THREE.Vector3(30, 15, 0));
            this._parede3.position.copy(new THREE.Vector3(-30, 15, 0));
            this._parede4.position.copy(new THREE.Vector3(0, 15, 30));
            this._parede2.rotation.y = -Math.PI/2;
            this._parede3.rotation.y = -Math.PI/2;

            const Canto1Geometry = new THREE.BoxBufferGeometry( 20, 35, 20);
            const Canto2Geometry = new THREE.BoxBufferGeometry( 20, 35, 20);
            const Canto3Geometry = new THREE.BoxBufferGeometry( 20, 35, 20);
            const Canto4Geometry = new THREE.BoxBufferGeometry( 20, 35, 20);
            this._canto1 = new THREE.Mesh( Canto1Geometry, Material );
            this._canto2 = new THREE.Mesh( Canto2Geometry, Material );
            this._canto3 = new THREE.Mesh( Canto3Geometry, Material );
            this._canto4 = new THREE.Mesh( Canto4Geometry, Material );
            this._canto1.castShadow = true;
            this._canto2.castShadow = true;
            this._canto3.castShadow = true;
            this._canto4.castShadow = true;
            this._canto1.receiveShadow = true;
            this._canto2.receiveShadow = true;
            this._canto3.receiveShadow = true;
            this._canto4.receiveShadow = true;
            
            this._canto1.position.copy(new THREE.Vector3(-30, 17.5, -30));
            this._canto2.position.copy(new THREE.Vector3(30, 17.5, -30));
            this._canto3.position.copy(new THREE.Vector3(-30, 17.5, 30));
            this._canto4.position.copy(new THREE.Vector3(30, 17.5, 30));

            Material.map.repeat.set(0.5, 0.5);

            const blocoGeometry = new THREE.BoxBufferGeometry(8, 3, 3);
            
            this._bloco1 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco1.position.copy(new THREE.Vector3(12, 31.5, -31.5));
            this._bloco1.castShadow = true;
            this._bloco1.receiveShadow = true;

            this._bloco2 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco2.position.copy(new THREE.Vector3(0, 31.5, -31.5));
            this._bloco2.castShadow = true;
            this._bloco2.receiveShadow = true;

            this._bloco3 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco3.position.copy(new THREE.Vector3(-12, 31.5, -31.5));
            this._bloco3.castShadow = true;
            this._bloco3.receiveShadow = true;

            this._bloco4 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco4.position.copy(new THREE.Vector3(-31.5, 31.5, 12));
            this._bloco4.castShadow = true;
            this._bloco4.receiveShadow = true;
            this._bloco4.rotation.y = -Math.PI / 2;

            this._bloco5 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco5.position.copy(new THREE.Vector3(-31.5, 31.5, 0));
            this._bloco5.castShadow = true;
            this._bloco5.receiveShadow = true;
            this._bloco5.rotation.y = -Math.PI / 2;

            this._bloco6 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco6.position.copy(new THREE.Vector3(-31.5, 31.5, -12));
            this._bloco6.castShadow = true;
            this._bloco6.receiveShadow = true;
            this._bloco6.rotation.y = -Math.PI / 2;

            this._bloco7 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco7.position.copy(new THREE.Vector3(31.5, 31.5, 12));
            this._bloco7.castShadow = true;
            this._bloco7.receiveShadow = true;
            this._bloco7.rotation.y = -Math.PI / 2;

            this._bloco8 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco8.position.copy(new THREE.Vector3(31.5, 31.5, 0));
            this._bloco8.castShadow = true;
            this._bloco8.receiveShadow = true;
            this._bloco8.rotation.y = -Math.PI / 2;

            this._bloco9 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco9.position.copy(new THREE.Vector3(31.5, 31.5, -12));
            this._bloco9.castShadow = true;
            this._bloco9.receiveShadow = true;
            this._bloco9.rotation.y = -Math.PI / 2;

            this._bloco10 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco10.position.copy(new THREE.Vector3(12, 31.5, 31.5));
            this._bloco10.castShadow = true;
            this._bloco10.receiveShadow = true;

            this._bloco11 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco11.position.copy(new THREE.Vector3(0, 31.5, 31.5));
            this._bloco11.castShadow = true;
            this._bloco11.receiveShadow = true;

            this._bloco12 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco12.position.copy(new THREE.Vector3(-12, 31.5, 31.5));
            this._bloco12.castShadow = true;
            this._bloco12.receiveShadow = true;

            this._blocosTorre1 = new THREE.Object3D();
            this._blocosTorre1.position.copy(new THREE.Vector3(0, 19, 0));

            this._bloco13 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco13.position.copy(new THREE.Vector3(0, 0, -8.5));
            this._bloco13.castShadow = true;
            this._bloco13.receiveShadow = true;

            this._bloco14 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco14.position.copy(new THREE.Vector3(-8.5, 0, 0));
            this._bloco14.castShadow = true;
            this._bloco14.receiveShadow = true;
            this._bloco14.rotation.y = -Math.PI / 2;

            this._bloco15 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco15.position.copy(new THREE.Vector3(8.5, 0, 0));
            this._bloco15.castShadow = true;
            this._bloco15.receiveShadow = true;
            this._bloco15.rotation.y = -Math.PI / 2;

            this._bloco16 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco16.position.copy(new THREE.Vector3(0, 0, 8.5));
            this._bloco16.castShadow = true;
            this._bloco16.receiveShadow = true;

            this._blocosTorre2 = new THREE.Object3D();
            this._blocosTorre2.position.copy(new THREE.Vector3(0, 19, 0));

            this._bloco17 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco17.position.copy(new THREE.Vector3(0, 0, -8.5));
            this._bloco17.castShadow = true;
            this._bloco17.receiveShadow = true;

            this._bloco18 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco18.position.copy(new THREE.Vector3(-8.5, 0, 0));
            this._bloco18.castShadow = true;
            this._bloco18.receiveShadow = true;
            this._bloco18.rotation.y = -Math.PI / 2;

            this._bloco19 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco19.position.copy(new THREE.Vector3(8.5, 0, 0));
            this._bloco19.castShadow = true;
            this._bloco19.receiveShadow = true;
            this._bloco19.rotation.y = -Math.PI / 2;

            this._bloco20 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco20.position.copy(new THREE.Vector3(0, 0, 8.5));
            this._bloco20.castShadow = true;
            this._bloco20.receiveShadow = true;

            this._blocosTorre3 = new THREE.Object3D();
            this._blocosTorre3.position.copy(new THREE.Vector3(0, 19, 0));

            this._bloco21 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco21.position.copy(new THREE.Vector3(0, 0, -8.5));
            this._bloco21.castShadow = true;
            this._bloco21.receiveShadow = true;

            this._bloco22 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco22.position.copy(new THREE.Vector3(-8.5, 0, 0));
            this._bloco22.castShadow = true;
            this._bloco22.receiveShadow = true;
            this._bloco22.rotation.y = -Math.PI / 2;

            this._bloco23 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco23.position.copy(new THREE.Vector3(8.5, 0, 0));
            this._bloco23.castShadow = true;
            this._bloco23.receiveShadow = true;
            this._bloco23.rotation.y = -Math.PI / 2;

            this._bloco24 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco24.position.copy(new THREE.Vector3(0, 0, 8.5));
            this._bloco24.castShadow = true;
            this._bloco24.receiveShadow = true;

            this._blocosTorre4 = new THREE.Object3D();
            this._blocosTorre4.position.copy(new THREE.Vector3(0, 19, 0));

            this._bloco25 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco25.position.copy(new THREE.Vector3(0, 0, -8.5));
            this._bloco25.castShadow = true;
            this._bloco25.receiveShadow = true;

            this._bloco26 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco26.position.copy(new THREE.Vector3(-8.5, 0, 0));
            this._bloco26.castShadow = true;
            this._bloco26.receiveShadow = true;
            this._bloco26.rotation.y = -Math.PI / 2;

            this._bloco27 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco27.position.copy(new THREE.Vector3(8.5, 0, 0));
            this._bloco27.castShadow = true;
            this._bloco27.receiveShadow = true;
            this._bloco27.rotation.y = -Math.PI / 2;

            this._bloco28 = new THREE.Mesh( blocoGeometry, Material );
            this._bloco28.position.copy(new THREE.Vector3(0, 0, 8.5));
            this._bloco28.castShadow = true;
            this._bloco28.receiveShadow = true;

            this._center.add( this._parede1 );
            this._center.add( this._parede2 );
            this._center.add( this._parede3 );
            this._center.add( this._parede4 );
            this._center.add( this._canto1 );
            this._center.add( this._canto2 );
            this._center.add( this._canto3 );
            this._center.add( this._canto4 );
            this._center.add( this._bloco1 );
            this._center.add( this._bloco2 );
            this._center.add( this._bloco3 );
            this._center.add( this._bloco4 );
            this._center.add( this._bloco5 );
            this._center.add( this._bloco6 );
            this._center.add( this._bloco7 );
            this._center.add( this._bloco8 );
            this._center.add( this._bloco9 );
            this._center.add( this._bloco10 );
            this._center.add( this._bloco11 );
            this._center.add( this._bloco12 );
            this._blocosTorre1.add( this._bloco13 );
            this._blocosTorre1.add( this._bloco14 );
            this._blocosTorre1.add( this._bloco15 );
            this._blocosTorre1.add( this._bloco16 );
            this._blocosTorre2.add( this._bloco17 );
            this._blocosTorre2.add( this._bloco18 );
            this._blocosTorre2.add( this._bloco19 );
            this._blocosTorre2.add( this._bloco20 );
            this._blocosTorre3.add( this._bloco21 );
            this._blocosTorre3.add( this._bloco22 );
            this._blocosTorre3.add( this._bloco23 );
            this._blocosTorre3.add( this._bloco24 );
            this._blocosTorre4.add( this._bloco25 );
            this._blocosTorre4.add( this._bloco26 );
            this._blocosTorre4.add( this._bloco27 );
            this._blocosTorre4.add( this._bloco28 );
            this._canto1.add(this._blocosTorre1);
            this._canto2.add(this._blocosTorre2);
            this._canto3.add(this._blocosTorre3);
            this._canto4.add(this._blocosTorre4);

            this._params.scene.add( this._center );
        }

        _CheckCollision(pos){
            if ((pos.x >= (this._parede1.position.x + this._center.position.x) - 33 && pos.x <= (this._parede1.position.x + this._center.position.x) + 33 &&
                pos.z >= (this._parede1.position.z + this._center.position.z) - 6 && pos.z <= (this._parede1.position.z + this._center.position.z) + 6) ||

                (pos.x >= (this._parede2.position.x + this._center.position.x) - 6 && pos.x <= (this._parede2.position.x + this._center.position.x) + 6 &&
                pos.z >= (this._parede2.position.z + this._center.position.z) - 33 && pos.z <= (this._parede2.position.z + this._center.position.z) + 33) ||

                (pos.x >= (this._parede3.position.x + this._center.position.x) - 6 && pos.x <= (this._parede3.position.x + this._center.position.x) + 6 &&
                pos.z >= (this._parede3.position.z + this._center.position.z) - 33 && pos.z <= (this._parede3.position.z + this._center.position.z) + 33) ||

                (pos.x >= (this._parede4.position.x + this._center.position.x) - 35 && pos.x <= (this._parede4.position.x + this._center.position.x) + 33 &&
                pos.z >= (this._parede4.position.z + this._center.position.z) - 6 && pos.z <= (this._parede4.position.z + this._center.position.z) + 6) ||

                (pos.x >= (this._canto1.position.x + this._center.position.x) - 12.5 && pos.x <= (this._canto1.position.x + this._center.position.x) + 12.5 &&
                pos.z >= (this._canto1.position.z + this._center.position.z) - 12.5 && pos.z <= (this._canto1.position.z + this._center.position.z) + 12.5) ||

                (pos.x >= (this._canto2.position.x + this._center.position.x) - 12.5 && pos.x <= (this._canto2.position.x + this._center.position.x) + 12.5 &&
                pos.z >= (this._canto2.position.z + this._center.position.z) - 12.5 && pos.z <= (this._canto2.position.z + this._center.position.z) + 12.5) ||

                (pos.x >= (this._canto3.position.x + this._center.position.x) - 12.5 && pos.x <= (this._canto3.position.x + this._center.position.x) + 12.5 &&
                pos.z >= (this._canto3.position.z + this._center.position.z) - 12.5 && pos.z <= (this._canto3.position.z + this._center.position.z) + 12.5) ||

                (pos.x >= (this._canto4.position.x + this._center.position.x) - 12.5 && pos.x <= (this._canto4.position.x + this._center.position.x) + 12.5 &&
                pos.z >= (this._canto4.position.z + this._center.position.z) - 12.5 && pos.z <= (this._canto4.position.z + this._center.position.z) + 12.5)
                ){
                return true;
            }
        }
    }

    return {
        Castelo: Castelo
    }
})();