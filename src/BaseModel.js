import {EntitySchema} from "typeorm";

export class BaseModel {
    constructor(){
        this.id = null;
    }

    static getColumnDefinitions(){
        return {
            id: {
                primary: true,
                type: "int",
                generated: true
            },
        }
    }

    static getSchemaDefinition(){
        return {
            name: this.getSchemaName(),
            target: this,
            columns: this.getColumnDefinitions(),
            relations: {}
        }
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

    static async findById(id){
        return BaseModel._databaseClass.getInstance().findById(this, id);
    }

    static async findByIds(ids){
        return BaseModel._databaseClass.getInstance().findByIds(this, ids);
    }

    static async clear(){
        return BaseModel._databaseClass.getInstance().clearModel(this);
    }
}

/**
 * @type {null | Database}
 * @private
 */
BaseModel._databaseClass = null;