# Configuration

## `vuechain.json`
The VueChain configuration file:
```json
{
	"packageType": "application",
	"rootDir": "./src",
	"outDir": "./dist",
	"prefix": ""
}
```
+ packageType `<"application" | "library">` - Defines how the package is built.
	+ `"application"` - Sources are bundled into a single web application.
	+ `"library"` - Sources are pre-compiled so that they can be consumed by other packages.
+ rootDir `<string>` - Optional. The path of the source directory. This should contain an `index.ts` file.
+ outDir `<string>` - Optional. The path of the output directory.
+ prefix `<string>` - Optional. An additional prefix that is used for i18n keys. For libraries, this should be set to the library name or some other namespace you choose.

## `tsconfig.json`
The typescript configuration is needed if you want to use typescript.<br>
The following is the recommended typescript config.
```json
{
	"compilerOptions": {
		"target": "es6",
		"module": "esnext",
		"moduleResolution": "node",
		"rootDir": "./src",
		"outDir": "./dist",
		"sourceMap": true,
		"declaration": true
	},
	"include": [
		"./src/**/*"
	]
}
```
+ declaration - You can set declaration to `false` for applications as declaration files are not needed for a final web app.

## `package.json`
The regular package.json as you know it.
```json
{
	"main": "./dist",
	...
}
```
+ main `<string>` - For libraries, this property should be the same as `outDir` in the vuechain config.
