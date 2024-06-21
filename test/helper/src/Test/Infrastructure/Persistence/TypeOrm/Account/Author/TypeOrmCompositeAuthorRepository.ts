import {
  AbstractTypeOrmAggregateRootRepository,
  TypeOrmAccountEntitySchema,
  TypeOrmAggregateRootRepository,
  UIntValueColumn,
} from '@';
import { AuthorId, CompositeAuthor, CompositeAuthorRepository } from '@testhelper/src/Test/Domain/test_entities';

export const CompositeAuthorSchema = TypeOrmAccountEntitySchema(CompositeAuthor, {
  columns: {
    id: UIntValueColumn.asPrimaryKey(AuthorId),
  },
});

@TypeOrmAggregateRootRepository(CompositeAuthorSchema)
export class TypeOrmCompositeAuthorRepository extends AbstractTypeOrmAggregateRootRepository<CompositeAuthor> implements CompositeAuthorRepository {}
