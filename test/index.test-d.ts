import { describe, test } from '@jest/globals';
import { expectAssignable, expectNotAssignable, expectNotType, expectType } from 'tsd';
import * as _ from '../lib/index';

describe('SchemaType', () => {
	describe('types', () => {
		test('string', () => {
			type S = _.SchemaType<{ type: 'string' }, []>;
			expectType<S>('string');
			expectNotAssignable<S>(123);
		});
		test('number', () => {
			type S = _.SchemaType<{ type: 'number' }, []>;
			expectType<S>(123);
			expectNotAssignable<S>('string');
		});
		test('boolean', () => {
			type S = _.SchemaType<{ type: 'boolean' }, []>;
			expectType<S>(true);
			expectNotType<S>('string');
		});
		test('null', () => {
			type S = _.SchemaType<{ type: 'null' }, []>;
			expectType<S>(null);
			expectAssignable<S>(null);
			expectNotAssignable<S>('string');
		});
		test('array type', () => {
			type S = _.SchemaType<{ type: ['string', 'number', 'null'] }, []>;
			expectType<S>(null);
			expectAssignable<S>(null);
			expectNotAssignable<S>('string');
		});
		test('array', () => {
			type S = _.SchemaType<{ type: 'array'; items: { type: 'string' } }, []>;
			expectType<S>(['string']);
			expectNotType<S>('string');
		});
		test('object', () => {
			const s = {
				type: 'object',
				properties: {
					foo: { type: 'string' },
				},
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string' });
			expectType<S>({});
		});
	});
	describe('enum', () => {
		test('string', () => {
			type S = _.SchemaType<{ enum: ['foo', 'bar'] }, []>;
			expectType<S>('foo');
			expectType<S>('bar');
			expectNotType<S>('baz');
		});
		test('number', () => {
			type S = _.SchemaType<{ enum: [1, 2] }, []>;
			expectType<S>(1);
			expectType<S>(2);
			expectNotType<S>(3);
		});
	});
	describe('required', () => {
		test('required', () => {
			const s = {
				type: 'object',
				properties: {
					foo: { type: 'string' },
				},
				required: ['foo'],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string' });
			expectNotType<S>({});
		});
	});
	describe('of', () => {
		test('oneOf whole', () => {
			const s = {
				oneOf: [
					{ type: 'string' },
					{ type: 'number' },
				],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>('string');
			expectType<S>(123);
			expectNotType<S>(true);
		});
		test('anyOf whole', () => {
			const s = {
				anyOf: [
					{ type: 'string' },
					{ type: 'number' },
				],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>('string');
			expectType<S>(123);
			expectNotType<S>(true);
		});
		test('anyOf object', () => {
			const s = {
				type: 'object',
				properties: {
					hoge: { type: 'string', minLength: 1 },
					fuga: { type: 'string', minLength: 1 },
				},
				anyOf: [
					{ required: ['hoge'] },
					{ required: ['fuga'] },
				],
				required: []
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ hoge: 'string' });
			expectType<S>({ fuga: 'string' });
			expectNotType<S>({});
		});
		test('allOf object', () => {
			const s = {
				type: 'object',
				allOf: [
					{
						type: 'object',
						properties: {
							hoge: { type: 'string', minLength: 1 },
						},
						required: ['hoge'],
					},
					{
						type: 'object',
						properties: {
							fuga: { type: 'string', minLength: 1 },
						},
					},
				],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ hoge: 'string', fuga: 'string' });
			expectNotType<S>({});
		});
	});
	describe('$defs', () => {
		test('string', () => {
			const s = {
				$defs: {
					bar: { type: 'string' },
				},
				type: 'object',
				properties: {
					foo: { $ref: '#/$defs/bar' },
				},
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string' });
			expectNotType<S>({});
		});
		test('string required', () => {
			const s = {
				$defs: {
					bar: { type: 'string' },
				},
				type: 'object',
				properties: {
					foo: { $ref: '#/$defs/bar' },
				},
				required: ['foo'],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string' });
			expectNotType<S>({});
		});
		test('array', () => {
			const s = {
				$defs: {
					foo: { type: 'string' },
				},
				type: 'array',
				items: { $ref: '#/$defs/foo' },
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(['string']);
			expectNotType<S>([]);
		});
		test('nested', () => {
			const s = {
				$defs: {
					foo: { type: 'string' },
				},
				type: 'object',
				properties: {
					foo: { $ref: '#/$defs/foo' },
					bar: {
						$defs: {
							bar: { type: 'string' },
						},
						type: 'object',
						properties: {
							bar: { $ref: '#/$defs/bar' },
						},
					},
				},
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string', bar: { bar: 'string' } });
			expectNotType<S>({});
		});
		test('recursive', () => {
			const s = {
				type: 'object',
				properties: {
					foo: { $ref: '#' },
				},
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: { foo: { foo: {} } } });
			expectNotType<S>({});
		});
		test('recursive required', () => {
			const s = {
				type: 'object',
				properties: {
					foo: { $ref: '#' },
				},
				//required: ['foo'],
			} as const;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: { foo: { foo: {} } } });
			expectNotType<S>({});
		});
	});
});
