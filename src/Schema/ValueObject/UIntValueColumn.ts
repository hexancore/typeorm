import { EntitySchemaColumnOptions } from 'typeorm';
import { UIntValue, UIntValueConstructor } from '@hexancore/common';
import { ValueObjectAsPrimaryKeyColumnOptions, ValueObjectTypeOrmColumn, ValueObjectTypeOrmColumnOptions, type PKValueObjectColumn } from './ValueObjectTypeOrmColumn';

type VOCtor = UIntValueConstructor<any>;

export type UIntColumnTypeOption = 'tinyint' | 'smallint' | 'mediumint' | 'int';
export type UIntValueColumnOptions = ValueObjectTypeOrmColumnOptions & {
  type: UIntColumnTypeOption;
};

export type PGGeneratedIdentityType = "ALWAYS" | "BY DEFAULT";

export type UIntPrimaryKeyColumnOptions = ValueObjectAsPrimaryKeyColumnOptions & {
  type: UIntColumnTypeOption,
  generatedIdentity?: PGGeneratedIdentityType,
  generationStrategy?: "uuid" | "increment" | "rowid" | "identity";
};

const defaultPKOptions: UIntPrimaryKeyColumnOptions = { generated: "increment", generatedIdentity: "ALWAYS", type: 'int' };

export const UIntValueColumn: ValueObjectTypeOrmColumn<UIntValueColumnOptions, UIntPrimaryKeyColumnOptions>&PKValueObjectColumn<UIntPrimaryKeyColumnOptions> = {
  asRaw(options: UIntValueColumnOptions = { type: 'int', nullable: false }): EntitySchemaColumnOptions {
    return {
      type: options.type,
      unsigned: true,
      update: options.update,
      nullable: options.nullable,
      unique: options.unique,
    };
  },

  as(voConstructor: VOCtor, options: UIntValueColumnOptions = { type: 'int', nullable: false }): EntitySchemaColumnOptions {
    const s = UIntValueColumn.asRaw(options);
    s.transformer = {
      to: (v?: UIntValue): number | null => (v ? v.v : null),
      from: (v?: number): UIntValue | null => (v ? voConstructor.c(v).v : null),
    };
    return s;
  },

  asPrimaryKey(voConstructor: VOCtor, options: UIntPrimaryKeyColumnOptions = defaultPKOptions): EntitySchemaColumnOptions {
    const s: any = UIntValueColumn.as(voConstructor, { type: options.type });
    s.primary = true;
    if (options.generated && options.generatedIdentity === 'ALWAYS') {
      s.insert = false;
    }

    s.generated = options.generated;
    s.generatedIdentity = options.generatedIdentity ?? "ALWAYS";
    return s;
  },

  asPrimaryKeyIdentity(voConstructor: VOCtor, options: {
    type: UIntColumnTypeOption,
    generatedIdentity: PGGeneratedIdentityType
  } = { generatedIdentity: "ALWAYS", type: 'int' }): EntitySchemaColumnOptions {
    const s: any = UIntValueColumn.asPrimaryKey(voConstructor, {
      type: options.type,
      generated: "identity",
      generatedIdentity: options.generatedIdentity ?? "ALWAYS",
    } as any);
    return s;
  },
};
