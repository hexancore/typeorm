import { EntitySchemaColumnOptions } from 'typeorm';

export interface ValueObjectTypeOrmColumnOptions {
  nullable?: boolean;
  update?: boolean;
  unique?: boolean;
}

export type ValueObjectAsPrimaryKeyColumnOptions = {
  generated?: true | 'identity' | 'increment' | 'uuid' | null;
};

export interface RawValueObjectColumn<O extends ValueObjectTypeOrmColumnOptions = ValueObjectTypeOrmColumnOptions> {
  asRaw(options?: O): EntitySchemaColumnOptions;
}

export interface ValueObjectTypeOrmColumn<
  O extends ValueObjectTypeOrmColumnOptions = ValueObjectTypeOrmColumnOptions,
  OP extends ValueObjectAsPrimaryKeyColumnOptions = ValueObjectAsPrimaryKeyColumnOptions,
> extends RawValueObjectColumn<O> {
  asPrimaryKey(voConstructor: any, options?: OP): EntitySchemaColumnOptions;
  as(voConstructor: any, options?: O): EntitySchemaColumnOptions;
}

export interface PKValueObjectColumn<OP extends ValueObjectAsPrimaryKeyColumnOptions = ValueObjectAsPrimaryKeyColumnOptions> {
  asPrimaryKeyIdentity(voConstructor: any, options?: Omit<OP, 'generated'>): EntitySchemaColumnOptions;
}

export interface SelfValueObjectTypeOrmColumn<
  O extends ValueObjectTypeOrmColumnOptions = ValueObjectTypeOrmColumnOptions,
> {
  asSelf(options?: O): EntitySchemaColumnOptions;
}