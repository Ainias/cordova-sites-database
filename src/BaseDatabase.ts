import * as _typeorm from 'typeorm';
import { QueryBuilder, QueryRunner } from 'typeorm';
import type { BaseModel } from './BaseModel';

const typeorm = _typeorm;

declare let device: any;

export class BaseDatabase {
    static CONNECTION_OPTIONS;
    private static models: Record<string, typeof BaseModel> = {};
    static instance: BaseDatabase;
    static TYPES;

    private options;

    private readonly connectionPromise: Promise<_typeorm.Connection>;

    constructor(database?) {
        this.options = this.createConnectionOptions(database);
        this.connectionPromise = BaseDatabase.createConnection(this.options);
    }

    getConnectionPromise() {
        return this.connectionPromise;
    }

    private static async createConnection(options) {
        if (options.type === 'sqljs') {
            // wait for SQL to be initialized

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.SQL = await window.initSqlJs();
        }
        return typeorm.createConnection(options).catch((e) => {
            console.error(e);
            return Promise.reject(e);
        });
    }

    isCordova() {
        return this.options.type === 'cordova';
    }

    protected createConnectionOptions(database) {
        const options = BaseDatabase.CONNECTION_OPTIONS;

        if (typeof device === 'undefined' || device.platform !== 'browser') {
            options.type = 'cordova';
            options.database = database;
            options.migrationsTransactionMode = 'none';
        } else {
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

    async saveEntity(entity) {
        let repository: _typeorm.Repository<BaseModel> = null;
        if (Array.isArray(entity)) {
            if (entity.length === 0) {
                return entity;
            }
            repository = await this.getRepository(entity[0].constructor);
        } else {
            repository = await this.getRepository(entity.constructor);
        }
        return repository.save(entity, { transaction: !this.isCordova() });
    }

    private static buildQuery(where, order, limit, offset, relations) {
        const query: Record<string, unknown> = {};
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

    private static async setLoadedForArray<ModelClass extends typeof BaseModel>(entities, model: ModelClass) {
        entities = await entities;
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

        await Promise.all(promises);
        return isArray ? entities : entities[0];
    }

    private static async setLoaded<ModelClass extends typeof BaseModel>(entities, model: ModelClass) {
        entities = await entities;
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
                    const otherModel = this.getModel(relations[relationName].target) as typeof BaseModel;
                    promises.push(this.setLoaded(entity[relationName], otherModel));
                }
            });
        });

        await Promise.all(promises);
        return isArray ? entities : entities[0];
    }

    async findEntities<ModelClass extends typeof BaseModel>(
        model: ModelClass,
        where?,
        order?,
        limit?,
        offset?,
        relations?
    ): Promise<ModelClass['prototype'][]> {
        const repository = await this.getRepository(model);
        return BaseDatabase.setLoaded(
            repository.find(BaseDatabase.buildQuery(where, order, limit, offset, relations)),
            model
        );
    }

    async findAndCountEntities(model, where?, order?, limit?, offset?, relations?) {
        const repository = await this.getRepository(model);
        return BaseDatabase.setLoaded(
            repository.findAndCount(BaseDatabase.buildQuery(where, order, limit, offset, relations)),
            model
        );
    }

    async count(model, where?, order?, limit?, offset?, relations?) {
        const repository = await this.getRepository(model);
        return repository.count(BaseDatabase.buildQuery(where, order, limit, offset, relations));
    }

    async findOneEntity(model, where?, order?, offset?, relations?) {
        const repository = await this.getRepository(model);
        return BaseDatabase.setLoaded(
            repository.findOne(BaseDatabase.buildQuery(where, order, undefined, offset, relations)),
            model
        );
    }

    async findById(model, id, relations?) {
        const repository = await this.getRepository(model);
        return BaseDatabase.setLoaded(
            repository.findOne(id, BaseDatabase.buildQuery(undefined, undefined, undefined, undefined, relations)),
            model
        );
    }

    async findByIds(model, ids, relations?) {
        const repository = await this.getRepository(model);
        return BaseDatabase.setLoaded(
            repository.findByIds(ids, BaseDatabase.buildQuery(undefined, undefined, undefined, undefined, relations)),
            model
        );
    }

    async clearModel(model) {
        const repository = await this.getRepository(model);
        return repository.clear();
    }

    async getRepository<ModelClass extends typeof BaseModel>(model: ModelClass) {
        const connection = await this.connectionPromise;
        return connection.getRepository(model);
    }

    async createQueryBuilder(model?): Promise<QueryBuilder<any>> {
        if (model) {
            const repo = await this.getRepository(model);
            return repo.createQueryBuilder(model.getSchemaName());
        }
        const connection = await this.connectionPromise;
        return connection.createQueryBuilder();
    }

    async createQueryRunner(): Promise<QueryRunner> {
        const connection = await this.connectionPromise;
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
            if (typeof entity[0] !== 'number') {
                const ids = [];
                entity.forEach((ent) => ids.push(ent.id));
                entity = ids;
            }
        } else {
            if (!model) {
                model = entity.constructor;
            }
            if (typeof entity !== 'number') {
                entity = entity.id;
            }
        }
        const repository = await this.getRepository(model);
        return repository.delete(entity);
    }

    async rawQuery(sql, params?) {
        return (await this.connectionPromise).query(sql, params);
    }

    async waitForConnection() {
        return this.connectionPromise;
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

    static getModel(modelName: string) {
        return this.models[modelName];
    }

    static getAllModels() {
        return this.models;
    }
}

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
