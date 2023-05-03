import { describe, test } from '@jest/globals';
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import * as _ from '../lib/index';

describe('SchemaType', () => {
	describe('types', () => {
		test('string', () => {
			type S = _.SchemaType<{ type: 'string' }, []>;
			expectAssignable<S>('string');
			expectNotAssignable<S>(123);
		});
		test('number', () => {
			type S = _.SchemaType<{ type: 'number' }, []>;
			expectAssignable<S>(123);
			expectNotAssignable<S>('string');
		});
		test('boolean', () => {
			type S = _.SchemaType<{ type: 'boolean' }, []>;
			expectAssignable<S>(true);
			expectNotAssignable<S>('string');
		});
		test('null', () => {
			type S = _.SchemaType<{ type: 'null' }, []>;
			expectType<S>(null);
			expectAssignable<S>(null);
			expectNotAssignable<S>('string');
		});
		test('array', () => {
			type S = _.SchemaType<{ type: 'array'; items: { type: 'string' } }, []>;
			expectAssignable<S>(['string']);
			expectNotAssignable<S>('string');
		});
		test('object', () => {
			type S = _.SchemaType<{ type: 'object'; properties: { foo: { type: 'string' } } }, []>;
			expectAssignable<S>({ foo: 'string' });
			expectNotAssignable<S>('string');
		});
	});
});
