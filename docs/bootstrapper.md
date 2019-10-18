# The VueChain Bootstrapper
When building an application, it is recommended to use the `vuechain` bootstrapper.<br>
It takes care of all important things and is executed while some parts of your application may still be loading.

```ts
import { bootstrap } from "vuechain";
import App from "./app.vue";

bootstrap({
	app: App
});
```

## Start hook
The start hook is executed after the vue instance has been created.<br>
When the start hook finishes, the vue instance is rendered.
```ts
bootstrap({
	app: App,

	async start(app: Vue) {
		// Do some startup logic like..
		//   ..Fetching a configuration.
		//   ..Setting the locale.
	}
});
```
