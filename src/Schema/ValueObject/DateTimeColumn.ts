import { EntitySchemaColumnOptions } from 'typeorm';
import { DateTime } from '@hexancore/common';
import { ValueObjectAsPrimaryKeyColumnOptions, ValueObjectTypeOrmColumn, ValueObjectTypeOrmColumnOptions, SelfValueObjectTypeOrmColumn } from './ValueObjectTypeOrmColumn';

export const DateTimeColumn: ValueObjectTypeOrmColumn&SelfValueObjectTypeOrmColumn = {
  asRaw(options: ValueObjectTypeOrmColumnOptions = { nullable: false }): EntitySchemaColumnOptions {
    return {
      type: 'timestamp',
      nullable: options.nullable,
      update: false,
      unique: options.unique,
    };
  },

  as(voConstructor?: any, options: ValueObjectTypeOrmColumnOptions = { nullable: false }): EntitySchemaColumnOptions {
    const s = DateTimeColumn.asRaw(options);
    s.transformer = {
      to: (v?: DateTime): Date | null => (v ? v.toNativeDate() : null),
      from: (v: string | Date): Date | null => {
        return v !== null ? voConstructor.cs(v) : null;
      },
    };
    return s;
  },

  asPrimaryKey(_voConstructor: any, _options: ValueObjectAsPrimaryKeyColumnOptions = { generated: true }): EntitySchemaColumnOptions {
    throw new Error('Function not implemented.');
  },

  asSelf: function (options: ValueObjectTypeOrmColumnOptions = { nullable: false }): EntitySchemaColumnOptions {
    return DateTimeColumn.as(DateTime, options);
  },
};
