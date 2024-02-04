import { DefineDomainErrors, standard_entity_errors } from "@hexancore/common";

export const TestDomainErrors = DefineDomainErrors(
  'Test',
  new (class {
    public entity_book: standard_entity_errors = 'not_found';
    public entity_author: standard_entity_errors | 'custom_1' = 'not_found';
    public entity_composite_author: standard_entity_errors | 'custom_1' = 'not_found';
    public identity_primary_key_author: standard_entity_errors | 'custom_1' = 'not_found';
    public other_error = '';
  })(),
);