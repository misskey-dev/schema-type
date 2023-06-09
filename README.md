# schema-type
Get TypeScript Type from JSON Schema

## Outline
**Simply** generate TypeScript types from JSON Schema.  
It has less functionality than `json-schema-to-ts`, but supports circular references of `$ref`.

## Install

```bash
npm install -D git+https://github.com/misskey-dev/schema-type
# or
yarn add -D git+https://github.com/misskey-dev/schema-type
# or
pnpm add -D git+https://github.com/misskey-dev/schema-type
```

## Usage

### Just Convert
```typescript
import type { SchemaType, JSONSchema7 } from 'schema-type';

const schema = {
	type: 'string',
} as const satisfies JSONSchema7;

type MyString = SchemaType<typeof schema>; // will `string`
```

### Storing and calling global references
```typescript
import type { JSONSchema7, JSONSchema7Definition, GetDef, GetRefs, GetRefsKeys } from 'schema-type';

// Define as Record but key is ignored (you must specify key by `$id`).
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
			}
		},
		required: ['text', 'replies'],
	},
} as const satisfies Record<string, JSONSchema7Definition>;
type Refs = typeof refs;

// GetDef<References (global references) extends JSONSchema7Definition[], Key[, IsResponse, Prefix]>
export type Def<x extends GetRefsKeys<Refs>> = GetDef<GetRefs<Refs>, x>;

// With prefix
export type Packed<x extends GetRefsKeys<Refs, 'https://example.com/schemas/'>> = GetDef<GetRefs<Refs>, x, false, 'https://example.com/schemas/'>;

type Id = Def<'https://example.com/schemas/Id'> | Packed<'Id'>;
type Poll = Def<'https://example.com/schemas/Note#/$defs/poll'> | Packed<'Note#/$defs/poll'>;
```

### Create a type with global references
```typescript
import type { ..., SchemaType } from 'schema-type';

const refs = {
	// ...
} as const satisfies Record<string, JSONSchema7Definition>;
type Refs = typeof refs;

const userSchema = {
	type: 'object',
	properties: {
		id: { $ref: 'https://example.com/schemas/Id' },
		notes: {
			type: 'array',
			items: { $ref: 'https://example.com/schemas/Note' },
		},
	},
	required: ['id', 'notes'],
} as const satisfies JSONSchema7;

// Create a type with preset References
export type MySchemaType<S extends JSONSchema7> = SchemaType<S, GetRefs<Refs>>;

type User = MySchemaType<typeof userSchema>;
```

### Default handling

IsResponseをtrueにすると、defaultを持つプロパティがrequired扱いになります。  
検証・成形後の値を表すときに使えます。

If IsResponse is set to true, properties with default are treated as required.  
It can be used to represent a value after verification and molding.

```typescript
const s = {
	type: 'object',
	properties: {
		foo: { type: 'string', default: 'foo' },
		hoge: { type: 'string' }
	},
	required: [],
} as const satisfies JSONSchema7;

type Req = SchemaType<typeof s, [], false>;
/**
 * type Req = {
 *    foo?: string | undefined;
 *    hoge?: string | undefined;
 * }
 */

type Res = SchemaType<typeof s, [], true>;
/**
 * type Res = {
 *    foo: string;
 *    hoge?: string | undefined;
 * }
 */
```

### Property Type Assertion
objectのpropertiesで、プロパティを`as unknown as X`と書いて型`X`で上書きすると、`SchemaType`はその上書きされた型を返します。  
ただし、`X`が`extends NonNullable<JSONSchema7>`でJSONSchema7として認識されてしまう場合はうまく動きません。

If you overwrite a property with type `X` in the properties of an object by writing `as unknown as X`, `SchemaType` will return the overwritten type.  
However, if `X` is recognized as JSONSchema7 with `extends NonNullable<JSONSchema7>`, it will not work.

```typescript
type X = {
	values: X[];
};

const s = {
	type: 'object',
	properties: {
		foo: { type: 'string' },
		bar: {
			type: 'object',
		} as unknown as X,
	},
	required: ['foo', 'bar'],
} as const satisfies JSONSchema7;

type S = SchemaType<typeof s, []>;
/**
 * type S = {
 *     foo: string;
 *     bar: X;
 * }
 */
```

## Features

### Basic

- [x] `type: 'null'`
- [x] `type: 'string'`
- [x] `type: 'number'`, `type: 'integer'`
- [x] `type: 'enum'`
- [x] `type: 'null'`
- [x] `type: Array<JSONSchema7TypeName>`
- [x] `additionalProperties`
- [ ] `not`
- [ ] `if`, `then`, `else`
- [ ] `dependentRequired`, `dependentSchemas`

### Ref, Def

- [x] Reading an array of global references
- [x] `$defs` ($defs in nested places will be ignored.)
- [x] `$ref` to $def and global references
- [x] Circular reference `$ref` (If the $ref target is an object or an array, the item will be no longer `required`.)
- [ ] `$dynamicRef`
- [ ] `$anchor`, `$dynamicAnchor`

It is not possible to reference `$defs` from parent to child or schema to schema.

### *of
- [x] `allOf`
- [x] `oneOf`
- [x] `anyOf`
  * anyOf of object corresponds only to the anyOf branch of required.

## Notes
### 型について
[`@types/json-schema`ライブラリ](https://www.npmjs.com/package/@types/json-schema)の型に準拠しています。

### objectの型エラーが出ない場合がある
requiredが一つもないと型エラーが起きません。

### JSON SchemaのobjectでanyOfを使うとき
objectに対してanyOfを使う場合、anyOfの中でpropertiesを定義しないこと。  
ajvのバリデーションが効かないため。（SchemaTypeもそのように作られており、objectのanyOf内のpropertiesは捨てられます）  
https://github.com/misskey-dev/misskey/pull/10082

テキストhogeおよびfugaについて、片方を必須としつつ両方の指定もありうる場合:

```
export const schema = {
	type: 'object',
	properties: {
		hoge: { type: 'string', minLength: 1 },
		fuga: { type: 'string', minLength: 1 },
	},
	anyOf: [
		{ required: ['hoge'] },
		{ required: ['fuga'] },
	],
} as const;
```

### stringのformatと`Serialized<T>`, `WeakSerialized<T>`
`type: string`のとき、formatに`date`,`date-time`が指定されていた場合は`Date`、`binary`の場合は`RelativeIndexable<number>`となります。

`string`に変換したい場合は`Serialized<T>`、`string | Date`のように両方を許容・推測したい場合は`WeakSerialized<T>`でラップします。

```typescript
import type { SchemaType, JSONSchema7, Serialized, WeakSerialized } from 'schema-type';

const schema = {
	type: 'string',
	format: 'date-time',
} as const satisfies JSONSchema7;

type D = SchemaType<typeof schema>; // Date
type SD = Serialized<D>;            // string
type WSD = WeakSerialized<D>        // string | Date
```
