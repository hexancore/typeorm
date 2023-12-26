/**
 * @group integration
 */

import { HcTypeOrmModule } from '@';
import { AggregateRootRepositoryManager, HcModule } from '@hexancore/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorId, BookId, CompositeAuthor, CompositeBook } from '@test/Module/Test/Domain/test_entities';
import { CompositeAuthorRepository, TestDataSourceContextIdProvider } from '@test/Module/Test/Domain/test_repositories';
import { PrivateTestInfraModule } from '@test/Module/Test/Infrastructure/PrivateTestInfraModule';

describe('CompositePrimaryKey', () => {
  let module: TestingModule;
  let authorRepository: CompositeAuthorRepository;

  describe.each([{ driver: 'mysql' }, { driver: 'postgres' }])('$driver', ({ driver }) => {
    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          HcModule,
          HcTypeOrmModule.forRoot({ dataSourceContextIdProvider: new TestDataSourceContextIdProvider(), configPath: 'core.typeorm-'+driver }),
          PrivateTestInfraModule,
        ],
      }).compile();

      authorRepository = await module.get(AggregateRootRepositoryManager).get<CompositeAuthorRepository>(CompositeAuthor);
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    test('persist()', async () => {
      const author = new CompositeAuthor();
      const book1 = new CompositeBook(BookId.cs(1), 'test_1ęął');
      author.books.add(book1);
      const book2 = new CompositeBook(BookId.cs(2), 'test_2');
      author.books.add(book2);

      const rp = await authorRepository.persist(author);
      expect(rp).toMatchSuccessResult(true);

      const r = await authorRepository.getAllAsArray();
      expect(r.v[0].id).toEqual(author.id);

      const abr = await r.v[0].books.getAllAsArray();
      const ab = abr.v;
      expect(ab.length).toBe(2);
      expect(ab).toEqual([book1, book2]);

      const currentBookById = await r.v[0].books.getById(ab[0].id);
      expect(currentBookById).toMatchSuccessResult(book1);
    });

    test('getById() when not exists', async () => {
      const id = AuthorId.cs(1);
      const r = await authorRepository.getById(id);

      const expectedError = {
        type: 'test.domain.entity.composite_author.not_found',
        code: 404,
        data: {
          searchCriteria: {
            id,
          },
        },
      };
      expect(r).toMatchAppError(expectedError);
    });
  });
});
