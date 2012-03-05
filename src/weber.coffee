path      = require('path')
fs        = require('fs')
optimist  = require('optimist')
strata    = require('strata')
winston   = require('winston')
js        = require('./package')
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
        @app = new strata.Builder

    exec: (command = argv._[0]) ->
        return help() unless @[command]
        @[command]()

    server: ->
        @app.use(strata.contentLength)
        app_router = new strata.Router

        for urlpath, options of @options.js
            app_router.get urlpath, js.createPackage(options).createServer()

        for urlpath, options of @options.css
            app_router.get urlpath, css.createPackage(options).createServer()

        for urlpath, folder of @options.static
            ( (app, urlpath, folder) ->
                app.map urlpath, ->
                    app.use(strata.file, folder, ['index.html', 'index.htm'])
            )(@app, urlpath, folder)

        @app.run(app_router)
        strata.run(@app, port: @options.port)


    build: ->
        true


    watch: ->
        true


    init: ->
        if path.existsSync(@options.conf)
            console.log "#{@options.conf} already exists"
        else
            fs.writeFileSync(@options.conf, sample_conf)
            console.log "Wrote #{@options.conf}"


    # Private

    _loadConfig: (conf = @options.conf) ->
        return unless conf and path.existsSync(conf)
        slug = JSON.parse(fs.readFileSync(conf, 'utf-8'))

        # parse it

        if not slug.hasOwnProperty("/")
            throw "Root path '/' not specified in config"

        @options.js = {}
        @options.css = {}
        @options.static = {}

        for urlpath, options of slug
            continue if 0 <= ["conf","port"].indexOf(urlpath)

            # what type of object is this?
            switch path.extname(urlpath)
                when ".js"
                    input =
                        lib: []
                        module: []

                    if Array.isArray(options)
                        options.forEach ( (e,i,a) ->
                            input.module.push
                                file: e
                        ), @
                    else if "object" is typeof options
                        if not options.module?
                            logger.warn "Skipping #{urlpath}, no inputs found"
                            continue

                        for inputType in ["lib","module"]
                            if options[inputType]
                                options[inputType].forEach ( (e,i,a) ->
                                    if "string" is typeof e
                                        input[inputType].push
                                            file: e
                                    else if "object" is typeof e
                                        input[inputType].push e
                                    else
                                        logger.warn "Skipping #{inputType} #{e} for #{urlpath}"
                                ), @
                    else
                        logger.warn "Skipping #{urlpath}, unable to parse options"
                        continue

                    @options.js[urlpath] =
                        id: path.basename(urlpath, ".js")
                        input: input

                    logger.info "JS: #{urlpath}"

                #css
                when ".css"
                    if 0 >= options.length
                        logger.warn "Skipping #{urlpath}, no inputs found"
                        continue

                    @options.css[urlpath] = options

                    logger.info "CSS: #{urlpath}"

                # static folder
                when ""
                    if path.existsSync(options)
                        @options.static[urlpath] = options
                    else
                        logger.warn "Folder not found: #{options}"

                # unrecognized path type
                else
                    logger.warn "Unrecognized path type: #{urlpath}"





module.exports = Weber



sample_conf = """
{
    "/" : "./public_assets",

    "/css/app.css" : [
        "./css/reset.css",
        "./css/main.styl"
    ],

    "/js/app.js" : [
        "./coffee"
    ],

    "/js/test.js" : {
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

"""