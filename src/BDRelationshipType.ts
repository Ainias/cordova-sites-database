import { EntitySchemaRelationOptions } from 'typeorm';
import { Override } from './TypeHelpers';

export type BDRelationshipType = Override<
    EntitySchemaRelationOptions,
    {
        target: string;
        sync?: boolean;
    }
>;
