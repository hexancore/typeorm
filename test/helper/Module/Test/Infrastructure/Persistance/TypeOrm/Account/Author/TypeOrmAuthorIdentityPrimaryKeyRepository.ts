import {
  AbstractTypeOrmAggregateRootRepository,
  StringValueColumn,
  TypeOrmAccountEntitySchema,
  TypeOrmAggregateRootRepository,
  UIntValueColumn
} from '@';
import { IdentityPrimaryKeyAuthor } from '@test/Module/Test/Domain/IdentityPrimaryKeyAuthor';
import { AuthorId } from '@test/Module/Test/Domain/test_entities';

export const AuthorIdentityPrimaryKeySchema = TypeOrmAccountEntitySchema(IdentityPrimaryKeyAuthor, {

  columns: {
    id: UIntValueColumn.asPrimaryKeyIdentity(AuthorId),
    name: StringValueColumn.asRaw({
      type: "varchar",
      length: 32
    })
  },
});

@TypeOrmAggregateRootRepository(AuthorIdentityPrimaryKeySchema)
export class TypeOrmAuthorIdentityPrimaryKeyRepository extends AbstractTypeOrmAggregateRootRepository<IdentityPrimaryKeyAuthor> { }
