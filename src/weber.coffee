path      = require('path')
fs        = require('fs')
optimist  = require('optimist')
strata    = require('strata')
js        = require('./js')
css       = require('./css')


argv = optimist.usage([
  '  usage: weber COMMAND',
  '    server  start a dynamic development server',
].join("\n"))
.alias('p', 'port')
.alias('d', 'debug')
.argv


help = ->
    optimist.showHelp()
    process.exit()


class Weber
    @exec: (command, options) ->
        (new @(options)).exec(command)

    options:
        slug:       './weber.json'
        port:       process.env.PORT or argv.port or 9294
        static:     {
            #  './folder' : [] or ['filename.html', ...]
        }
        css:        {
            #  '/filename.css' : ['input.css','input2.scss', 'input2.styl', ...]
        }
        js:         {
            #  '/filename.js' : ['input.js','input2.coffee', 'input3.eco', 'input3.jeco'...]
        }


    constructor: (options = {}) ->
        @options[key] = value for key, value of options
        @options[key] = value for key, value of @_readSlug()

        @app = new strata.Builder


    server: ->
        @app.use(strata.contentLength)

#        for file of @options.css
#            @app.get file, css.createPackage(@options.css[file]).createServer()

#        for file of @option.js
#            @app.get file, js.createPackage(@options.js[file]).createServer()

        for folder, files of @options.static
            if path.existsSync(folder)
                files or= []
                @app.use(strata.static, folder, files)

        strata.run(@app, port: @options.port)


    exec: (command = argv._[0]) ->
        return help() unless @[command]
        @[command]()


    # Private

    _readSlug: (slug = @options.slug) ->
        return {} unless slug and path.existsSync(slug)
        JSON.parse(fs.readFileSync(slug, 'utf-8'))


module.exports = Weber