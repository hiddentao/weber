fs = require('fs')
path = require('path')
tracer    = require('tracer')
cleanCss   = require('clean-css')
compilers = require('./compilers')
Stitch = require('./stitch')

class CSS
  constructor: (config = {}) ->
    @logger = tracer.colorConsole
        format: "[#{config.id}] <{{title}}> {{message}}"
    @minify = config.minify ? true
    @inputs = new Stitch(config.input ? [], @logger)

  compile: ->
    ret = []

    try
        modules = @inputs.resolve()
        modules.forEach (e) ->
            delete require.cache[e.filename]
            ret.push require(e.filename)
    catch err
        @logger.warn err

    ret = ret.join("\n")
    ret = cleanCss.process(ret) if false isnt @minify
    ret


  createServer: ->
    (env, callback) =>
      callback(200,
        'Content-Type': 'text/css',
        @compile())

module.exports =
  CSS: CSS
  createPackage: (args...) ->
    new CSS(args...)
