import {
  AbstractTypeOrmAggregateRootRepository,
  AbstractTypeOrmEntityRepository,
  DateTimeColumn,
  TypeOrmAggregateRootRepository,
  TypeOrmEntityRepository,
  TypeOrmEntitySchema,
  UIntValueColumn,
} from '@';
import { DataSourceContextIdProvider } from '@/DataSource/DataSourceContext';
import { IAggregateRootRepository } from '@hexancore/core';
import { Author, AuthorId, Book, BookId, CompositeAuthor, CompositeBook } from './test_entities';

export const AuthorSchema = TypeOrmEntitySchema(Author, {
  columns: {
    id: UIntValueColumn.asPrimaryKey(AuthorId),
  },
});

export const BookSchema = TypeOrmEntitySchema(Book, {
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

export interface AuthorRepository extends IAggregateRootRepository<Author> {}

@TypeOrmAggregateRootRepository(AuthorSchema)
export class TypeOrmAuthorRepository extends AbstractTypeOrmAggregateRootRepository<Author> implements AuthorRepository {
}

export const CompositeBookSchema = TypeOrmEntitySchema(CompositeBook, {
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

export const CompositeAuthorSchema = TypeOrmEntitySchema(CompositeAuthor, {
  columns: {
    id: UIntValueColumn.asPrimaryKey(AuthorId),
  },
});

@TypeOrmEntityRepository(CompositeBookSchema)
export class TypeOrmCompositeBookRepository extends AbstractTypeOrmEntityRepository<CompositeBook> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CompositeAuthorRepository extends IAggregateRootRepository<CompositeAuthor> {}

@TypeOrmAggregateRootRepository(CompositeAuthorSchema)
export class TypeOrmCompositeAuthorRepository extends AbstractTypeOrmAggregateRootRepository<CompositeAuthor> implements CompositeAuthorRepository {
}

export class TestDataSourceContextIdProvider implements DataSourceContextIdProvider {
  public get(): string {
    return 'hexancore_dev';
  }
}


