# Troubleshooting

## Cannot find module "./foo.vue"
This occurs when type script is unable to find the type information for vue components.<br>
To fix this, you can manually point to the vuechain types in your `/src/index.ts` file:
```ts
/// <reference types="vuechain" />
```
If you import something from the `"vuechain"` package, this reference can be removed.

<br>



## Localized things are not displayed correctly.
Try reloading the page, saving the file you are editing currently or restart the build chain.
