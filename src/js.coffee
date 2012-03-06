fs           = require('fs')
path         = require('path')
eco          = require('eco')
uglify       = require('uglify-js')
tracer    = require('tracer')
compilers    = require('./compilers')
stitch       = require('../assets/stitch')
Dependency   = require('./dependency')
Stitch       = require('./stitch')
{toArray}    = require('./utils')


class Js
  constructor: (config = {}) ->
    @logger = tracer.colorConsole
        format: "[#{config.id}] <{{title}}> {{message}}"
    @identifier = path.basename(config.id, ".js")
    @libs = config.lib ? []
    @paths = config.module
    @dependencies = []

  compileModules: ->
    @dependency or= new Dependency(@dependencies)
    @stitch       = new Stitch(@paths)
    @modules      = @dependency.resolve().concat(@stitch.resolve())
    stitch(identifier: @identifier, modules: @modules)
    
  compileLibs: ->
    (fs.readFileSync(path, 'utf8') for path in @libs).join("\n")
    
  compile: () ->
    result = [@compileLibs(), @compileModules()].join("\n")
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