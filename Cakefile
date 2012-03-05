{print} = require 'util'
{spawn} = require 'child_process'

build = (watch = false) ->
    args = ['-c', '-o', 'lib', 'src']
    args.unshift('-w') if watch
    coffee = spawn 'coffee', args
    coffee.stderr.on 'data', (data) ->
        process.stderr.write data.toString()
    coffee.stdout.on 'data', (data) ->
        print data.toString()

task 'build', 'Build lib/ from src/', ->
    build()

task 'watch', 'Watch and build lib/ from src/', ->
    build(true)