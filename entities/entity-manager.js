

export const entity_manager = (() => {

    class EntityManager {
        constructor() {
          this._ids = 0;
          this._entitiesMap = {};
          this._entities = [];
        }

        _GenerateName() {
            this._ids += 1;
        
            return '__name__' + this._ids;
        }

        /**
         * Returns an entity from the entities map
         * @param {String} n 
         * @returns An entity
         */
        Get(n) {
            return this._entitiesMap[n];
        }
        
        /**
         * Returns an array of entities that meet a condition of a callback function
         * @param {function} cb
         * @returns an array of entities
         */
        Filter(cb) {
            return this._entities.filter(cb);
        }
        
        /***
        Adiciona uma entidade
        @param e: entidade
        @param n: nome
        */
        Add(e, n) {
            if (!n) {
                n = this._GenerateName();
            }
        
            this._entitiesMap[n] = e;
            this._entities.push(e);
        
            e.SetParent(this);
            e.SetName(n);
        }

        SetActive(e, b) {
            const i = this._entities.indexOf(e);
            if (i < 0) {
              return;
            }
      
            this._entities.splice(i, 1);
        }
    
        Update(timeElapsed) {
            for (let e of this._entities) {
                e.Update(timeElapsed);
            }
        }

    };

    return{
        EntityManager: EntityManager
    };

})();