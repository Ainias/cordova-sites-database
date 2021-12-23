import * as _typeorm from 'typeorm';
import { QueryBuilder, QueryRunner } from 'typeorm';
import type { BaseModel } from './BaseModel';
export declare class BaseDatabase {
    static CONNECTION_OPTIONS: any;
    private static models;
    static instance: BaseDatabase;
    static TYPES: any;
    private options;
    private readonly connectionPromise;
    constructor(database?: any);
    getConnectionPromise(): Promise<_typeorm.Connection>;
    private static createConnection;
    isCordova(): boolean;
    protected createConnectionOptions(database: any): any;
    getEntityDefinitions(): any[];
    saveEntity(entity: any): Promise<any>;
    private static buildQuery;
    private static setLoadedForArray;
    private static setLoaded;
    findEntities<ModelClass extends typeof BaseModel>(model: ModelClass, where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<ModelClass['prototype'][]>;
    findAndCountEntities(model: any, where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    count(model: any, where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<number>;
    findOneEntity(model: any, where?: any, order?: any, offset?: any, relations?: any): Promise<any>;
    findById(model: any, id: any, relations?: any): Promise<any>;
    findByIds(model: any, ids: any, relations?: any): Promise<any>;
    clearModel(model: any): Promise<void>;
    getRepository<ModelClass extends typeof BaseModel>(model: ModelClass): Promise<_typeorm.Repository<BaseModel>>;
    createQueryBuilder(model?: any): Promise<QueryBuilder<any>>;
    createQueryRunner(): Promise<QueryRunner>;
    deleteEntity(entity: any, model?: any): Promise<any[] | _typeorm.DeleteResult>;
    rawQuery(sql: any, params?: any): Promise<any>;
    waitForConnection(): Promise<_typeorm.Connection>;
    /**
     * @return {BaseDatabase}
     */
    static getInstance(): BaseDatabase;
    static addModel(model: any): void;
    static getModel(modelName: string): typeof BaseModel;
    static getAllModels(): Record<string, typeof BaseModel>;
}
