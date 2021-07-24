import * as _typeorm from "typeorm";
import {QueryBuilder, QueryRunner} from "typeorm";
import {BaseModel} from "./BaseModel";

let typeorm = _typeorm;

declare let device: any;

export class BaseDatabase {

    static CONNECTION_OPTIONS;
    static _models;
    static instance: BaseDatabase;
    static TYPES;

    private readonly _connectionPromise: Promise<_typeorm.Connection>;

    constructor(database?) {
        let options = this._createConnectionOptions(database);
        this._connectionPromise = this._createConnection(options);
    }

    async _createConnection(options) {
        if (options.type === "sqljs") {
            //wait for SQL to be initialized
            window["SQL"] = await window["initSqlJs"]();
        }
        return typeorm.createConnection(options).catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
    }

    _createConnectionOptions(database) {
        let options = BaseDatabase.CONNECTION_OPTIONS;

        if (typeof device === "undefined" || device.platform !== "browser") {
            options.type = "cordova";
            options.database = database;
        } else {
            let saveTimeout = null;

            options.type = "sqljs";
            options.location = database;
            options.autoSave = true;
            options.useLocalForage = true;

            //Deactivated delay of saving since PRAGMA foreign_keys = ON is not saved with delay (why ever!)
            // options.autoSaveCallback = function () {
            //     clearTimeout(saveTimeout);
            //     saveTimeout = setTimeout(() => {
            //         typeorm.getSqljsManager().saveDatabase();
            //     }, 150);
            // }
        }

        options.entities = this.getEntityDefinitions();
        // options.migrations = this.constructor._migrations;
        return options;
    }

    getEntityDefinitions() {
        let entities = [];
        Object.keys(BaseDatabase._models).forEach(modelName => {
            BaseDatabase._models[modelName]._database = this;
            entities.push(new typeorm.EntitySchema(BaseDatabase._models[modelName].getSchemaDefinition()));
        });
        // console.log("entities", entities);
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

    static async _setLoadedForarry<ModelClass extends typeof BaseModel>(entities, model: ModelClass) {
        entities = await entities;
        if (entities === null || entities === undefined) {
            return null;
        }
        let isArray = Array.isArray(entities);
        if (!isArray) {
            entities = [entities];
        }
        const relations = model.getRelationDefinitions();
        const relationKeys = Object.keys(relations);

        const promises = [];
        entities.forEach(entity => {
            entity.setLoaded(true);
            relationKeys.forEach(relationName => {
                if (entity[relationName]) {
                    const otherModel = this.getModel(relations[relationName].target);
                    promises.push(this._setLoaded(entity[relationName], otherModel));
                }
            })
        });

        await Promise.all(promises);
        return (isArray) ? entities : entities[0];
    }

    static async _setLoaded<ModelClass extends typeof BaseModel>(entities, model: ModelClass) {
        entities = await entities;
        if (entities === null || entities === undefined) {
            return null;
        }
        let isArray = Array.isArray(entities);
        if (!isArray) {
            entities = [entities];
        }
        const relations = model.getRelationDefinitions();
        const relationKeys = Object.keys(relations);

        const promises = [];
        entities.forEach(entity => {
            entity.setLoaded(true);
            relationKeys.forEach(relationName => {
                if (entity[relationName]) {
                    const otherModel = this.getModel(relations[relationName].target);
                    promises.push(this._setLoaded(entity[relationName], otherModel));
                }
            })
        });

        await Promise.all(promises);
        return (isArray) ? entities : entities[0];
    }

    async findEntities<ModelClass extends typeof BaseModel>(model: ModelClass, where?, order?, limit?, offset?, relations?): Promise<ModelClass["prototype"][]> {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.find(BaseDatabase._buildQuery(where, order, limit, offset, relations)), model);
    }

    async findAndCountEntities(model, where?, order?, limit?, offset?, relations?) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findAndCount(BaseDatabase._buildQuery(where, order, limit, offset, relations)), model);
    }

    async count(model, where?, order?, limit?, offset?, relations?) {
        let repository = await this._getRepository(model);
        return repository.count(BaseDatabase._buildQuery(where, order, limit, offset, relations));
    }

    async findOneEntity(model, where?, order?, offset?, relations?) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findOne(BaseDatabase._buildQuery(where, order, undefined, offset, relations)), model);
    }

    async findById(model, id, relations?) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findOne(id, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)), model);
    }

    async findByIds(model, ids, relations?) {
        let repository = await this._getRepository(model);
        return BaseDatabase._setLoaded(repository.findByIds(ids, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)), model);
    }

    async clearModel(model) {
        let repository = await this._getRepository(model);
        return repository.clear();
    }

    async _getRepository<ModelClass extends typeof BaseModel>(model: ModelClass) {
        let connection = await this._connectionPromise;
        return connection.getRepository(model);
    }

    async createQueryBuilder(model?): Promise<QueryBuilder<any>> {
        if (model) {
            let repo = await this._getRepository(model);
            return repo.createQueryBuilder(model.getSchemaName());
        } else {
            let connection = await this._connectionPromise;
            return connection.createQueryBuilder();
        }
    }

    async createQueryRunner(): Promise<QueryRunner> {
        let connection = await this._connectionPromise;
        return connection.createQueryRunner();
    }

    async deleteEntity(entity, model?) {
        if (Array.isArray(entity)) {
            if (entity.length === 0) {
                return entity;
            }
            if (!model) {
                model = entity[0].constructor;
            }
            if (typeof entity[0] !== "number") {
                let ids = [];
                entity.forEach(ent => ids.push(ent.id));
                entity = ids;
            }
        } else {
            if (!model) {
                model = entity.constructor;
            }
            if (typeof entity !== "number") {
                entity = entity.id;
            }
        }
        let repository = await this._getRepository(model);
        return repository.delete(entity);
    }

    async rawQuery(sql, params?) {
        return (await this._connectionPromise).query(sql, params)
    }

    async waitForConnection() {
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

    static getModel(modelName?) {
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
    // charset: "utf8mb4",
    // extra: {
    // }
};
BaseDatabase.TYPES = {
    INTEGER: "int",
    FLOAT: "float",
    DATE: "datetime",
    STRING: "varchar",
    TEXT: "text",
    MEDIUMTEXT: "mediumtext",
    BOOLEAN: "boolean",
    JSON: "json",
    SIMPLE_JSON: "simple-json",
    MY_JSON: "my-json",
};
