import type { DeepReadonly } from 'ts-essentials';
import type { JSONSchema7Type, JSONSchema7TypeName, JSONSchema7 as OriginalSchema7 } from 'json-schema';

// DeepReadonlyでarrayをreadonlyにする
export type JSONSchema7 = OriginalSchema7 | DeepReadonly<OriginalSchema7>;
export type JSONSchema7Definition = (OriginalSchema7 & { $id: string }) | DeepReadonly<OriginalSchema7 & { $id: string }>;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
export type GetDef<References extends JSONSchema7Definition[], Key extends GetKeys<References, Prefix>, IsResponse extends boolean = false, Prefix extends string = '', R extends References[number] = References[number]> =
	R extends any ?
	`${Prefix}${Key}` extends R['$id'] ?
		SchemaType<R, References, IsResponse> :
		`${Prefix}${Key}` extends `${R['$id']}#/$defs/${infer D}` ?
			D extends keyof R['$defs'] ? R['$defs'][D] extends JSONSchema7 ? SchemaType<R['$defs'][D], References, IsResponse>
			: never : never : never
	: never;
export type GetRefs<ReferencesRecord extends Record<string, JSONSchema7Definition>> =
	UnionToArray<ReferencesRecord[keyof ReferencesRecord]>;

export type GetKeys<References extends JSONSchema7Definition[], p extends string = '', R extends References[number] = References[number]> = 
	R extends any ? R['$id'] extends `${p}${infer x}` ? x | (keyof R['$defs'] extends string ? `${x}#/$defs/${keyof R['$defs']}` : never) : never : never;
export type GetRefsKeys<ReferencesRecord extends Record<string, JSONSchema7Definition>, p extends string = '', R extends JSONSchema7 = ReferencesRecord[keyof ReferencesRecord]> =
	R extends any ? R['$id'] extends `${p}${infer x}` ? x | (keyof R['$defs'] extends string ? `${x}#/$defs/${keyof R['$defs']}` : never) : never : never;

export type Obj = Record<string, JSONSchema7>;

export type Serialized<T> = 
	T extends Date
		? string
		: T extends (Date | null)
			? (string | null)
	: T extends RelativeIndexable<number>
		? string
		: T extends (RelativeIndexable<number> | null)
			? (string | null)
	: T extends Record<string, any>
		? { [K in keyof T]: Serialized<T[K]> }
		: T extends (Record<string, any> | null)
			? ({ [K in keyof T]: Serialized<T[K]> } | null)
			: T extends (Array<infer U> | ReadonlyArray<infer U>)
				? Array<Serialized<U>>
				: T extends ((Array<infer U> | null) | (ReadonlyArray<infer U> | null))
					? (Array<Serialized<U>> | null)
	: T;

export type WeakSerialized<T> = 
	T extends Date
		? T | string
		: T extends (Date | null)
			? (T | string | null)
	: T extends RelativeIndexable<number>
		? T | string
		: T extends (RelativeIndexable<number> | null)
			? (T | string | null)
	: T extends Record<string, any>
		? { [K in keyof T]: T[K] | Serialized<T[K]> }
		: T extends (Record<string, any> | null)
			? ({ [K in keyof T]: T[K] | Serialized<T[K]> } | null)
			: T extends (Array<infer U> | ReadonlyArray<infer U>)
				? Array<U | Serialized<U>>
				: T extends ((Array<infer U> | null) | (ReadonlyArray<infer U> | null))
					? (Array<U | Serialized<U>> | null)
	: T;

// Items with `$ref` to prohibit to be required
type InfinitProhibitedDef<R extends JSONSchema7Definition[], x extends R[number]['$id'], r extends JSONSchema7 = R[number]> =
	r extends any ? r['$id'] extends x ? r['type'] extends ('object' | 'array') ? true : false : false : false;
type RequiredKey<s extends Obj, K extends keyof s, R extends JSONSchema7Definition[], T extends JSONSchema7 = s[K]> =
	T['$ref'] extends R[number]['$id'] ? InfinitProhibitedDef<R, T['$ref']> extends true ? never : K : K;
//type OptionalKey<s extends Obj, RP extends ReadonlyArray<keyof s>, R extends JSONSchema7Definition[], P extends keyof s = keyof s, T extends JSONSchema7 = s[P]> =
//	P extends RP[number] ?
		// Pick properties prohibited with `$ref`
//		T['$ref'] extends R[number]['$id'] ? InfinitProhibitedDef<R, T['$ref']> extends true ? P : never : never
//	: P;
type HasDefault<s extends Obj, K extends keyof s, T extends JSONSchema7 = s[K]> =
	T['default'] extends NonNullable<unknown> ? K : never;

type Projected<T> = T extends Record<string, any> ? { [K in keyof T]: T[K] } : T;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RP extends ReadonlyArray<keyof s>, R extends JSONSchema7Definition[], IsResponse extends boolean> =
	Projected<
		(RP extends NonNullable<ReadonlyArray<keyof s>> ? 
			{ -readonly [P in keyof s]?: ChildSchemaType<s[P], R, IsResponse> } &
			{ -readonly [Q in RP[number] as RequiredKey<s, Q, R>]-?: ChildSchemaType<s[Q], R, IsResponse> }
		:
			{ -readonly [P in keyof s]?: ChildSchemaType<s[P], R, IsResponse> }
		) & (IsResponse extends true ?
			{ -readonly [Q in keyof s as HasDefault<s, Q> ]-?: ChildSchemaType<s[Q], R, IsResponse> }
			: NonNullable<unknown>
		)
	>;

// https://qiita.com/ssssota/items/7e05f05b57e71dfe1cf9
type AnyOfSchema<T extends ReadonlyArray<JSONSchema7>, R extends JSONSchema7Definition[], IsResponse extends boolean> =
	T extends readonly [infer A, ...infer B] ? A extends JSONSchema7 ?
		B extends ReadonlyArray<JSONSchema7>
			? ChildSchemaType<A, R, IsResponse> | AnyOfSchema<B, R, IsResponse> | (ChildSchemaType<A, R, IsResponse> & AnyOfSchema<B, R, IsResponse>)
			: ChildSchemaType<A, R, IsResponse>
		: never : never;
type AllOfSchema<T extends ReadonlyArray<JSONSchema7>, R extends JSONSchema7Definition[], IsResponse extends boolean> =
	T extends readonly [infer A, ...infer B] ? A extends JSONSchema7 ?
		B extends ReadonlyArray<JSONSchema7>
			? ChildSchemaType<A, R, IsResponse> & AllOfSchema<B, R, IsResponse>
			: ChildSchemaType<A, R, IsResponse>
		: never : unknown;

// https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
// Get intersection from union 
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
type UnionSchemaType<a extends ReadonlyArray<JSONSchema7>, R extends JSONSchema7Definition[], IsResponse extends boolean, X extends JSONSchema7 = a[number]> = X extends any ? ChildSchemaType<X, R, IsResponse> : never;
type UnionObjType<s extends Obj, a extends readonly (keyof s)[], R extends JSONSchema7Definition[], IsResponse extends boolean> = a extends any ? ObjType<s, a, R, IsResponse> : never;
type UnionType<Ts extends ReadonlyArray<JSONSchema7TypeName>, T extends JSONSchema7TypeName = Ts[number]> = Ts extends any ? TypeNameToType<T> : never;

export type RecordToUnion<T extends Record<string, any>> = T[keyof T];
export type UnionToArray<T, A extends unknown[] = []> = T extends any ? [T, ...A] : never;
export type RecordToArray<T extends Record<string, any>> = UnionToArray<RecordToUnion<T>>;

type DefsToDefUnion<T extends Obj, K extends keyof T = keyof T> = T[K] extends JSONSchema7 ? K extends string ? ({ $id: `#/$defs/${K}` } & T[K]) : never : never;
type GenReferences<R extends JSONSchema7Definition[], p extends JSONSchema7> =
	p['$defs'] extends Obj ? [...R, ...UnionToArray<DefsToDefUnion<p['$defs']>>] :
	R;

type ObjectSchemaTypeDef<p extends JSONSchema7, R extends JSONSchema7Definition[], IsResponse extends boolean> =
	p['properties'] extends NonNullable<Obj> ?
		p['anyOf'] extends ReadonlyArray<JSONSchema7> ?
			p['anyOf'][number]['required'] extends ReadonlyArray<keyof p['properties']> ?
				UnionObjType<p['properties'], NonNullable<p['anyOf'][number]['required']>, GenReferences<R, p>, IsResponse> & ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>, IsResponse>
				: never
			: ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>, IsResponse>
	:
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? never : // see README.md
	p['allOf'] extends ReadonlyArray<JSONSchema7> ? AllOfSchema<p['allOf'], GenReferences<R, p>, IsResponse> :
	p['oneOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<p['oneOf'], GenReferences<R, p>, IsResponse> : // But `oneOf` in object is not recommended
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

export type ChildSchemaType<p extends JSONSchema7, R extends JSONSchema7Definition[], IsResponse extends boolean> =
	p['$ref'] extends GetKeys<GenReferences<R, p>, ''> ? GetDef<GenReferences<R, p>, p['$ref']> :
	p['const'] extends JSONSchema7Type ? p['const'] :
	p['enum'] extends ReadonlyArray<JSONSchema7Type> ? p['enum'][number] :
	p['type'] extends 'string' ? (
		p['format'] extends 'date' ? Date :
		p['format'] extends 'date-time' ? Date :
		p['format'] extends 'binary' ? RelativeIndexable<number> :
		string
	) :
	p['type'] extends ('null' | 'integer' | 'number' | 'boolean') ? TypeNameToType<p['type']> :
	p['type'] extends 'object' ? ObjectSchemaTypeDef<p, GenReferences<R, p>, IsResponse> :
	p['type'] extends 'array' ? (
		p['items'] extends NonNullable<JSONSchema7> ? ChildSchemaType<p['items'], GenReferences<R, p>, IsResponse>[] :
		any[]
	) :
	p['type'] extends ReadonlyArray<JSONSchema7TypeName> ? UnionType<p['type']> :
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? AnyOfSchema<p['anyOf'], GenReferences<R, p>, IsResponse> :
	p['allOf'] extends ReadonlyArray<JSONSchema7> ? AllOfSchema<p['allOf'], GenReferences<R, p>, IsResponse> :
	p['oneOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<p['oneOf'], GenReferences<R, p>, IsResponse> :
	any;

export type SchemaType<p extends JSONSchema7, R extends JSONSchema7Definition[], IsResponse extends boolean = false> =
	ChildSchemaType<p, [...R, p & { $id: '#' }], IsResponse>;
