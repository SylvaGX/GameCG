import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {entity} from './entity.js';

export const physics = (() => {

    class Physics extends entity.Component {

        constructor(params) {
            super();
            this._Init(params);
        }
        
        _Init(params) {
            this.distance = params.distance;
        }
    }

    return {
        Physics: Physics
    }
})();