import { EntitySchemaColumnOptions } from 'typeorm';
import { StringValue, StringValueConstructor,} from '@hexancore/common';
import { ValueObjectAsPrimaryKeyColumnOptions, ValueObjectTypeOrmColumn, ValueObjectTypeOrmColumnOptions } from './ValueObjectTypeOrmColumn';

type VOCtor = StringValueConstructor;

export type StringColumnType = 'char' | 'varchar' | 'text' | 'mediumtext' | 'longtext';
type StringValueColumnExtraOptions = {
  type: StringColumnType;
  length?: number
};
export type StringValueColumnOptions = ValueObjectTypeOrmColumnOptions & StringValueColumnExtraOptions;
export type StringPrimaryKeyColumnOptions = ValueObjectAsPrimaryKeyColumnOptions & StringValueColumnExtraOptions;

const DEFAULT_OPTIONS: StringValueColumnOptions = { type: 'varchar', length: 255, nullable: false };

export const StringValueColumn: ValueObjectTypeOrmColumn<StringValueColumnOptions, StringPrimaryKeyColumnOptions> = {
  asRaw(options: StringValueColumnOptions = DEFAULT_OPTIONS): EntitySchemaColumnOptions {
    return {
      type: options.type,
      length: options.length ?? (options.type === 'varchar' ? 255 : undefined),
      update: options.update,
      nullable: options.nullable,
      unique: options.unique,
    };
  },

  as(voConstructor: VOCtor, options: StringValueColumnOptions = DEFAULT_OPTIONS): EntitySchemaColumnOptions {
    const s = StringValueColumn.asRaw(options);
    s.transformer = {
      to: (v?: StringValue): string | null => (v ? v.v : null),
      from: (v?: number): StringValue | null => (v ? voConstructor.c(v).v : null),
    };
    return s;
  },

  asPrimaryKey(voConstructor: VOCtor, options: StringPrimaryKeyColumnOptions = { generated: true, type: 'varchar', length: 255 }): EntitySchemaColumnOptions {
    const s = StringValueColumn.as(voConstructor);
    s.primary = true;
    s.generated = options.generated;
    return s;
  },
};