(function() {
  var Module, Stitch, compilers, flatten, fs, modulerize, npath;

  npath = require('path');

  fs = require('fs');

  compilers = require('./compilers');

  modulerize = require('./resolve').modulerize;

  flatten = require('./utils').flatten;

  Stitch = (function() {

    function Stitch(paths, logger) {
      this.paths = paths != null ? paths : [];
      this.logger = logger;
      true;
    }

    Stitch.prototype.resolve = function() {
      var path;
      return flatten((function() {
        var _i, _len, _ref, _results;
        _ref = this.paths;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          _results.push(this.walk(path));
        }
        return _results;
      }).call(this));
    };

    Stitch.prototype.walk = function(path, parent, result) {
      var child, module, resolvedPath, stat, _i, _len, _ref;
      if (parent == null) parent = path;
      if (result == null) result = [];
      resolvedPath = npath.resolve(path);
      if (!npath.existsSync(resolvedPath)) {
        this.logger.warn("Skipping " + path + ", not found");
        return [];
      }
      stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        _ref = fs.readdirSync(resolvedPath);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          child = npath.join(resolvedPath, child);
          this.walk(child, resolvedPath, result);
        }
      } else {
        if (path === parent) parent = npath.dirname(resolvedPath);
        module = new Module(path, resolvedPath, parent);
        if (module.valid()) result.push(module);
      }
      return result;
    };

    return Stitch;

  })();

  Module = (function() {

    function Module(unresolvedFilename, filename, parent) {
      this.unresolvedFilename = unresolvedFilename;
      this.filename = filename;
      this.parent = parent;
      this.ext = npath.extname(this.filename).slice(1);
      this.id = modulerize(this.filename.replace(npath.join(this.parent, '/'), ''));
    }

    Module.prototype.compile = function() {
      return compilers[this.ext](this.filename);
    };

    Module.prototype.valid = function() {
      return !!compilers[this.ext];
    };

    return Module;

  })();

  module.exports = Stitch;

}).call(this);
