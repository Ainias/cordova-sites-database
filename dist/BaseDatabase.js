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
exports.BaseDatabase = void 0;
const _typeorm = require("typeorm");
const typeorm = _typeorm;
class BaseDatabase {
    constructor(database) {
        this.options = this.createConnectionOptions(database);
        this.connectionPromise = BaseDatabase.createConnection(this.options);
    }
    getConnectionPromise() {
        return this.connectionPromise;
    }
    static createConnection(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.type === 'sqljs') {
                // wait for SQL to be initialized
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window.SQL = yield window.initSqlJs();
            }
            return typeorm.createConnection(options).catch((e) => {
                console.error(e);
                return Promise.reject(e);
            });
        });
    }
    isCordova() {
        return this.options.type === 'cordova';
    }
    createConnectionOptions(database) {
        const options = BaseDatabase.CONNECTION_OPTIONS;
        if (typeof device === 'undefined' || device.platform !== 'browser') {
            options.type = 'cordova';
            options.database = database;
            options.migrationsTransactionMode = 'none';
        }
        else {
            options.type = 'sqljs';
            options.location = database;
            options.autoSave = true;
            options.useLocalForage = true;
            // Deactivated delay of saving since PRAGMA foreign_keys = ON is not saved with delay (why ever!)
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
        const entities = [];
        Object.keys(BaseDatabase.models).forEach((modelName) => {
            BaseDatabase.models[modelName].setDatabase(this);
            entities.push(new typeorm.EntitySchema(BaseDatabase.models[modelName].getSchemaDefinition()));
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
                repository = yield this.getRepository(entity[0].constructor);
            }
            else {
                repository = yield this.getRepository(entity.constructor);
            }
            return repository.save(entity, { transaction: !this.isCordova() });
        });
    }
    static buildQuery(where, order, limit, offset, relations) {
        const query = {};
        if (where) {
            query.where = where;
        }
        if (order) {
            query.order = order;
        }
        if (limit) {
            query.take = limit;
        }
        if (offset) {
            query.skip = offset;
        }
        if (relations) {
            query.relations = relations;
        }
        return query;
    }
    static setLoadedForArray(entities, model) {
        return __awaiter(this, void 0, void 0, function* () {
            entities = yield entities;
            if (entities === null || entities === undefined) {
                return null;
            }
            const isArray = Array.isArray(entities);
            if (!isArray) {
                entities = [entities];
            }
            const relations = model.getRelationDefinitions();
            const relationKeys = Object.keys(relations);
            const promises = [];
            entities.forEach((entity) => {
                entity.setLoaded(true);
                relationKeys.forEach((relationName) => {
                    if (entity[relationName]) {
                        const otherModel = this.getModel(relations[relationName].target);
                        promises.push(this.setLoaded(entity[relationName], otherModel));
                    }
                });
            });
            yield Promise.all(promises);
            return isArray ? entities : entities[0];
        });
    }
    static setLoaded(entities, model) {
        return __awaiter(this, void 0, void 0, function* () {
            entities = yield entities;
            if (entities === null || entities === undefined) {
                return null;
            }
            const isArray = Array.isArray(entities);
            if (!isArray) {
                entities = [entities];
            }
            const relations = model.getRelationDefinitions();
            const relationKeys = Object.keys(relations);
            const promises = [];
            entities.forEach((entity) => {
                entity.setLoaded(true);
                relationKeys.forEach((relationName) => {
                    if (entity[relationName]) {
                        const otherModel = this.getModel(relations[relationName].target);
                        promises.push(this.setLoaded(entity[relationName], otherModel));
                    }
                });
            });
            yield Promise.all(promises);
            return isArray ? entities : entities[0];
        });
    }
    findEntities(model, where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return BaseDatabase.setLoaded(repository.find(BaseDatabase.buildQuery(where, order, limit, offset, relations)), model);
        });
    }
    findAndCountEntities(model, where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return BaseDatabase.setLoaded(repository.findAndCount(BaseDatabase.buildQuery(where, order, limit, offset, relations)), model);
        });
    }
    count(model, where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return repository.count(BaseDatabase.buildQuery(where, order, limit, offset, relations));
        });
    }
    findOneEntity(model, where, order, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return BaseDatabase.setLoaded(repository.findOne(BaseDatabase.buildQuery(where, order, undefined, offset, relations)), model);
        });
    }
    findById(model, id, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return BaseDatabase.setLoaded(repository.findOne(id, BaseDatabase.buildQuery(undefined, undefined, undefined, undefined, relations)), model);
        });
    }
    findByIds(model, ids, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return BaseDatabase.setLoaded(repository.findByIds(ids, BaseDatabase.buildQuery(undefined, undefined, undefined, undefined, relations)), model);
        });
    }
    clearModel(model) {
        return __awaiter(this, void 0, void 0, function* () {
            const repository = yield this.getRepository(model);
            return repository.clear();
        });
    }
    getRepository(model) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield this.connectionPromise;
            return connection.getRepository(model);
        });
    }
    createQueryBuilder(model) {
        return __awaiter(this, void 0, void 0, function* () {
            if (model) {
                const repo = yield this.getRepository(model);
                return repo.createQueryBuilder(model.getSchemaName());
            }
            const connection = yield this.connectionPromise;
            return connection.createQueryBuilder();
        });
    }
    createQueryRunner() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield this.connectionPromise;
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
                if (typeof entity[0] !== 'number') {
                    const ids = [];
                    entity.forEach((ent) => ids.push(ent.id));
                    entity = ids;
                }
            }
            else {
                if (!model) {
                    model = entity.constructor;
                }
                if (typeof entity !== 'number') {
                    entity = entity.id;
                }
            }
            const repository = yield this.getRepository(model);
            return repository.delete(entity);
        });
    }
    rawQuery(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.connectionPromise).query(sql, params);
        });
    }
    waitForConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.connectionPromise;
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
        BaseDatabase.models[model.getSchemaName()] = model;
    }
    static getModel(modelName) {
        return this.models[modelName];
    }
    static getAllModels() {
        return this.models;
    }
}
exports.BaseDatabase = BaseDatabase;
BaseDatabase.models = {};
BaseDatabase.CONNECTION_OPTIONS = {
    location: 'default',
    // autoSave: true,
    logging: ['error', 'warn'],
    synchronize: true,
    // charset: "utf8mb4",
    // extra: {
    // }
};
BaseDatabase.TYPES = {
    INTEGER: 'int',
    FLOAT: 'float',
    DATE: 'datetime',
    STRING: 'varchar',
    TEXT: 'text',
    MEDIUMTEXT: 'mediumtext',
    BOOLEAN: 'boolean',
    JSON: 'json',
    SIMPLE_JSON: 'simple-json',
    MY_JSON: 'my-json',
};
//# sourceMappingURL=BaseDatabase.js.map