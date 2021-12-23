import { EntitySchemaColumnOptions } from 'typeorm';
import { Override } from './TypeHelpers';
export declare type BDColumnType = Override<EntitySchemaColumnOptions, {
    escapeJS?: boolean;
    escapeHTML?: boolean;
}>;
