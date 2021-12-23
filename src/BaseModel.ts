import { BaseDatabase } from './BaseDatabase';
import { ColumnType } from 'typeorm';
import { BDRelationshipType } from './BDRelationshipType';
import { BDColumnType } from './BDColumnType';

export class BaseModel {
    static SCHEMA_NAME: string;
    protected static database: BaseDatabase = null;

    static RELATION;

    static setDatabase(database: BaseDatabase) {
        this.database = database;
    }

    id: number;
    private isLoaded: boolean;

    constructor() {
        this.id = null;
        this.isLoaded = false;
    }

    getId() {
        return this.id;
    }

    setId(id) {
        this.id = id;
    }

    static getColumnDefinitions(): Record<string, BDColumnType | string> {
        return {
            id: {
                primary: true,
                type: BaseDatabase.TYPES.INTEGER,
                generated: true,
            },
        };
    }

    static getRelationDefinitions(): Record<string, BDRelationshipType> {
        return {};
    }

    static getRelations(): string[] {
        return Object.keys(this.getRelationDefinitions());
    }

    static getSchemaDefinition() {
        const columns = this.getColumnDefinitions();
        Object.keys(columns).forEach((columnName) => {
            let column = columns[columnName];
            if (typeof column === 'string') {
                column = { type: columns[columnName] as ColumnType };
            }
            if (column.type === BaseDatabase.TYPES.MY_JSON && !column.transformer) {
                column.type = BaseDatabase.TYPES.MEDIUMTEXT;
                column.transformer = {
                    from: (text) => {
                        return text ? JSON.parse(text) : null;
                    },
                    to: (json) => {
                        return json ? JSON.stringify(json) : '';
                    },
                };
            }
            if (column.type === BaseDatabase.TYPES.BOOLEAN && !column.transformer) {
                column.transformer = {
                    from: (val) => {
                        if (val === 'false') {
                            return false;
                        }
                        if (val === 'true') {
                            return true;
                        }
                        return val;
                    },
                    to: (val) => {
                        // console.log("to", val);
                        return val;
                        // if (val === true) {
                        //     return 1;
                        // }
                        // return 0;
                    },
                };
            }

            columns[columnName] = column;
        });
        return {
            name: this.getSchemaName(),
            target: this,
            columns: columns as Record<string, BDColumnType>,
            relations: this.getRelationDefinitions(),
        };
    }

    static getSchemaName() {
        if (!this.SCHEMA_NAME) {
            this.SCHEMA_NAME = this.name;
        }
        return this.SCHEMA_NAME;
    }

    setLoaded(isLoaded) {
        this.isLoaded = isLoaded;
    }

    async save() {
        return (<typeof BaseModel>this.constructor).database.saveEntity(this);
    }

    async delete() {
        return (<typeof BaseModel>this.constructor).database.deleteEntity(this);
    }

    static async deleteMany(entities) {
        return this.database.deleteEntity(entities);
    }

    static async saveMany(entities) {
        return this.database.saveEntity(entities);
    }

    static async find(where?, order?, limit?, offset?, relations?) {
        return this.database.findEntities(this, where, order, limit, offset, relations);
    }

    static async findAndCount(where?, order?, limit?, offset?, relations?) {
        return this.database.findAndCountEntities(this, where, order, limit, offset, relations);
    }

    static async count(where?, order?, limit?, offset?, relations?) {
        return this.database.count(this, where, order, limit, offset, relations);
    }

    static async findOne(where?, order?, offset?, relations?) {
        return this.database.findOneEntity(this, where, order, offset, relations);
    }

    static async findById(id, relations?) {
        return this.database.findById(this, id, relations);
    }

    static async findByIds(ids, relations?) {
        return this.database.findByIds(this, ids, relations);
    }

    static async clear() {
        return this.database.clearModel(this);
    }

    static equals(a, b) {
        if (a === b) {
            return true;
        }

        if (a === null || b === null) {
            return false;
        }

        if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
            return a.every((subA, index) => this.equals(subA, b[index]));
        }
        if (a instanceof this && b instanceof this) {
            return a.constructor === b.constructor && a.getId() === b.getId();
        }
        return false;
    }
}

BaseModel.RELATION = {
    MANY_TO_MANY: 'many-to-many',
    MANY_TO_ONE: 'many-to-one',
    ONE_TO_MANY: 'one-to-many',
    ONE_TO_ONE: 'one-to-one',
};
