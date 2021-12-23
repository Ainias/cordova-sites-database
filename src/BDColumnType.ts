import { EntitySchemaColumnOptions } from 'typeorm';
import { Override } from './TypeHelpers';

export type BDColumnType = Override<
    EntitySchemaColumnOptions,
    {
        escapeJS?: boolean;
        escapeHTML?: boolean;
    }
>;
