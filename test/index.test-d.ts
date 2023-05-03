import * as _ from '../lib/index';
import { describe, test } from '@jest/globals';
import { expectAssignable, expectType } from 'tsd';

describe('SchemaType', () => {
    describe('types', () => {
        test('null', () => {
            type S = _.SchemaType<{ type: 'null' }, []>;
            expectType<S>(null);
        });
        test('string', () => {
            type S = _.SchemaType<{ type: 'string' }, []>;
            expectAssignable<S>('string');
        });
        test('number', () => {
            type S = _.SchemaType<{ type: 'number' }, []>;
            expectAssignable<S>(123);
        });
        test('boolean', () => {
            type S = _.SchemaType<{ type: 'boolean' }, []>;
            expectAssignable<S>(true);
        });
        test('null', () => {
            type S = _.SchemaType<{ type: 'null' }, []>;
            expectAssignable<S>(null);
        });
        test('array', () => {
            type S = _.SchemaType<{ type: 'array'; items: { type: 'string' } }, []>;
            expectAssignable<S>(['string']);
        });
        test('object', () => {
            type S = _.SchemaType<{ type: 'object'; properties: { foo: { type: 'string' } } }, []>;
            expectAssignable<S>({ foo: 'string' });
        });
    });
});
