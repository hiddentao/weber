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
        # for logic in Module to work correctly we need to set the parent to the parent folder. this happens
        # whenever a file (rather than a folder) is provided given in the @paths array.
        parent = npath.dirname(resolvedPath) if path is parent

        module = new Module(path, resolvedPath, parent)
        result.push(module) if module.valid()

    result


class Module
  constructor: (@unresolvedFilename, @filename, @parent) ->
    @ext = npath.extname(@filename).slice(1)
    @id  = modulerize(@filename.replace(npath.join(@parent, '/'), ''))
    
  compile: ->
    compilers[@ext](@filename)
    
  valid: ->
    !!compilers[@ext]
    
module.exports = Stitch