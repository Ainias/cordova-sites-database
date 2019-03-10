import { createConnection, EntitySchema } from 'typeorm';

class BaseModel {
    constructor(){
        this.id = null;
    }

    static getColumnDefinitions(){
        return {
            id: {
                primary: true,
                type: "int",
                generated: true
            },
        }
    }

    static getSchemaDefinition(){
        return {
            name: this.getSchemaName(),
            target: this,
            columns: this.getColumnDefinitions(),
            relations: {}
        }
    }

    static getSchemaName(){
        if (!this.SCHEMA_NAME)
        {
            this.SCHEMA_NAME = this.name;
        }
        return this.SCHEMA_NAME;
    }

    async save(){
        return BaseModel._databaseClass.getInstance().saveEntity(this);
    }

    async delete(){
        return BaseModel._databaseClass.getInstance().deleteEntity(this);
    }

    static async find(where, order, limit, offset, relations){
        return BaseModel._databaseClass.getInstance().findEntities(this, where, order, limit, offset, relations);
    }

    static async findAndCount(where, order, limit, offset, relations){
        return BaseModel._databaseClass.getInstance().findAndCountEntities(this, where, order, limit, offset, relations);
    }

    static async findOne(where, order, offset, relations){
        return BaseModel._databaseClass.getInstance().findOneEntity(this, where, order, offset, relations);
    }

    static async findById(id){
        return BaseModel._databaseClass.getInstance().findById(this, id);
    }

    static async findByIds(ids){
        return BaseModel._databaseClass.getInstance().findByIds(this, ids);
    }

    static async clear(){
        return BaseModel._databaseClass.getInstance().clearModel(this);
    }
}

/**
 * @type {null | Database}
 * @private
 */
BaseModel._databaseClass = null;

class Database {

    constructor(database) {
        this._connectionPromise = createConnection(this._createConnectionOptions(database)).catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
    }

    _createConnectionOptions(database) {
        let options = Database.CONNECTION_OPTIONS;

        if (device.platform === "browser") {
            options.type = "sqljs";
            options.location = database;
        } else {
            options.type = "cordova";
            options.database = database;
        }

        let entities = [];
        Object.keys(Database._models).forEach(modelName => {
            entities.push(new EntitySchema(Database._models[modelName].getSchemaDefinition()));
        });
        options.entities = entities;
        console.log(options);
        return options;
    }

    async saveEntity(entity) {
        let connection = await this._connectionPromise;
        let repository = connection.getRepository(entity.constructor);
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

    async findEntities(model, where, order, limit, offset, relations) {
        let repository = await this._getRepository(model);
        return repository.find(Database._buildQuery(where, order, limit, offset, relations));
    }

    async findAndCountEntities(model, where, order, limit, offset, relations) {
        let repository = await this._getRepository(model);
        return repository.findAndCount(Database._buildQuery(where, order, limit, offset, relations));
    }

    async findOneEntity(model, where, order, offset, relations) {
        let repository = await this._getRepository(model);
        return repository.findOne(Database._buildQuery(where, order, undefined, offset, relations));
    }

    async findById(model, id) {
        let repository = await this._getRepository(model);
        return repository.findOne(id);
    }

    async findByIds(model, ids) {
        let repository = await this._getRepository(model);
        return repository.findByIds(ids);
    }

    async clearModel(model) {
        let repository = await this._getRepository(model);
        return repository.clear();
    }

    async _getRepository(model) {
        let connection = await this._connectionPromise;
        return connection.getRepository(model);
    }

    async deleteEntity(entity) {
        let repository = await this._getRepository(entity.constructor);
        return repository.delete(entity.id);
    }

    /**
     * @return {Database}
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }

    static addModel(model) {
        Database._models[model.getSchemaName()] = model;
    }
}

Database._models = {};

Database.CONNECTION_OPTIONS = {
    "location": "default",
    autoSave: true,
    logging: false,
    synchronize: true,
};

export { BaseModel, Database };
