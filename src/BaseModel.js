import {BaseDatabase} from "./BaseDatabase";

export class BaseModel {
    constructor(){
        this.id = null;
        this._isLoaded = false;
    }

    static getColumnDefinitions(){
        return {
            id: {
                primary: true,
                type: BaseDatabase.TYPES.INTEGER,
                generated: true
            },
        }
    }

    static getRelationDefinitions(){
        return {};
    }

    static getRelations(){
        return Object.keys(this.getRelationDefinitions());
    }

    static getSchemaDefinition(){
        return {
            name: this.getSchemaName(),
            target: this,
            columns: this.getColumnDefinitions(),
            relations: this.getRelationDefinitions()
        };
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

    static async findById(id, relations){
        return BaseModel._databaseClass.getInstance().findById(this, id, relations);
    }

    static async findByIds(ids, relations){
        return BaseModel._databaseClass.getInstance().findByIds(this, ids, relations);
    }

    static async clear(){
        return BaseModel._databaseClass.getInstance().clearModel(this);
    }
}

/**
 * @type {null | BaseDatabase}
 * @private
 */
BaseModel._databaseClass = null;