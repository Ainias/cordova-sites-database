import * as _typeorm from "typeorm";
import { QueryBuilder, QueryRunner } from "typeorm";
export declare class BaseDatabase {
    static CONNECTION_OPTIONS: any;
    static _models: any;
    static instance: BaseDatabase;
    static TYPES: any;
    _connectionPromise: any;
    constructor(database?: any);
    _createConnection(options: any): Promise<_typeorm.Connection>;
    _createConnectionOptions(database: any): any;
    getEntityDefinitions(): any[];
    saveEntity(entity: any): Promise<any>;
    static _buildQuery(where: any, order: any, limit: any, offset: any, relations: any): {};
    static _setLoaded(models: any): Promise<any>;
    findEntities(model: any, where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    findAndCountEntities(model: any, where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    findOneEntity(model: any, where?: any, order?: any, offset?: any, relations?: any): Promise<any>;
    findById(model: any, id: any, relations?: any): Promise<any>;
    findByIds(model: any, ids: any, relations?: any): Promise<any>;
    clearModel(model: any): Promise<any>;
    _getRepository(model: any): Promise<any>;
    createQueryBuilder(model?: any): Promise<QueryBuilder<any>>;
    createQueryRunner(): Promise<QueryRunner>;
    deleteEntity(entity: any, model?: any): Promise<any>;
    rawQuery(sql: any, params?: any): Promise<any>;
    waitForConnection(): Promise<any>;
    /**
     * @return {BaseDatabase}
     */
    static getInstance(): BaseDatabase;
    static addModel(model: any): void;
    static getModel(modelName?: any): any;
}
