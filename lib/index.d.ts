import type { DeepReadonly } from 'ts-essentials';
import type { JSONSchema7 as OriginalSchema7 } from 'json-schema';

export type JSONSchema7 = OriginalSchema7 | DeepReadonly<OriginalSchema7>;

export type GenPacked<R extends JSONSchema7[], p extends string, x extends string> = `${p}${x}` extends R[number]['$id'] ? SchemaType<Extract<R[number], { $id: `${p}${x}` }>, R> : never;
export type GenDef<R extends JSONSchema7[], x extends R[number]['$id']> = SchemaType<Extract<R[number], { $id: x }>, R>;

// https://swagger.io/specification/?sbsearch=optional#schema-object
type OfSchema = {
	readonly anyOf?: ReadonlyArray<JSONSchema7>;
	readonly oneOf?: ReadonlyArray<JSONSchema7>;
	readonly allOf?: ReadonlyArray<JSONSchema7>;
}

/*
type TypeStringef = 'null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object' | 'any';

type StringDefToType<T extends TypeStringef> =
	T extends 'null' ? null :
	T extends 'boolean' ? boolean :
	T extends 'integer' ? number :
	T extends 'number' ? number :
	T extends 'string' ? string | Date :
	T extends 'array' ? ReadonlyArray<any> :
	T extends 'object' ? Record<string, any> :
	any;

export interface JSONSchema7 extends OfSchema {
	readonly type?: TypeStringef;
	readonly nullable?: boolean;
	readonly optional?: boolean;
	readonly items?: JSONSchema7;
	readonly properties?: Obj;
	readonly required?: ReadonlyArray<Extract<keyof NonNullable<this['properties']>, string>>;
	readonly description?: string;
	readonly example?: any;
	readonly format?: string;
	readonly ref?: keyof typeof refs;
	readonly enum?: ReadonlyArray<string | null>;
	readonly default?: (this['type'] extends TypeStringef ? StringDefToType<this['type']> : any) | null;
	readonly maxLength?: number;
	readonly minLength?: number;
	readonly maximum?: number;
	readonly minimum?: number;
	readonly pattern?: string;
}
*/

export type Obj = Record<string, JSONSchema7>;

// https://github.com/misskey-dev/misskey/issues/8535
// To avoid excessive stack depth error,
// deceive TypeScript with UnionToIntersection (or more precisely, `infer` expression within it).
export type ObjType<s extends Obj, RequiredProps extends ReadonlyArray<keyof s>, R extends JSONSchema7[]> =
	UnionToIntersection<
		{ -readonly [P in keyof s]?: SchemaType<s[P], R> } &
		{ -readonly [Q in RequiredProps[number]]-?: SchemaType<s[Q], R> }
	>;

// https://stackoverflow.com/questions/54938141/typescript-convert-union-to-intersection
// Get intersection from union 
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type PartialIntersection<T> = Partial<UnionToIntersection<T>>;

// https://github.com/misskey-dev/misskey/pull/8144#discussion_r785287552
// To get union, we use `Foo extends any ? Hoge<Foo> : never`
type UnionSchemaType<a extends readonly any[], R extends JSONSchema7[], X extends JSONSchema7 = a[number]> = X extends any ? SchemaType<X, R> : never;
//type UnionObjectSchemaType<a extends readonly any[], X extends Schema = a[number]> = X extends any ? ObjectSchemaType<X> : never;
type UnionObjType<s extends Obj, a extends readonly any[], R extends JSONSchema7[], X extends ReadonlyArray<keyof s> = a[number]> = X extends any ? ObjType<s, X, R> : never;
type ArrayUnion<T> = T extends any ? Array<T> : never;
export type RecordToUnion<T extends Record<string, any>> = T[keyof T];
export type UnionToArray<T, A extends unknown[] = []> = T extends any ? [T, ...A] : never;
export type RecordToArray<T extends Record<string, any>> = UnionToArray<RecordToUnion<T>>;

type GenReferences<R extends JSONSchema7[], p extends JSONSchema7> =
	p['$defs'] extends Obj ? [...R, ...RecordToArray<p['$defs']>] :
	R;

type ObjectSchemaTypeDef<p extends JSONSchema7, R extends JSONSchema7[]> =
	p['properties'] extends NonNullable<Obj> ?
		p['anyOf'] extends ReadonlyArray<JSONSchema7> ? p['anyOf'][number]['required'] extends ReadonlyArray<keyof p['properties']> ?
			UnionObjType<p['properties'], NonNullable<p['anyOf'][number]['required']>, GenReferences<R, p>> & ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>>
			: never
			: ObjType<p['properties'], NonNullable<p['required']>, GenReferences<R, p>>
	:
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? never : // see CONTRIBUTING.md
	p['allOf'] extends ReadonlyArray<JSONSchema7> ? UnionToIntersection<UnionSchemaType<p['allOf'], GenReferences<R, p>>> :
	any

export type SchemaType<p extends JSONSchema7, R extends JSONSchema7[]> =
	p['$ref'] extends R[number]['$id'] ? GenDef<GenReferences<R, p>, p['$ref']> :
	p['$defs'] extends Obj ? p['$ref'] extends keyof p['$defs'] ? p['$defs'][p['$ref']] extends JSONSchema7 ?
		SchemaType<p['$defs'][p['$ref']], GenReferences<R, p>>
		: never : never :
	p['type'] extends 'null' ? null :
	p['type'] extends 'integer' ? number :
	p['type'] extends 'number' ? number :
	p['type'] extends 'string' ? (
		p['enum'] extends readonly (string | null)[] ?
		p['enum'][number] :
		p['format'] extends 'date-time' ? string : // Dateにする？？
		string
	) :
	p['type'] extends 'boolean' ? boolean :
	p['type'] extends 'object' ? ObjectSchemaTypeDef<p, R> :
	p['type'] extends 'array' ? (
		p['items'] extends OfSchema ? (
			p['items']['anyOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<NonNullable<p['items']['anyOf']>, GenReferences<R, p>>[] :
			p['items']['oneOf'] extends ReadonlyArray<JSONSchema7> ? ArrayUnion<UnionSchemaType<NonNullable<p['items']['oneOf']>, GenReferences<R, p>>> :
			p['items']['allOf'] extends ReadonlyArray<JSONSchema7> ? UnionToIntersection<UnionSchemaType<NonNullable<p['items']['allOf']>, GenReferences<R, p>>>[] :
			never
		) :
		p['items'] extends NonNullable<JSONSchema7> ? SchemaType<p['items'], R>[] :
		any[]
	) :
	p['anyOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<p['anyOf'], GenReferences<R, p>> & PartialIntersection<UnionSchemaType<p['anyOf'], GenReferences<R, p>>> :
	p['oneOf'] extends ReadonlyArray<JSONSchema7> ? UnionSchemaType<p['oneOf'], GenReferences<R, p>> :
	any;
