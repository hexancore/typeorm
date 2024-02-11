import {
  AbstractTypeOrmEntityRepository,
  DateTimeColumn,
  TypeOrmAccountEntitySchema,
  TypeOrmEntityRepository,
  UIntValueColumn
} from '@';
import { AuthorId, Book, BookId } from '@test/src/Test/Domain/test_entities';

export const BookSchema = TypeOrmAccountEntitySchema(Book, {
  columns: {
    id: UIntValueColumn.asPrimaryKey(BookId),
    authorId: UIntValueColumn.as(AuthorId, { type: 'smallint' }),
    name: {
      type: 'varchar',
      length: 255,
    },
    createdAt: DateTimeColumn.asSelf(),
  },
});

@TypeOrmEntityRepository(BookSchema)
export class TypeOrmBookRepository extends AbstractTypeOrmEntityRepository<Book> {}
