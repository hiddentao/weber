fs           = require('fs')
path         = require('path')
eco          = require('eco')
uglify       = require('uglify-js')
tracer       = require('tracer')
compilers    = require('./compilers')
stitch       = require('../assets/stitch')
Dependency   = require('./dependency')
Stitch       = require('./stitch')
{toArray}    = require('./utils')


class Js
  constructor: (config = {}) ->
    @logger = tracer.colorConsole
        format: "[#{config.id}] <{{title}}> {{message}}"
    @minify = config.minify ? true
    @identifier = path.basename(config.id, ".js")
    @dependencies = config.dependency ? []
    @libs = config.lib ? []
    @paths = config.module

  compileModules: ->
    @dependency or= new Dependency(@dependencies)
    @stitch       = new Stitch( @paths, @logger )
    @modules      = @dependency.resolve().concat(@stitch.resolve())
    stitch(identifier: @identifier, modules: @modules)
    
  compileLibs: ->
    ret = []
    try
        libs = new Stitch( @libs, @logger ).resolve()
        ret = (fs.readFileSync(e.filename) for e in libs)
    catch err
        @logger.warn err
    ret.join("\n")

  compile: () ->
    result = [@compileLibs(), @compileModules()].join("\n")
    result = uglify(result) if false isnt @minify
    result

  createServer: ->
    (env, callback) =>
      callback(200,
        'Content-Type': 'text/javascript',
        @compile())

module.exports = 
  compilers:  compilers
  Js:    Js
  createPackage: (args...) ->
    new Js(args...)