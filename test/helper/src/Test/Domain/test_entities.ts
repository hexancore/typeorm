/* eslint-disable @typescript-eslint/ban-types */

import { DateTime, UIntValue, ValueObject } from '@hexancore/common';
import {
  AbstractAggregateRoot,
  AbstractEntity,
  AggregateRoot,
  Entity,
  EntityCollection,
  IAggregateRootRepository,
  IEntityCollection,
} from '@hexancore/core';

@ValueObject('Test')
export class BookId extends UIntValue {}

@Entity()
export class Book extends AbstractEntity<BookId, Author> {
  public readonly authorId: AuthorId;
  public readonly createdAt: DateTime;

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}

@ValueObject('Test')
export class AuthorId extends UIntValue {}

@AggregateRoot()
export class Author extends AbstractAggregateRoot<AuthorId> {
  @EntityCollection(Book)
  public declare readonly books: IEntityCollection<Book>;

  public constructor() {
    super();
    return this.proxify();
  }
}

@Entity()
export class CompositeBook extends AbstractEntity<BookId, CompositeAuthor> {
  public readonly authorId: AuthorId;
  public readonly createdAt: DateTime;

  public constructor(
    id: BookId,
    public name: string,
  ) {
    super();
    this.id = id;
    return this.proxify();
  }
}

@AggregateRoot({ entityRootIdProperty: 'authorId' })
export class CompositeAuthor extends AbstractAggregateRoot<AuthorId> {
  @EntityCollection(CompositeBook)
  public declare readonly books: IEntityCollection<CompositeBook>;

  public constructor() {
    super();
    return this.proxify();
  }
}

export interface AuthorRepository extends IAggregateRootRepository<Author> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CompositeAuthorRepository extends IAggregateRootRepository<CompositeAuthor> {}
