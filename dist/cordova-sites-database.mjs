import * as _typeorm from 'typeorm';

let typeorm = _typeorm;
if (typeorm.default){
    typeorm = typeorm.default;
}

class BaseDatabase {

    constructor(database) {
        let options = this._createConnectionOptions(database);
        this._connectionPromise = typeorm.createConnection(options).catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
    }

    _createConnectionOptions(database) {
        let options = BaseDatabase.CONNECTION_OPTIONS;

        if (typeof device === "undefined" || device.platform !== "browser") {
            options.type = "cordova";
            options.database = database;
            // options.location = "default";
        } else {
            options.type = "sqljs";
            options.location = database;
            options.autoSave = true;
            options.useLocalForage = true;
        }

        options.entities = this.getEntityDefinitions();
        return options;
    }

    getEntityDefinitions(){
        let entities = [];
        Object.keys(BaseDatabase._models).forEach(modelName => {
            BaseDatabase._models[modelName]._database = this;
            entities.push(new typeorm.EntitySchema(BaseDatabase._models[modelName].getSchemaDefinition()));
        });
        return entities;
    }

    async saveEntity(entity) {
        let repository = null;
        if (Array.isArray(entity)) {
            if (entity.length === 0) {
                return entity;
            }
            repository = await this._getRepository(entity[0].constructor);
        } else {
            repository = await this._getRepository(entity.constructor);
        }
        return repository.save(entity);
    }

    static _buildQuery(where, order, limit, offset, relations) {
        let query = {};
        if (where) {
            query["where"] = where;
        }
        if (order) {
            query["order"] = order;
        }
        if (limit) {
            query["take"] = limit;
        }
        if (offset) {
            query["skip"] = offset;
        }
        if (relations) {
            query["relations"] = relations;
        }
        return query;
    }

    static async _setLoaded(models) {
        models = await models;
        if (models === null || models === undefined) {
            return null;
        }
        let isArray = Array.isArray(models);
        if (!isArray) {
            models = [models];
        }
        models.forEach(models => models._isLoaded = true);
        return (isArray) ? models : models[0];
    }

    async findEntities(model, where, order, limit, offset, relations) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.find(BaseDatabase._buildQuery(where, order, limit, offset, relations)));
    }

    async findAndCountEntities(model, where, order, limit, offset, relations) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findAndCount(BaseDatabase._buildQuery(where, order, limit, offset, relations)));
    }

    async findOneEntity(model, where, order, offset, relations) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findOne(BaseDatabase._buildQuery(where, order, undefined, offset, relations)));
    }

    async findById(model, id, relations) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findOne(id, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)));
    }

    async findByIds(model, ids, relations) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findByIds(ids, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)));
    }

    async clearModel(model) {
        let repository = await this._getRepository(model);
        return repository.clear();
    }

    async _getRepository(model) {
        let connection = await this._connectionPromise;
        return connection.getRepository(model);
    }

    async deleteEntity(entity, model) {
        if (Array.isArray(entity)) {
            if (entity.length === 0) {
                return entity;
            }
            if (model === null) {
                model = entity[0].constructor;
            }
            if (typeof entity[0] !== "number") {
                let ids = [];
                entity.forEach(ent => ids.push(ent.id));
                entity = ids;
            }
        } else {
            if (model === null) {
                model = entity.constructor;
            }
            if (typeof entity !== "number") {
                entity = entity.id;
            }
        }
        let repository = await this._getRepository(model);
        return repository.delete(entity);
    }

    async waitForConnection(){
        return this._connectionPromise;
    }

    /**
     * @return {BaseDatabase}
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }

    static addModel(model) {
        BaseDatabase._models[model.getSchemaName()] = model;
    }

    static getModel(modelName) {
        if (modelName) {
            return this._models[modelName]
        } else {
            return this._models;
        }
    }
}

BaseDatabase._models = {};

BaseDatabase.CONNECTION_OPTIONS = {
    location: "default",
    // autoSave: true,
    logging: ["error", "warn"],
    synchronize: true,
};
BaseDatabase.TYPES = {
    INTEGER: "int",
    FLOAT: "float",
    DATE: "datetime",
    STRING: "varchar",
    BOOLEAN: "boolean",
    JSON: "simple-json"
};

class BaseModel {
    constructor(){
        this.id = null;
        this._isLoaded = false;
    }

    getId(){
        return this.id;
    }

    setId(id){
        this.id = id;
    }

    static getColumnDefinitions(){
        return {
            id: {
                primary: true,
                type: BaseDatabase.TYPES.INTEGER,
                generated: true
            },
        }
    }

    static getRelationDefinitions(){
        return {};
    }

    static getRelations(){
        return Object.keys(this.getRelationDefinitions());
    }

    static getSchemaDefinition(){
        let columns = this.getColumnDefinitions();
        Object.keys(columns).forEach(column => {
            if (typeof columns[column] === "string"){
                columns[column] = {type: columns[column]};
            }
        });
        return {
            name: this.getSchemaName(),
            target: this,
            columns: columns,
            relations: this.getRelationDefinitions()
        };
    }

    static getSchemaName(){
        if (!this.SCHEMA_NAME)
        {
            this.SCHEMA_NAME = this.name;
        }
        return this.SCHEMA_NAME;
    }

    async save(){
        return this.constructor._database.saveEntity(this);
    }

    async delete(){
        return this.constructor._database.deleteEntity(this);
    }

    static async find(where, order, limit, offset, relations){
        return this._database.findEntities(this, where, order, limit, offset, relations);
    }

    static async findAndCount(where, order, limit, offset, relations){
        return this._database.findAndCountEntities(this, where, order, limit, offset, relations);
    }

    static async findOne(where, order, offset, relations){
        return this._database.findOneEntity(this, where, order, offset, relations);
    }

    static async findById(id, relations){
        return this._database.findById(this, id, relations);
    }

    static async findByIds(ids, relations){
        return this._database.findByIds(this, ids, relations);
    }

    static async clear(){
        return this._database.clearModel(this);
    }
}

/**
 * @type {null | BaseDatabase}
 * @private
 */
BaseModel._database = null;

export { BaseDatabase, BaseModel };
