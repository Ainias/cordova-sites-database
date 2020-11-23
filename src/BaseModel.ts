import {BaseDatabase} from "./BaseDatabase";

export class BaseModel {

    static SCHEMA_NAME: string;
    static _database: BaseDatabase;
    static RELATION;

    id: number;
    _isLoaded: boolean;

    constructor() {
        this.id = null;
        this._isLoaded = false;
    }

    getId() {
        return this.id;
    }

    setId(id) {
        this.id = id;
    }

    static getColumnDefinitions() {
        return {
            id: {
                primary: true,
                type: BaseDatabase.TYPES.INTEGER,
                generated: true
            },
        }
    }

    static getRelationDefinitions() {
        return {};
    }

    static getRelations() {
        return Object.keys(this.getRelationDefinitions());
    }

    static getSchemaDefinition() {
        let columns = this.getColumnDefinitions();
        Object.keys(columns).forEach(column => {
            if (typeof columns[column] === "string") {
                columns[column] = {type: columns[column]};
            }
            if (columns[column].type === BaseDatabase.TYPES.MY_JSON && !columns[column].transformer) {
                columns[column].type = BaseDatabase.TYPES.MEDIUMTEXT;
                columns[column].transformer = {
                    from: text => {
                        return (text ? JSON.parse(text) : null)
                    },
                    to: json => {
                        return (json ? JSON.stringify(json) : "")
                    }
                }
            }
            if (columns[column].type === BaseDatabase.TYPES.BOOLEAN && !columns[column].transformer) {
                columns[column].transformer = {
                    from: val => {
                        if (val === "false"){
                            return false;
                        }
                        else if (val === "true"){
                            return true;
                        }
                        else {
                            return val
                        }
                    },
                    to: val => {
                        if (val === true){
                            return 1
                        }
                        else {
                            return 0;
                        }
                    }
                }
            }
        });
        return {
            name: this.getSchemaName(),
            target: this,
            columns: columns,
            relations: this.getRelationDefinitions()
        };
    }

    static getSchemaName() {
        if (!this.SCHEMA_NAME) {
            this.SCHEMA_NAME = this.name;
        }
        return this.SCHEMA_NAME;
    }
    setLoaded(isLoaded){
        this._isLoaded = isLoaded;
    }

    async save() {
        return (<typeof BaseModel>this.constructor)._database.saveEntity(this);
    }

    async delete() {
        return (<typeof BaseModel>this.constructor)._database.deleteEntity(this);
    }

    static async deleteMany(entities) {
        return this._database.deleteEntity(entities);
    }

    static async saveMany(entities) {
        return this._database.saveEntity(entities);
    }

    static async find(where?, order?, limit?, offset?, relations?) {
        return this._database.findEntities(this, where, order, limit, offset, relations);
    }

    static async findAndCount(where?, order?, limit?, offset?, relations?) {
        return this._database.findAndCountEntities(this, where, order, limit, offset, relations);
    }

    static async findOne(where?, order?, offset?, relations?) {
        return this._database.findOneEntity(this, where, order, offset, relations);
    }

    static async findById(id, relations?) {
        return this._database.findById(this, id, relations);
    }

    static async findByIds(ids, relations?) {
        return this._database.findByIds(this, ids, relations);
    }

    static async clear() {
        return this._database.clearModel(this);
    }

    static equals(a, b) {
        if (a === b) {
            return true;
        }

        if (a === null || b === null){
            return false;
        }

        if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
            return a.every((subA, index) => {
                this.equals(subA, b[index]);
            });
        } else if (a instanceof this && b instanceof this) {
            return a.constructor === b.constructor && a.getId() === b.getId();
        }
    }
}

/**
 * @type {null | BaseDatabase}
 * @private
 */
BaseModel._database = null;

BaseModel.RELATION = {
    MANY_TO_MANY: "many-to-many",
    MANY_TO_ONE: "many-to-one",
    ONE_TO_MANY: "one-to-many",
    ONE_TO_ONE: "one-to-one"
};