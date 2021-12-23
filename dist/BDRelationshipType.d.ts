import { EntitySchemaRelationOptions } from 'typeorm';
import { Override } from './TypeHelpers';
export declare type BDRelationshipType = Override<EntitySchemaRelationOptions, {
    target: string;
    sync?: boolean;
}>;
