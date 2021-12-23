import { BaseDatabase } from './BaseDatabase';
import { BDRelationshipType } from './BDRelationshipType';
import { BDColumnType } from './BDColumnType';
export declare class BaseModel {
    static SCHEMA_NAME: string;
    protected static database: BaseDatabase;
    static RELATION: any;
    static setDatabase(database: BaseDatabase): void;
    id: number;
    private isLoaded;
    constructor();
    getId(): number;
    setId(id: any): void;
    static getColumnDefinitions(): Record<string, BDColumnType | string>;
    static getRelationDefinitions(): Record<string, BDRelationshipType>;
    static getRelations(): string[];
    static getSchemaDefinition(): {
        name: string;
        target: typeof BaseModel;
        columns: Record<string, BDColumnType>;
        relations: Record<string, BDRelationshipType>;
    };
    static getSchemaName(): string;
    setLoaded(isLoaded: any): void;
    save(): Promise<any>;
    delete(): Promise<any[] | import("typeorm").DeleteResult>;
    static deleteMany(entities: any): Promise<any[] | import("typeorm").DeleteResult>;
    static saveMany(entities: any): Promise<any>;
    static find(where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<BaseModel[]>;
    static findAndCount(where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    static count(where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<number>;
    static findOne(where?: any, order?: any, offset?: any, relations?: any): Promise<any>;
    static findById(id: any, relations?: any): Promise<any>;
    static findByIds(ids: any, relations?: any): Promise<any>;
    static clear(): Promise<void>;
    static equals(a: any, b: any): any;
}
