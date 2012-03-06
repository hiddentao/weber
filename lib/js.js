(function() {
  var Dependency, Js, Stitch, compilers, eco, fs, path, stitch, toArray, tracer, uglify,
    __slice = Array.prototype.slice;

  fs = require('fs');

  path = require('path');

  eco = require('eco');

  uglify = require('uglify-js');

  tracer = require('tracer');

  compilers = require('./compilers');

  stitch = require('../assets/stitch');

  Dependency = require('./dependency');

  Stitch = require('./stitch');

  toArray = require('./utils').toArray;

  Js = (function() {

    function Js(config) {
      var _ref;
      if (config == null) config = {};
      this.logger = tracer.colorConsole({
        format: "[" + config.id + "] <{{title}}> {{message}}"
      });
      this.identifier = path.basename(config.id, ".js");
      this.libs = (_ref = config.lib) != null ? _ref : [];
      this.paths = config.module;
      this.dependencies = [];
    }

    Js.prototype.compileModules = function() {
      this.dependency || (this.dependency = new Dependency(this.dependencies));
      this.stitch = new Stitch(this.paths);
      this.modules = this.dependency.resolve().concat(this.stitch.resolve());
      return stitch({
        identifier: this.identifier,
        modules: this.modules
      });
    };

    Js.prototype.compileLibs = function() {
      var path;
      return ((function() {
        var _i, _len, _ref, _results;
        _ref = this.libs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          _results.push(fs.readFileSync(path, 'utf8'));
        }
        return _results;
      }).call(this)).join("\n");
    };

    Js.prototype.compile = function() {
      var result;
      result = [this.compileLibs(), this.compileModules()].join("\n");
      return result;
    };

    Js.prototype.createServer = function() {
      var _this = this;
      return function(env, callback) {
        return callback(200, {
          'Content-Type': 'text/javascript'
        }, _this.compile());
      };
    };

    return Js;

  })();

  module.exports = {
    compilers: compilers,
    Js: Js,
    createPackage: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(Js, args, function() {});
    }
  };

}).call(this);
