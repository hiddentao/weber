npath        = require('path')
fs           = require('fs')
compilers    = require('./compilers')
{modulerize} = require('./resolve')
{flatten}    = require('./utils')

class Stitch
  constructor: (@paths = [], @logger) ->
    true

  resolve: ->
    flatten(@walk(path) for path in @paths)

  # Private

  walk: (path, parent = path, result = []) ->
    resolvedPath = npath.resolve(path)
    if not npath.existsSync(resolvedPath)
        @logger.warn "Skipping #{path}, not found"
        return []

    stat = fs.statSync(resolvedPath)
    if stat.isDirectory()
        for child in fs.readdirSync(resolvedPath)
            child = npath.join(resolvedPath, child)
            @walk(child, resolvedPath, result)
    else
        module = new Module(resolvedPath, parent)
        result.push(module) if module.valid()

    result


class Module
  constructor: (@filename, @parent) ->
    @ext = npath.extname(@filename).slice(1)
    @id  = modulerize(@filename.replace(npath.join(@parent, '/'), ''))
    
  compile: ->
    compilers[@ext](@filename)
    
  valid: ->
    !!compilers[@ext]
    
module.exports = Stitch