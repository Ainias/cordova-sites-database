import { BaseDatabase } from "./BaseDatabase";
export declare class BaseModel {
    static SCHEMA_NAME: string;
    static _database: BaseDatabase;
    static RELATION: any;
    id: number;
    _isLoaded: boolean;
    constructor();
    getId(): number;
    setId(id: any): void;
    static getColumnDefinitions(): {
        id: {
            primary: boolean;
            type: any;
            generated: boolean;
        };
    };
    static getRelationDefinitions(): {};
    static getRelations(): string[];
    static getSchemaDefinition(): {
        name: string;
        target: typeof BaseModel;
        columns: {
            id: {
                primary: boolean;
                type: any;
                generated: boolean;
            };
        };
        relations: {};
    };
    static getSchemaName(): string;
    save(): Promise<any>;
    delete(): Promise<any>;
    static saveMany(entities: any): Promise<any>;
    static find(where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    static findAndCount(where?: any, order?: any, limit?: any, offset?: any, relations?: any): Promise<any>;
    static findOne(where?: any, order?: any, offset?: any, relations?: any): Promise<any>;
    static findById(id: any, relations?: any): Promise<any>;
    static findByIds(ids: any, relations?: any): Promise<any>;
    static clear(): Promise<any>;
    static equals(a: any, b: any): boolean;
}
