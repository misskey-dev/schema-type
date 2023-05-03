# schema-type
Get TypeScript Type from JSON Schema

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
```

```

## Features

### Basic

- [x] `type: 'null'`
- [x] `type: 'string'`
- [x] `type: 'number'`, `type: 'integer'`
- [x] `type: 'enum'`
- [x] `type: 'null'`
- [ ] `not`
- [ ] `if`, `then`, `else`
- [ ] `dependentRequired`, `dependentSchemas`

## Attention
### JSON SchemaのobjectでanyOfを使うとき
objectに対してanyOfを使う場合、anyOfの中でpropertiesを定義しないこと。  
バリデーションが効かないため。（SchemaTypeもそのように作られており、objectのanyOf内のpropertiesは捨てられます）  
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
