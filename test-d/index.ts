import * as _ from '../lib/index';
import { describe } from '@jest/globals';
import { expectAssignable, expectType } from 'tsd';

describe('SchemaType', () => {
    describe('types', () => {
        test('null', () => {
            type S = _.ChildSchemaType<{ type: 'null' }, []>;
            expectType<S>(null);
        });
        test('string', () => {
            type S = _.ChildSchemaType<{ type: 'string' }, []>;
            expectAssignable<S>('string');
        });
        test('number', () => {
            type S = _.ChildSchemaType<{ type: 'number' }, []>;
            expectAssignable<S>(123);
        });
        test('boolean', () => {
            type S = _.ChildSchemaType<{ type: 'boolean' }, []>;
            expectAssignable<S>(true);
        });
        test('null', () => {
            type S = _.ChildSchemaType<{ type: 'null' }, []>;
            expectAssignable<S>(null);
        });
        test('array', () => {
            type S = _.ChildSchemaType<{ type: 'array'; items: { type: 'string' } }, []>;
            expectAssignable<S>(['string']);
        });
        test('object', () => {
            type S = _.ChildSchemaType<{ type: 'object'; properties: { foo: { type: 'string' } } }, []>;
            expectAssignable<S>({ foo: 'string' });
        });
    });
});