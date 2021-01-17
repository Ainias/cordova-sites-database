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
                type: BaseDatabase_1.BaseDatabase.TYPES.INTEGER,
                generated: true
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
        let columns = this.getColumnDefinitions();
        Object.keys(columns).forEach(column => {
            if (typeof columns[column] === "string") {
                columns[column] = { type: columns[column] };
            }
            if (columns[column].type === BaseDatabase_1.BaseDatabase.TYPES.MY_JSON && !columns[column].transformer) {
                columns[column].type = BaseDatabase_1.BaseDatabase.TYPES.MEDIUMTEXT;
                columns[column].transformer = {
                    from: text => {
                        return (text ? JSON.parse(text) : null);
                    },
                    to: json => {
                        return (json ? JSON.stringify(json) : "");
                    }
                };
            }
            if (columns[column].type === BaseDatabase_1.BaseDatabase.TYPES.BOOLEAN && !columns[column].transformer) {
                columns[column].transformer = {
                    from: val => {
                        if (val === "false") {
                            return false;
                        }
                        else if (val === "true") {
                            return true;
                        }
                        else {
                            return val;
                        }
                    },
                    to: val => {
                        if (val === true) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    }
                };
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
    setLoaded(isLoaded) {
        this._isLoaded = isLoaded;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.constructor._database.saveEntity(this);
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.constructor._database.deleteEntity(this);
        });
    }
    static deleteMany(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.deleteEntity(entities);
        });
    }
    static saveMany(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.saveEntity(entities);
        });
    }
    static find(where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.findEntities(this, where, order, limit, offset, relations);
        });
    }
    static findAndCount(where, order, limit, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.findAndCountEntities(this, where, order, limit, offset, relations);
        });
    }
    static findOne(where, order, offset, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.findOneEntity(this, where, order, offset, relations);
        });
    }
    static findById(id, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.findById(this, id, relations);
        });
    }
    static findByIds(ids, relations) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.findByIds(this, ids, relations);
        });
    }
    static clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._database.clearModel(this);
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
            return a.every((subA, index) => {
                this.equals(subA, b[index]);
            });
        }
        else if (a instanceof this && b instanceof this) {
            return a.constructor === b.constructor && a.getId() === b.getId();
        }
    }
}
exports.BaseModel = BaseModel;
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
//# sourceMappingURL=BaseModel.js.map