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
exports.BaseModel = void 0;
const BaseDatabase_1 = require("./BaseDatabase");
class BaseModel {
    constructor() {
        this.id = null;
        this.isLoaded = false;
    }
    static setDatabase(database) {
        this.database = database;
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
                type: BaseDatabase_1.BaseDatabase.TYPES.INTEGER,
                generated: true,
            },
        };
    }
    static getRelationDefinitions() {
        return {};
    }
    static getRelations() {
        return Object.keys(this.getRelationDefinitions());
    }
    static getSchemaDefinition() {
        const columns = this.getColumnDefinitions();
        Object.keys(columns).forEach((columnName) => {
            let column = columns[columnName];
            if (typeof column === 'string') {
                column = { type: columns[columnName] };
            }
            if (column.type === BaseDatabase_1.BaseDatabase.TYPES.MY_JSON && !column.transformer) {
                column.type = BaseDatabase_1.BaseDatabase.TYPES.MEDIUMTEXT;
                column.transformer = {
                    from: (text) => {
                        return text ? JSON.parse(text) : null;
                    },
                    to: (json) => {
                        return json ? JSON.stringify(json) : '';
                    },
                };
            }
            if (column.type === BaseDatabase_1.BaseDatabase.TYPES.BOOLEAN && !column.transformer) {
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
            columns: columns,
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
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.constructor.database.saveEntity(this);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.constructor.database.deleteEntity(this);
        });
    }
    static deleteMany(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.deleteEntity(entities);
        });
    }
    static saveMany(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.saveEntity(entities);
        });
    }
    static find(where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.findEntities(this, where, order, limit, offset, relations);
        });
    }
    static findAndCount(where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.findAndCountEntities(this, where, order, limit, offset, relations);
        });
    }
    static count(where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.count(this, where, order, limit, offset, relations);
        });
    }
    static findOne(where, order, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.findOneEntity(this, where, order, offset, relations);
        });
    }
    static findById(id, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.findById(this, id, relations);
        });
    }
    static findByIds(ids, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.findByIds(this, ids, relations);
        });
    }
    static clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.database.clearModel(this);
        });
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
exports.BaseModel = BaseModel;
BaseModel.database = null;
BaseModel.RELATION = {
    MANY_TO_MANY: 'many-to-many',
    MANY_TO_ONE: 'many-to-one',
    ONE_TO_MANY: 'one-to-many',
    ONE_TO_ONE: 'one-to-one',
};
//# sourceMappingURL=BaseModel.js.map