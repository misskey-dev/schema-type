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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: 'string' });
			expectNotType<S>({});
		});
	});
	describe('is response', () => {
		test('is response', () => {
			const s = {
				type: 'object',
				properties: {
					foo: { type: 'string', default: 'foo' },
					bar: { type: 'string', default: 'bar' },
					hoge: { type: 'string' },
					fuga: { type: ['string', 'null'], default: null },
				},
				required: ['bar'],
			} as const satisfies _.JSONSchema7;

			type SReq = _.SchemaType<typeof s, [], false>;
			expectType<SReq>({ bar: 'string' });

			type SRes = _.SchemaType<typeof s, [], true>;
			expectNotType<SRes>({ foo: 'string' });
		});
	});
	describe('of', () => {
		test('oneOf whole', () => {
			const s = {
				oneOf: [
					{ type: 'string' },
					{ type: 'number' },
				],
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ hoge: 'string', fuga: 'string' });
			expectNotType<S>({});
		});
		test('allOf array', () => {
			const s = {
				type: 'array',
				items: {
					allOf: [
						{ type: 'string' },
						{ type: 'string' },
					]
				},
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(['string', 'string']);
			expectNotType<S>([]);
		});
		test('oneOf array', () => {
			const s = {
				type: 'array',
				items: {
					oneOf: [
						{ type: 'string' },
						{ type: 'null' },
					]
				},
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(['string', 'string']);
			expectNotType<S>([]);
		});
		test('anyOf array', () => {
			const s = {
				type: 'array',
				items: {
					anyOf: [
						{ type: 'string' },
						{ type: 'null' },
					]
				},
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(['string', 'string']);
			expectNotType<S>([]);
		});
		test('anyOf object array', () => {
			const s = {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						hoge: { type: 'string', minLength: 1 },
						fuga: { type: 'string', minLength: 1 },
					},
					anyOf: [
						{ required: ['hoge'] },
						{ required: ['fuga'] },
					],
				},
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>([{ hoge: 'string' }]);
			expectNotType<S>([{}]);
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
			} as const satisfies _.JSONSchema7;
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
				required: ['foo'],
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: { foo: { foo: {} } } });
			expectNotType<S>({});
		});
		test('recursive required', () => {
			const s = {
				$defs: {
					bar: {
						type: 'object',
						properties: {
							bar: {
								$ref: '#/$defs/bar'
							},
						},
					}
				},
				type: 'object',
				properties: {
					foo: { $ref: '#/$defs/bar' },
				},
				required: ['foo'],
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: { bar: { bar: {} } } });
			expectNotType<S>({});
		});
	});
	describe('def', () => {
		test('def', () => {
			const refs = {
				Id: {
					$id: 'https://example.com/schemas/Id',
					type: 'string',
				},
				Note: {
					$defs: {
						poll: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									text: { type: 'string' },
									count: { type: 'number' },
								},
							},
							required: ['text', 'count'],
						}
					},
					$id: 'https://example.com/schemas/Note',
					type: 'object',
					properties: {
						text: { type: 'string' },
						poll: { $ref: '#/$defs/poll' },
						fileIds: {
							type: 'array',
							items: { $ref: 'https://example.com/schemas/Id' },
						},
						replies: {
							type: 'array',
							items: { $ref: 'https://example.com/schemas/Note' },
						},
						umm: { $ref: 'https://example.com/schemas/Umm' }
					},
					required: ['text', 'replies'],
				},
			} as const satisfies Record<string, _.JSONSchema7Definition>;
			type Refs = typeof refs;

			type Def<x extends _.GetRefsKeys<Refs>> = _.GetDef<_.GetRefs<Refs>, x>;
			type Packed<x extends _.GetRefsKeys<Refs, 'https://example.com/schemas/'>> = _.GetDef<_.GetRefs<Refs>, x, false, 'https://example.com/schemas/'>;

			expectType<Def<'https://example.com/schemas/Id'>>('string');
			expectNotAssignable<Packed<'Note'>>('aaa');
			expectNotAssignable<Packed<'Note#/$defs/poll'>>('aaa');
			expectAssignable<Def<'https://example.com/schemas/Note#/$defs/poll'>>([{ text: 'string', count: 1 }]);

			const schema = {
				type: 'object',
				properties: {
					id: { $ref: 'https://example.com/schemas/Id' },
					notes: {
						type: 'array',
						items: { $ref: 'https://example.com/schemas/Note' },
					},
				},
				required: ['id', 'notes'],
			} as const satisfies _.JSONSchema7;

			type SchemaType<S extends _.JSONSchema7> = _.SchemaType<S, _.GetRefs<Refs>>;
			type User = SchemaType<typeof schema>;

			expectType<User>({ id: 'string', notes: [] });
			expectType<User>({ id: 'string', notes: [{ text: 'string', poll: [{ text: 'string', count: 1 }], fileIds: ['string'], replies: [] }] });
		});
	});
	describe('serialization', () => {
		test('date', () => {
			const s = {
				type: 'string',
				format: 'date',
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(new Date());
			expectNotType<S>('string');

			type SS = _.Serialized<S>;
			expectType<SS>('string');
			expectNotType<SS>(new Date());

			type SSW = _.WeakSerialized<S>;
			expectType<SSW>('string');
			expectType<SSW>(new Date());
		});
		test('binary', () => {
			const s = {
				type: 'string',
				format: 'binary',
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>(new Uint8Array());
			expectNotType<S>('string');

			type SS = _.Serialized<S>;
			expectType<SS>('string');
			expectNotType<SS>(new Uint8Array());

			type SSW = _.WeakSerialized<S>;
			expectType<SSW>('string');
			expectType<SSW>(new Uint8Array());
		});
		test('array', () => {
			const s = {
				type: 'array',
				items: {
					type: 'string',
					format: 'date',
				},
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>([new Date()]);
			expectNotType<S>(['string', 1]);

			type SS = _.Serialized<S>;
			expectType<SS>(['string']);
			expectNotType<SS>([new Date()]);

			type SSW = _.WeakSerialized<S>;
			expectType<SSW>(['string']);
			expectType<SSW>([new Date()]);
		});
		test('record', () => {
			const s = {
				type: 'object',
				properties: {
					foo: {
						type: 'string',
						format: 'date-time',
					},
					bar: {
						type: 'string',
						format: 'binary'
					}
				},
				required: ['foo'],
			} as const satisfies _.JSONSchema7;
			type S = _.SchemaType<typeof s, []>;
			expectType<S>({ foo: new Date() });
			expectNotType<S>({ foo: 'string' });

			type SS = _.Serialized<S>;
			expectType<SS>({ foo: 'string' });
			expectNotType<SS>({ foo: new Date() });

			type SSW = _.WeakSerialized<S>;
			expectType<SSW>({ foo: 'string' });
			expectType<SSW>({ foo: new Date() });
		});
	});
});
