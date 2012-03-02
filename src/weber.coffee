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
    options:
        conf:       './weber.json'
        port:       process.env.PORT or argv.port or 9294
        outputs:     {
            #
            #  './folder' : './public_assets'
            #
            #  '/filename.css' : ['input.css','input2.scss', 'input2.styl', ...]
            #
            #  '/filename.js' : [
            #       'input.js',
            #       {
            #           file: 'input2.coffee',
            #           minify: false
            #       }
            #   ]
        }


    @exec: (command, options) ->
        (new @(options)).exec(command)

    constructor: (options = {}) ->
        @options[key] = value for key, value of options
        @options[key] = value for key, value of @_readSlug()
        @app = new strata.Builder


    exec: (command = argv._[0]) ->
        return help() unless @[command]
        @[command]()

    server: ->
        @app.use(strata.contentLength)
        app_router = new strata.Router

        for urlpath, options of @options.outputs
            # what type of object is this?
            switch path.extname(urlpath)
                #js
                when ".js"
                    app_router.get urlpath, js.createPackage(options).createServer()
                    logger.info "JS route setup: #{urlpath}"
                #css
                when ".css"
                    app_router.get urlpath, css.createPackage(options).createServer()
                    logger.info "CSS route setup: #{urlpath}"
                # static folder
                when ""
                    if path.existsSync(options)
                        ( (app, urlpath, options) ->
                            app.map urlpath, ->
                                app.use(strata.static, options, ['index.html', 'index.htm'])
                        )(@app, urlpath, options)
                        logger.info "Static route setup: #{urlpath}"
                    else
                        logger.warn "Folder not found: #{options}"
                else
                    logger.warn "Unrecognized path type: #{urlpath}"

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

    _readSlug: (conf = @options.conf) ->
        return {} unless conf and path.existsSync(conf)
        JSON.parse(fs.readFileSync(conf, 'utf-8'))



module.exports = Weber



sample_conf = """
{
    "outputs": {

        "/public" : "./public_assets",

        "/app.css" : [
            "./css/reset.css",
            "./css/main.css"
        ],

        "/app.js" : [
            "./lib/jquery.js",
            "./js/bootstrap.js",
            {
                "file":     "./test/test.js",
                "minify":   false
            }
        ]
    }
}

"""