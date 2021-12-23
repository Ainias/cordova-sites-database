import { EntitySchemaRelationOptions } from 'typeorm';
export declare type RelationshipType = EntitySchemaRelationOptions & {
    sync?: boolean;
};
