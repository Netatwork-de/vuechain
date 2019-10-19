# Commands
```bash
# Commands can be used from npm scripts or npx.
npm installl --save-dev vuechain
```

## `vuechain start`
Build the package in development mode and watch for changes.<br>
*Can be used with `--context` and `--env`*

## `vuechain build`
Build the package in production mode.<br>
*Can be used with `--context` and `--env`*

## `vuechain clean`
Clean the output directory.<br>
*Can be used with `--context`*

<br>

# Arguments

## `--context <path>`
Specify the package directory.
+ path `<string>` - An absolute or relative path to the project directory. Default is the current directory.

## `--env <mode>`
Specify the environment.
+ mode `<"production" | "development" | "testing">`
