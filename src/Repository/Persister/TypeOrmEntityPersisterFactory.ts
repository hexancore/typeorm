import { AbstractEntityPersister, AbstractEntityRepositoryCommon, IEntityPersisterFactory } from '@hexancore/core';
import { TypeOrmEntityPersister } from './TypeOrmEntityPersister';
import { AbstractDataSourceContext } from '../../DataSource/AbstractDataSourceContext';

export class TypeOrmEntityPersisterFactory implements IEntityPersisterFactory {
  public constructor(private context: AbstractDataSourceContext) { }

  public create<P extends AbstractEntityPersister<any, any>>(repository: AbstractEntityRepositoryCommon<any, any, any>): P {
    return new TypeOrmEntityPersister(repository, this.context) as any;
  }
}
