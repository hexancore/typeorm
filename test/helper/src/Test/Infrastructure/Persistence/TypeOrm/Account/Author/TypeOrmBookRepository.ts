import {
  AbstractTypeOrmEntityRepository,
  DateTimeColumn,
  TypeOrmAccountEntitySchema,
  TypeOrmEntityRepository,
  UIntValueColumn
} from '@';
import { Inject } from '@nestjs/common';
import { AuthorId, Book, BookId } from '@testhelper/src/Test/Domain/test_entities';

export const BookSchema = TypeOrmAccountEntitySchema(Book, {
  columns: {
    id: UIntValueColumn.asPrimaryKey(BookId),
    authorId: UIntValueColumn.as(AuthorId, { type: 'smallint' }),
    title: { type: 'varchar', length: 255 },
    createdAt: DateTimeColumn.asSelf(),
  },
});

@TypeOrmEntityRepository(BookSchema)
export class TypeOrmBookRepository extends AbstractTypeOrmEntityRepository<Book> { }
