import {
  AbstractAggregateRoot,
  AggregateRoot
} from '@hexancore/core';
import type { AuthorId } from './test_entities';

@AggregateRoot()
export class IdentityPrimaryKeyAuthor extends AbstractAggregateRoot<AuthorId> {

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}