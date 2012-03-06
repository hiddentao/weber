(function() {
  var CSS, Stitch, cleanCss, compilers, fs, path, tracer,
    __slice = Array.prototype.slice;

  fs = require('fs');

  path = require('path');

  tracer = require('tracer');

  cleanCss = require('clean-css');

  compilers = require('./compilers');

  Stitch = require('./stitch');

  CSS = (function() {

    function CSS(config) {
      var _ref, _ref2;
      if (config == null) config = {};
      this.logger = tracer.colorConsole({
        format: "[" + config.id + "] <{{title}}> {{message}}"
      });
      this.minify = (_ref = config.minify) != null ? _ref : true;
      this.inputs = new Stitch((_ref2 = config.input) != null ? _ref2 : [], this.logger);
    }

    CSS.prototype.compile = function() {
      var modules, ret;
      ret = [];
      try {
        modules = this.inputs.resolve();
        modules.forEach(function(e) {
          delete require.cache[e.filename];
          return ret.push(require(e.filename));
        });
      } catch (err) {
        this.logger.warn(err);
      }
      ret = ret.join("\n");
      if (false !== this.minify) ret = cleanCss.process(ret);
      return ret;
    };

    CSS.prototype.createServer = function() {
      var _this = this;
      return function(env, callback) {
        return callback(200, {
          'Content-Type': 'text/css'
        }, _this.compile());
      };
    };

    return CSS;

  })();

  module.exports = {
    CSS: CSS,
    createPackage: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(CSS, args, function() {});
    }
  };

}).call(this);
