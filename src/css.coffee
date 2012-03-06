fs = require('fs')
path = require('path')
compilers = require('./compilers')
Stitch = require('./stitch')

class CSS
  constructor: (config = {}, @logger) ->
    @inputs = new Stitch(config.input ? [], @logger)

  compile: ->
    ret = []
    try
        modules = @inputs.resolve()
        modules.forEach (e) ->
            if 0 <= ["css","styl"].indexOf(e.ext)
                delete require.cache[e.filename]
                ret.push require(e.filename)
    catch err
        @logger.warn err
    ret.join("\n")


  createServer: ->
    (env, callback) =>
      callback(200,
        'Content-Type': 'text/css',
        @compile())

module.exports =
  CSS: CSS
  createPackage: (args...) ->
    new CSS(args...)
