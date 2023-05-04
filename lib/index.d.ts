import type { DeepReadonly } from 'ts-essentials';
import type { JSONSchema7Type, JSONSchema7TypeName, JSONSchema7 as OriginalSchema7 } from 'json-schema';

export type JSONSchema7 = OriginalSchema7 | DeepReadonly<OriginalSchema7>;

type Extract<T, U> = T extends U ? T : any;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
export type GetDefWithPrefix<Rs extends JSONSchema7[], p extends string, x extends GetPrefixKeys<Rs, p>, R extends Rs[number] = Rs[number]> =
	R extends any ?
	`${p}${x}` extends R['$id'] ?
		SchemaType<R, Rs> :
		`${p}${x}` extends `${R['$id']}#/$defs/${infer D}` ?
			D extends keyof R['$defs'] ? R['$defs'][D] extends JSONSchema7 ? SchemaType<R['$defs'][D], Rs>
			: never : never : never
	: never;
export type GetDef<Rs extends JSONSchema7[], x extends GetKeys<Rs>, R extends Rs[number] = Rs[number]> =
	R extends any ?
	x extends R['$id'] ?
		SchemaType<R, Rs> :
		x extends `${R['$id']}#/$defs/${infer D}` ?
			D extends keyof R['$defs'] ? R['$defs'][D] extends JSONSchema7 ? SchemaType<R['$defs'][D], Rs>
			: never : never : never
	: never;
export type GetReferences<Rs extends Record<string, JSONSchema7>> =
	UnionToArray<Rs[keyof Rs]>;

export type GetKeys<Rs extends JSONSchema7[], R extends Rs[number] = Rs[number]> =
	R extends any ? R['$id'] | (keyof R['$defs'] extends string ? `${R['$id']}#/$defs/${keyof R['$defs']}` : never) : never;
export type GetReferencesKeys<Rs extends Record<string, JSONSchema7>, R extends JSONSchema7 = Rs[keyof Rs]> =
	R extends any ? R['$id'] | (keyof R['$defs'] extends string ? `${R['$id']}#/$defs/${keyof R['$defs']}` : never) : never;

export type GetPrefixKeys<Rs extends JSONSchema7[], p extends string, R extends Rs[number] = Rs[number]> = 
	R extends any ? R['$id'] extends `${p}${infer x}` ? x | (keyof R['$defs'] extends string ? `${x}#/$defs/${keyof R['$defs']}` : never) : never : never;
export type GetReferencesKeysWithPrefix<Rs extends Record<string, JSONSchema7>, p extends string, R extends JSONSchema7 = Rs[keyof Rs]> =
	R extends any ? R['$id'] extends `${p}${infer x}` ? x | (keyof R['$defs'] extends string ? `${x}#/$defs/${keyof R['$defs']}` : never) : never : never;

export type Obj = Record<string, JSONSchema7>;

// Prohibit items with `$ref` to be required
type InfinitProhibitedDef<R extends JSONSchema7[], x extends R[number]['$id'], r extends JSONSchema7 = R[number]> =
	r extends any ? r['$id'] extends x ? r['type'] extends ('object' | 'array') ? true : false : false : false;
type PreventInfinitRoop<s extends Obj, K extends keyof s, R extends JSONSchema7[], T extends JSONSchema7 = s[K]> =
	T['$ref'] extends R[number]['$id'] ? InfinitProhibitedDef<R, T['$ref']> extends true ? never : K : K;
type AllowedKeys<s extends Obj, K extends keyof s, R extends JSONSchema7[], T extends JSONSchema7 = s[K]> =
	T['$ref'] extends R[number]['$id'] ? InfinitProhibitedDef<R, T['$ref']> extends true ? K : never : K;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RP extends ReadonlyArray<keyof s>, R extends JSONSchema7[]> =
	UnionToIntersection<
		{ -readonly [P in AllowedKeys<s, keyof s, R>]?: ChildSchemaType<s[P], R> } &
		{ -readonly [Q in PreventInfinitRoop<s, RP[number], R>]-?: ChildSchemaType<s[Q], R> }
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
	p['$ref'] extends GetKeys<R> ? GetDef<GenReferences<R, p>, p['$ref']> :
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
