import { AbstractEntityPersister, AbstractEntityRepositoryCommon, IEntityPersisterFactory } from '@hexancore/core';
import { TypeOrmEntityPersister } from './TypeOrmEntityPersister';
import { DataSourceContext } from '../../DataSource/DataSourceContext';

export class TypeOrmEntityPersisterFactory implements IEntityPersisterFactory {
  public constructor(private context: DataSourceContext) {}

  public create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P {
    return new TypeOrmEntityPersister(repository, this.context) as any;
  }
}
