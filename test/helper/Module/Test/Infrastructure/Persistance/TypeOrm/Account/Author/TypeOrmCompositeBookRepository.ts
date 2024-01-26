import {
  AbstractTypeOrmEntityRepository,
  DateTimeColumn,
  TypeOrmAccountEntitySchema,
  TypeOrmEntityRepository,
  UIntValueColumn
} from '@';
import { AuthorId, BookId, CompositeBook } from '@test/Module/Test/Domain/test_entities';


export const CompositeBookSchema = TypeOrmAccountEntitySchema(CompositeBook, {
  columns: {
    authorId: UIntValueColumn.asPrimaryKey(AuthorId, { type: 'smallint', generated: null }),
    id: UIntValueColumn.asPrimaryKey(BookId, { type: 'smallint', generated: null }),
    name: {
      type: 'varchar',
      length: 255,
    },
    createdAt: DateTimeColumn.asSelf(),
  },
});


@TypeOrmEntityRepository(CompositeBookSchema)
export class TypeOrmCompositeBookRepository extends AbstractTypeOrmEntityRepository<CompositeBook> {}

