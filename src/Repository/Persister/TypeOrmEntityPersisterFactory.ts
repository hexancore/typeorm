import { AbstractEntityPersister, AbstractEntityRepositoryCommon, IEntityPersisterFactory } from '@hexancore/core';
import { DataSourceContext } from '../../DataSource/DataSourceContext';
import { TypeOrmEntityPersister } from './TypeOrmEntityPersister';

export class TypeOrmEntityPersisterFactory implements IEntityPersisterFactory {
  public constructor(private context: DataSourceContext) {}

  public create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P {
    return new TypeOrmEntityPersister(repository, this.context) as any;
  }
}
