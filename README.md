# Introduction

**Weber** (German for *weaver*) is a fork of [Hem](https://github.com/maccman/hem) and is useful for compiling,
concatenating and minifying scripts, stylesheets and templates when building Javascript web applications.

Weber improves upon Hem by allowing for more flexibility in terms of input sources and multiple build targets. If Hem
is good enough for you then stick with it. Otherwise have a look at what Weber can offer you below.

# Installation

    npm install -g weber

# Usage

Weber runs in 3 modes. Let's look at the **server** mode first...

## Server mode

Once you have Weber configured you can launch server mode by typing the following in the root of your project:

    $ weber server

This will launch a simple [Strata](http://stratajs.org/) server running on **http://localhost:9294**. But let's configure
Weber first. Goto the root of your project folder and type:

    $ weber init

You will now find a file called `weber.json`:

    {
        "/" : "./public_assets",

        "/css/app.css" : [
            "./css/reset.css",
            "./css/main.styl"
        ],

        "/css/test.css" : {
            "minify": false,
            "input" : [
                "./css/test"
            ]
        },

        "/js/app.js" : {
            "build" : "./app.js",
            "input" : {
                "dependency" : [ "es5-shimify" ],
                "lib" : [ "./lib/jquery.js" ],
                "module": [ "./coffee" ]
            }
        },

        "/js/test.js" : {
            "minify": false,
            "input": [
                "./test/testbase.js",
                "./test/test.coffee"
            ]
        }
    }

The above configuration is put there by Weber just to show you what configuration options are available.

The first key-value pair is mandatory and tells Weber which folder to use as the document root when running in server mode. In
this case Weber will expect an `index.html` file inside the `./public_assets` folder to serve up when the browser
navigates to **http://localhost:9294**. By the way, Weber can be told to listen on a different port by adding a
`port: <portnum` key in the config file above.

The remaining key-value pairs in the config file tell Weber what to do when the browser visits the relative URLs
`/css/app.css`, `/css/test.css`, `/js/app.js` and `/js/test.js` respectively. When this happens Weber dynamically
builds and outputs these files using the information provided in the config file. Here is what it does for each file:

*  `/css/app.css` - concatenates `reset.css` with `main.styl` and then minifies the final result.

*  `/css/test.css` - concatenates all CSS and Stylus files in `./css/test`.

*  `/js/apps.js` - concatenates the npm module `es5-shimify` with `./lib/jquery.js` with all the *modularized*
versions of all the code in `./coffee` and then minifies the final result.

*  `/js/test.js` - concatenates *modularized* versions of `./test/testbase.js` and `./test/test.coffee`.

Two points to note:

*  It automatically compiles coffee, stylus and other files into their JS and CSS equivalents when needed.
*  To *modularize* means to wrap the code such that it thinks of itself and behaves like a CommonJS module,
i.e. `require`, `exports`, `module` are available.

The `example` folder in the Weber source code contains a fully working example app with the above configuration file.

## Build mode

Once you're ready to actually build the static output files you can run:

    $ weber build

Weber automatically decided where to place the built output file based on the config. For example, if we have:

    {
        "/" : "./public_assets",
        "/js/app.js" : [ "./coffee" ]
    }

Then the output file for `/js/app.js` will be at `./public_assets/js/app.js`. But we can override this path by using
the `build` key as follows:

    {
        "/" : "./public_assets",
        "/js/app.js" : {
            "build" : [ "./built_app.js" ]
            "input" : [ "./coffee" ]
        }
    }

Now Weber will build the output file at `./built_app.js`.


## Watch mode

In this mode Weber will build the static output files and then watch the inputs for changes, rebuilding the output
files as and when necessary:

    $ weber watch


## Future improvements and contributions

I welcome all feedback contributions to making Weber better.

Some ideas I currently have for the future:

*  Unit/functional testing
*  Allow for pluggable outputs and inputs. For example, if you want to build Weber to build Jade templates into HTML
you should be able to tell it how to do this in the `weber.json` config.



## License

See [https://raw.github.com/hiddentao/weber/master/LICENSE]


