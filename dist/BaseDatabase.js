"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _typeorm = require("typeorm");
let typeorm = _typeorm;
class BaseDatabase {
    constructor(database) {
        let options = this._createConnectionOptions(database);
        this._connectionPromise = this._createConnection(options);
    }
    _createConnection(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.type === "sqljs") {
                //wait for SQL to be initialized
                window["SQL"] = yield window["initSqlJs"]();
            }
            return typeorm.createConnection(options).catch(e => {
                console.error(e);
                return Promise.reject(e);
            });
        });
    }
    _createConnectionOptions(database) {
        let options = BaseDatabase.CONNECTION_OPTIONS;
        if (typeof device === "undefined" || device.platform !== "browser") {
            options.type = "cordova";
            options.database = database;
        }
        else {
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
    saveEntity(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = null;
            if (Array.isArray(entity)) {
                if (entity.length === 0) {
                    return entity;
                }
                repository = yield this._getRepository(entity[0].constructor);
            }
            else {
                repository = yield this._getRepository(entity.constructor);
            }
            return repository.save(entity);
        });
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
    static _setLoaded(models) {
        return __awaiter(this, void 0, void 0, function* () {
            models = yield models;
            if (models === null || models === undefined) {
                return null;
            }
            let isArray = Array.isArray(models);
            if (!isArray) {
                models = [models];
            }
            models.forEach(models => models.setLoaded(true));
            return (isArray) ? models : models[0];
        });
    }
    findEntities(model, where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return BaseDatabase._setLoaded(repository.find(BaseDatabase._buildQuery(where, order, limit, offset, relations)));
        });
    }
    findAndCountEntities(model, where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return BaseDatabase._setLoaded(repository.findAndCount(BaseDatabase._buildQuery(where, order, limit, offset, relations)));
        });
    }
    findOneEntity(model, where, order, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return BaseDatabase._setLoaded(repository.findOne(BaseDatabase._buildQuery(where, order, undefined, offset, relations)));
        });
    }
    findById(model, id, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return BaseDatabase._setLoaded(repository.findOne(id, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)));
        });
    }
    findByIds(model, ids, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return BaseDatabase._setLoaded(repository.findByIds(ids, BaseDatabase._buildQuery(undefined, undefined, undefined, undefined, relations)));
        });
    }
    clearModel(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let repository = yield this._getRepository(model);
            return repository.clear();
        });
    }
    _getRepository(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection = yield this._connectionPromise;
            return connection.getRepository(model);
        });
    }
    createQueryBuilder(model) {
        return __awaiter(this, void 0, void 0, function* () {
            if (model) {
                let repo = yield this._getRepository(model);
                return repo.createQueryBuilder(model.getSchemaName());
            }
            else {
                let connection = yield this._connectionPromise;
                return connection.createQueryBuilder();
            }
        });
    }
    createQueryRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            let connection = yield this._connectionPromise;
            return connection.createQueryRunner();
        });
    }
    deleteEntity(entity, model) {
        return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                if (!model) {
                    model = entity.constructor;
                }
                if (typeof entity !== "number") {
                    entity = entity.id;
                }
            }
            let repository = yield this._getRepository(model);
            return repository.delete(entity);
        });
    }
    rawQuery(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this._connectionPromise).query(sql, params);
        });
    }
    waitForConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._connectionPromise;
        });
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
            return this._models[modelName];
        }
        else {
            return this._models;
        }
    }
}
exports.BaseDatabase = BaseDatabase;
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
    TEXT: "text",
    MEDIUMTEXT: "mediumtext",
    BOOLEAN: "boolean",
    JSON: "json",
    SIMPLE_JSON: "simple-json",
    MY_JSON: "my-json",
};
//# sourceMappingURL=BaseDatabase.js.map