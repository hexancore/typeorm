import {
  AbstractTypeOrmAggregateRootRepository,
  TypeOrmAccountEntitySchema,
  TypeOrmAggregateRootRepository,
  UIntValueColumn
} from '@';
import { Author, AuthorId, AuthorRepository } from '@test/Module/Test/Domain/test_entities';

export const AuthorSchema = TypeOrmAccountEntitySchema(Author, {

  columns: {
    id: UIntValueColumn.asPrimaryKey(AuthorId),
  },
});

@TypeOrmAggregateRootRepository(AuthorSchema)
export class TypeOrmAuthorRepository extends AbstractTypeOrmAggregateRootRepository<Author> implements AuthorRepository {}
