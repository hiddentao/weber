path      = require('path')
fs        = require('fs')
optimist  = require('optimist')
strata   = require('strata')
winston   = require('winston')
js        = require('./js')
css       = require('./css')



logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(colorize: true),
    ]
  });
logger.cli()


argv = optimist.usage([
  '  usage: weber COMMAND',
  '    init     create a weber.json config file',
  '    server   start a dynamic development server',
  '    build    serialize application to disk',
  '    watch    build & watch disk for changes'
].join("\n"))
.alias('p', 'port')
.alias('d', 'debug')
.argv


help = ->
    optimist.showHelp()
    process.exit()


class Weber
    options: {
        conf:       './weber.json'
        port:       process.env.PORT or argv.port or 9294
        #
        #  '/' : './public_assets'
        #
        #  '/filename.css' : ['input.css','input2.scss', 'input2.styl', ...]
        #
        #  '/filename.js' : [
        #       'output' : './build/filename.js',
        #       'input' : [
        #           'input.js',
        #           {
        #               file: 'input2.coffee',
        #               minify: false
        #           }
        #       ]
        #   }
        #
    }

    @exec: (command, options) ->
        (new @(options)).exec(command)

    constructor: (options = {}) ->
        @options[key] = value for key, value of options
        @_loadConfig()

    exec: (command = argv._[0]) ->
        return help() unless @[command]
        @[command]()

    server: ->
        @app = new strata.Builder
        @app.use(strata.contentLength)

        @app.use(strata.static, @options.docroot, ['index.html', 'index.htm'])

        for urlpath, options of @options.js
            @app.get urlpath, js.createPackage(options, logger).createServer()

        for urlpath, options of @options.css
            @app.get urlpath, css.createPackage(options, logger).createServer()

        strata.run(@app, port: @options.port)


    build: ->
        true


    watch: ->
        true


    init: ->
        if path.existsSync(@options.conf)
            logger.info "#{@options.conf} already exists"
        else
            fs.writeFileSync(@options.conf, sample_conf)
            logger.info "Wrote #{@options.conf}"


    # Private

    _loadConfig: (conf = @options.conf) ->
        return unless conf and path.existsSync(conf)
        slug = JSON.parse(fs.readFileSync(conf, 'utf-8'))

        # parse it

        if not slug.hasOwnProperty("/")
            throw "Root path '/' not specified in config"
        else
            @options.docroot = "#{path.dirname(path.resolve(conf))}/#{slug["/"]}"

        @options.js = {}
        @options.css = {}
        @options.static = {}

        for urlpath, options of slug
            continue if 0 <= ["conf","port"].indexOf(urlpath)
            if "/" isnt urlpath.charAt(0)
                logger.warn "Skipping #{urlpath}, must start with /"
                continue

            # what type of object is this?
            switch path.extname(urlpath)
                when ".js"
                    item =
                        id: path.basename(urlpath, ".js")
                        build: @options.docroot + urlpath
                        lib: []
                        module: []

                    if Array.isArray(options)
                        options.forEach ( (e,i,a) ->
                            item.module.push
                                file: e
                        ), @
                    else if "object" is typeof options
                        if not options.input?
                            logger.warn "Skipping #{urlpath}, no inputs found"
                            continue

                        # if it's an array then treat as an array of modules
                        if Array.isArray(options.input)
                            options.input =
                                module: options.input

                        for inputType in ["lib","module"]
                            if options.input[inputType]
                                options.input[inputType].forEach (e,i,a) =>
                                    if "string" is typeof e
                                        item[inputType].push
                                            file: e
                                    else if "object" is typeof e
                                        item[inputType].push e
                                    else
                                        logger.warn "Skipping #{inputType} #{e} for #{urlpath}"

                        item.build = options.build if options.build?

                    else
                        logger.warn "Skipping #{urlpath}, unable to parse options"
                        continue

                    @options.js[urlpath] = item
                    logger.info "JS: #{urlpath}"

                #css
                when ".css"
                    item =
                        build: @options.docroot + urlpath
                        input: options

                    if not Array.isArray(options) and "object" is typeof options
                        if not options.input? or not Array.isArray(options.input)
                            logger.warn "Skipping #{urlpath}, no inputs found"
                            continue
                        item.build = options.build if options.build?
                        item.input = options.input

                    @options.css[urlpath] = item
                    logger.info "CSS: #{urlpath}"

                # unrecognized path type
                else
                    if "/" isnt urlpath
                        logger.warn "Unrecognized path type: #{urlpath}"





module.exports = Weber



sample_conf = """
{
    "/" : "./public_assets",

    "/css/app.css" : [
        "./css/reset.css",
        "./css/main.styl"
    ],

    "/css/test.css" : [
        "./css/test"
    ],

    "/js/app.js" : [
        "./coffee"
    ],

    "/js/test.js" : {
        "build" : "./test_build.js",
        "input" : {
            "lib" : [
                "./lib/testrunner.js"
            ],
            "module": [
                "testbase.js",
                {
                    "file":     "./test/test.coffee",
                    "minify": false
                }
            ]
        }
    }
}

"""