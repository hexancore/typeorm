import { EntitySchemaColumnOptions, PrimaryGeneratedColumn } from 'typeorm';
import { RefId} from '@hexancore/common';
import { RawValueObjectColumn, SelfValueObjectTypeOrmColumn, ValueObjectTypeOrmColumnOptions } from './ValueObjectTypeOrmColumn';

export type RefIdColumnOptions = ValueObjectTypeOrmColumnOptions;

const DEFAULT_OPTIONS: RefIdColumnOptions = { nullable: false };

export const RefIdColumn: SelfValueObjectTypeOrmColumn&RawValueObjectColumn&{asPrimaryKey(): EntitySchemaColumnOptions}  = {
  asRaw(options: RefIdColumnOptions = DEFAULT_OPTIONS): EntitySchemaColumnOptions {
    return {
      type: 'varchar',
      length: 21,
      update: options.update,
      nullable: options.nullable,
      unique: options.unique,
    };
  },

  asSelf(options: RefIdColumnOptions = DEFAULT_OPTIONS): EntitySchemaColumnOptions {
    const s = RefIdColumn.asRaw(options);
    s.transformer = {
      to: (v?: RefId): string | null => (v ? v.v : null),
      from: (v?: string): RefId | null => (v ? RefId.cs(v) : null),
    };
    return s;
  },

  asPrimaryKey(): EntitySchemaColumnOptions {
    const s = RefIdColumn.asSelf();
    s.primary = true;
    return s;
  },

};