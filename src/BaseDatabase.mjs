import * as _typeorm from "typeorm";

let typeorm = _typeorm;
if (typeorm.default) {
    typeorm = typeorm.default;
}

export class BaseDatabase {

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
            let saveTimeout = null;

            options.type = "sqljs";
            options.location = database;
            options.autoSave = true;
            options.useLocalForage = true;
            options.autoSaveCallback = function () {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    typeorm.getSqljsManager().saveDatabase();
                }, 150);
            }
        }

        options.entities = this.getEntityDefinitions();
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
    MY_JSON:"my-json"
};