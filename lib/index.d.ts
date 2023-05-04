import type { DeepReadonly } from 'ts-essentials';
import type { JSONSchema7Type, JSONSchema7TypeName, JSONSchema7 as OriginalSchema7 } from 'json-schema';

export type JSONSchema7 = OriginalSchema7 | DeepReadonly<OriginalSchema7>;

type Extract<T, U> = T extends U ? T : any;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
export type GetPrefixKeys<R extends JSONSchema7[], p extends string> = R[number]['$id'] extends `${p}${infer x}` ? x : never;
export type GetDefWithPrefix<R extends JSONSchema7[], p extends string, x extends GetPrefixKeys<R, p>, r extends JSONSchema7 = R[number]> = r extends any ? r['$id'] extends `${p}${x}` ? SchemaType<r, R> : never : never;
export type GetDef<R extends JSONSchema7[], x extends R[number]['$id'], r extends JSONSchema7 = R[number]> = r extends any ? r['$id'] extends x ? SchemaType<r, R> : never : never;
export type GetReferences<Rs extends Record<string, JSONSchema7>> = UnionToArray<Rs[keyof Rs]>;
export type GetReferencesKeys<Rs extends Record<string, JSONSchema7>> = Rs[keyof Rs]['$id'];
export type GetReferencesKeysWithPrefix<Rs extends Record<string, JSONSchema7>, p extends string> = Rs[keyof Rs]['$id'] extends `${p}${infer x}` ? x : never;

export type Obj = Record<string, JSONSchema7>;

// Prohibit items with `$ref` to be required
type InfinitProhibitedDef<R extends JSONSchema7[], x extends R[number]['$id'], r extends JSONSchema7 = R[number]> =
	r extends any ? r['$id'] extends x ? r['type'] extends ('object' | 'array') ? true : false : false : false;
type PreventInfinitRoop<s extends Obj, K extends keyof s, R extends JSONSchema7[], T extends JSONSchema7 = s[K]> =
	T['$ref'] extends R[number]['$id'] ? InfinitProhibitedDef<R, T['$ref']> extends true ? never : K : K;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RequiredProps extends ReadonlyArray<keyof s>, R extends JSONSchema7[]> =
	UnionToIntersection<
		{ -readonly [P in keyof s]?: ChildSchemaType<s[P], R> } &
		{ -readonly [Q in PreventInfinitRoop<s, RequiredProps[number], R>]-?: ChildSchemaType<s[Q], R> }
	>;

// https://qiita.com/ssssota/items/7e05f05b57e71dfe1cf9
type AnyOfSchema<T extends ReadonlyArray<JSONSchema7>, R extends JSONSchema7[]> =
	T extends readonly [infer A, ...infer B] ? A extends JSONSchema7 ?
		B extends ReadonlyArray<JSONSchema7>
			? ChildSchemaType<A, R> | AnyOfSchema<B, R> | (ChildSchemaType<A, R> & AnyOfSchema<B, R>)
			: ChildSchemaType<A, R>
		: never : never;
type AllOfSchema<T extends ReadonlyArray<JSONSchema7>, R extends JSONSchema7[]> =
	T extends readonly [infer A, ...infer B] ? A extends JSONSchema7 ?
		B extends ReadonlyArray<JSONSchema7>
			? ChildSchemaType<A, R> & AllOfSchema<B, R>
			: ChildSchemaType<A, R>
		: never : unknown;

// https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
// Get intersection from union 
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
type UnionSchemaType<a extends readonly any[], R extends JSONSchema7[], X extends JSONSchema7 = a[number]> = X extends any ? ChildSchemaType<X, R> : never;
type UnionObjType<s extends Obj, a extends readonly (keyof s)[], R extends JSONSchema7[]> = a extends any ? ObjType<s, a, R> : never;
type UnionType<Ts extends ReadonlyArray<JSONSchema7TypeName>, T extends JSONSchema7TypeName = Ts[number]> = Ts extends any ? TypeNameToType<T> : never;

export type RecordToUnion<T extends Record<string, any>> = T[keyof T];
export type UnionToArray<T, A extends unknown[] = []> = T extends any ? [T, ...A] : never;
export type RecordToArray<T extends Record<string, any>> = UnionToArray<RecordToUnion<T>>;

type DefsToDefUnion<T extends Obj, K extends keyof T = keyof T> = T[K] extends JSONSchema7 ? K extends string ? ({ $id: `#/$defs/${K}` } & T[K]) : never : never;

type GenReferences<R extends JSONSchema7[], p extends JSONSchema7> =
	p['$defs'] extends Obj ? [...R, ...UnionToArray<DefsToDefUnion<p['$defs']>>] :
	R;

type ObjectSchemaTypeDef<p extends JSONSchema7, R extends JSONSchema7[]> =
	p['properties'] extends NonNullable<Obj> ?
		p['anyOf'] extends ReadonlyArray<JSONSchema7> ?
			p['anyOf'][number]['required'] extends ReadonlyArray<keyof p['properties']> ?
				UnionObjType<p['properties'], NonNullable<p['anyOf'][number]['required']>, GenReferences<R, p>> & ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>>
				: never
			: ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>>
	:
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? never : // see README.md
	p['allOf'] extends ReadonlyArray<JSONSchema7> ? AllOfSchema<p['allOf'], GenReferences<R, p>> :
	any

type TypeNameToType<T extends JSONSchema7TypeName> =
	T extends 'null' ? null :
	T extends 'integer' ? number :
	T extends 'number' ? number :
	T extends 'string' ? string :
	T extends 'boolean' ? boolean :
	T extends 'array' ? any[] :
	T extends 'object' ? Record<any, any> :
	any;

export type ChildSchemaType<p extends JSONSchema7, R extends JSONSchema7[]> =
	p['$ref'] extends R[number]['$id'] ? GetDef<GenReferences<R, p>, p['$ref']> :
	p['const'] extends JSONSchema7Type ? p['const'] :
	p['enum'] extends ReadonlyArray<JSONSchema7Type> ? p['enum'][number] :
	p['type'] extends 'string' ? (
		p['format'] extends 'date-time' ? string : // Dateにする？？
		string
	) :
	p['type'] extends ('null' | 'integer' | 'number' | 'boolean') ? TypeNameToType<p['type']> :
	p['type'] extends 'object' ? ObjectSchemaTypeDef<p, GenReferences<R, p>> :
	p['type'] extends 'array' ? (
		p['items'] extends NonNullable<JSONSchema7> ? ChildSchemaType<p['items'], GenReferences<R, p>>[] :
		any[]
	) :
	p['type'] extends ReadonlyArray<JSONSchema7TypeName> ? UnionType<p['type']> :
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? AnyOfSchema<p['anyOf'], GenReferences<R, p>> :
	p['allOf'] extends ReadonlyArray<JSONSchema7> ? AllOfSchema<p['allOf'], GenReferences<R, p>> :
	p['oneOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<p['oneOf'], GenReferences<R, p>> :
	any;

export type SchemaType<p extends JSONSchema7, R extends JSONSchema7[]> =
	ChildSchemaType<p, [...R, p & { $id: '#' }]>;
