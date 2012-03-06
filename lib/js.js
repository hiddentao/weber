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
      var _ref, _ref2, _ref3;
      if (config == null) config = {};
      this.logger = tracer.colorConsole({
        format: "[" + config.id + "] <{{title}}> {{message}}"
      });
      this.minify = (_ref = config.minify) != null ? _ref : true;
      this.identifier = path.basename(config.id, ".js");
      this.dependencies = (_ref2 = config.dependency) != null ? _ref2 : [];
      this.libs = (_ref3 = config.lib) != null ? _ref3 : [];
      this.paths = config.module;
    }

    Js.prototype.compileModules = function() {
      this.dependency || (this.dependency = new Dependency(this.dependencies));
      this.stitch = new Stitch(this.paths, this.logger);
      this.modules = this.dependency.resolve().concat(this.stitch.resolve());
      return stitch({
        identifier: this.identifier,
        modules: this.modules
      });
    };

    Js.prototype.compileLibs = function() {
      var e, libs, ret;
      ret = [];
      try {
        libs = new Stitch(this.libs, this.logger).resolve();
        ret = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = libs.length; _i < _len; _i++) {
            e = libs[_i];
            _results.push(fs.readFileSync(e.filename));
          }
          return _results;
        })();
      } catch (err) {
        this.logger.warn(err);
      }
      return ret.join("\n");
    };

    Js.prototype.compile = function() {
      var result;
      result = [this.compileLibs(), this.compileModules()].join("\n");
      if (false !== this.minify) result = uglify(result);
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
