(function() {
  var Weber, argv, css, fs, help, js, optimist, path, sample_conf, strata, tracer;

  path = require('path');

  fs = require('fs');

  optimist = require('optimist');

  strata = require('strata');

  tracer = require('tracer');

  js = require('./js');

  css = require('./css');

  argv = optimist.usage(['  usage: weber COMMAND', '    init     create a weber.json config file', '    server   start a dynamic development server', '    build    serialize application to disk', '    watch    build & watch disk for changes'].join("\n")).alias('p', 'port').alias('d', 'debug').argv;

  help = function() {
    optimist.showHelp();
    return process.exit();
  };

  Weber = (function() {

    Weber.prototype.options = {
      conf: './weber.json',
      port: process.env.PORT || argv.port || 9294
    };

    Weber.exec = function(command, options) {
      return (new this(options)).exec(command);
    };

    function Weber(options) {
      var key, value;
      if (options == null) options = {};
      this.logger = tracer.colorConsole({
        format: '<{{title}}> {{message}}'
      });
      for (key in options) {
        value = options[key];
        this.options[key] = value;
      }
      this._loadConfig();
    }

    Weber.prototype.exec = function(command) {
      if (command == null) command = argv._[0];
      if (!this[command]) return help();
      return this[command]();
    };

    Weber.prototype.server = function() {
      var options, urlpath, _ref, _ref2;
      this.app = new strata.Builder;
      this.app.use(strata.contentLength);
      this.app.use(strata.static, this.options.docroot, ['index.html', 'index.htm']);
      _ref = this.options.js;
      for (urlpath in _ref) {
        options = _ref[urlpath];
        this.app.get(urlpath, js.createPackage(options).createServer());
      }
      _ref2 = this.options.css;
      for (urlpath in _ref2) {
        options = _ref2[urlpath];
        this.app.get(urlpath, css.createPackage(options).createServer());
      }
      return strata.run(this.app, {
        port: this.options.port
      });
    };

    Weber.prototype.build = function() {
      return true;
    };

    Weber.prototype.watch = function() {
      return true;
    };

    Weber.prototype.init = function() {
      if (path.existsSync(this.options.conf)) {
        return this.logger.info("" + this.options.conf + " already exists");
      } else {
        fs.writeFileSync(this.options.conf, sample_conf);
        return this.logger.info("Wrote " + this.options.conf);
      }
    };

    Weber.prototype._loadConfig = function(conf) {
      var inputType, item, options, slug, urlpath, _i, _len, _ref, _results,
        _this = this;
      if (conf == null) conf = this.options.conf;
      if (!(conf && path.existsSync(conf))) return;
      slug = JSON.parse(fs.readFileSync(conf, 'utf-8'));
      if (!slug.hasOwnProperty("/")) {
        throw "Root path '/' not specified in config";
      } else {
        this.options.docroot = "" + (path.dirname(path.resolve(conf))) + "/" + slug["/"];
      }
      this.options.js = {};
      this.options.css = {};
      this.options.static = {};
      _results = [];
      for (urlpath in slug) {
        options = slug[urlpath];
        if (0 <= ["conf", "port"].indexOf(urlpath)) continue;
        if ("/" !== urlpath.charAt(0)) {
          this.logger.warn("Skipping " + urlpath + ", must start with /");
          continue;
        }
        switch (path.extname(urlpath)) {
          case ".js":
            item = {
              id: urlpath,
              build: this.options.docroot + urlpath,
              lib: [],
              module: []
            };
            if (Array.isArray(options)) {
              options.forEach((function(e, i, a) {
                return item.module.push({
                  file: e
                });
              }), this);
            } else if ("object" === typeof options) {
              if (!(options.input != null)) {
                this.logger.warn("Skipping " + urlpath + ", no inputs found");
                continue;
              }
              if (Array.isArray(options.input)) {
                options.input = {
                  module: options.input
                };
              }
              _ref = ["lib", "module"];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                inputType = _ref[_i];
                if (options.input[inputType]) {
                  options.input[inputType].forEach(function(e, i, a) {
                    if ("string" === typeof e) {
                      return item[inputType].push({
                        file: e
                      });
                    } else if ("object" === typeof e) {
                      return item[inputType].push(e);
                    } else {
                      return _this.logger.warn("Skipping " + inputType + " " + e + " for " + urlpath);
                    }
                  });
                }
              }
              if (options.build != null) item.build = options.build;
            } else {
              this.logger.warn("Skipping " + urlpath + ", unable to parse options");
              continue;
            }
            this.options.js[urlpath] = item;
            _results.push(this.logger.info("JS: " + urlpath));
            break;
          case ".css":
            item = {
              id: urlpath,
              build: this.options.docroot + urlpath,
              input: options
            };
            if (!Array.isArray(options) && "object" === typeof options) {
              if (!(options.input != null) || !Array.isArray(options.input)) {
                this.logger.warn("Skipping " + urlpath + ", no inputs found");
                continue;
              }
              if (options.build != null) item.build = options.build;
              item.input = options.input;
            }
            this.options.css[urlpath] = item;
            _results.push(this.logger.info("CSS: " + urlpath));
            break;
          default:
            if ("/" !== urlpath) {
              _results.push(this.logger.warn("Unrecognized path type: " + urlpath));
            } else {
              _results.push(void 0);
            }
        }
      }
      return _results;
    };

    return Weber;

  })();

  module.exports = Weber;

  sample_conf = "{\n    \"/\" : \"./public_assets\",\n\n    \"/css/app.css\" : [\n        \"./css/reset.css\",\n        \"./css/main.styl\"\n    ],\n\n    \"/css/test.css\" : [\n        \"./css/test\"\n    ],\n\n    \"/js/app.js\" : [\n        \"./coffee\"\n    ],\n\n    \"/js/test.js\" : {\n        \"build\" : \"./test_build.js\",\n        \"input\" : {\n            \"lib\" : [\n                \"./lib/testrunner.js\"\n            ],\n            \"module\": [\n                \"testbase.js\",\n                {\n                    \"file\":     \"./test/test.coffee\",\n                    \"minify\": false\n                }\n            ]\n        }\n    }\n}\n";

}).call(this);
