(function() {
  var Weber, argv, css, fs, help, js, logger, optimist, path, sample_conf, strata, winston;

  path = require('path');

  fs = require('fs');

  optimist = require('optimist');

  strata = require('strata');

  winston = require('winston');

  js = require('./package');

  css = require('./css');

  logger = new winston.Logger({
    transports: [
      new winston.transports.Console({
        colorize: true
      })
    ]
  });

  logger.cli();

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
      for (key in options) {
        value = options[key];
        this.options[key] = value;
      }
      this._loadConfig();
      this.app = new strata.Builder;
    }

    Weber.prototype.exec = function(command) {
      if (command == null) command = argv._[0];
      if (!this[command]) return help();
      return this[command]();
    };

    Weber.prototype.server = function() {
      var app_router, folder, options, urlpath, _fn, _ref, _ref2, _ref3;
      this.app.use(strata.contentLength);
      app_router = new strata.Router;
      _ref = this.options.js;
      for (urlpath in _ref) {
        options = _ref[urlpath];
        app_router.get(urlpath, js.createPackage(options).createServer());
      }
      _ref2 = this.options.css;
      for (urlpath in _ref2) {
        options = _ref2[urlpath];
        app_router.get(urlpath, css.createPackage(options).createServer());
      }
      _ref3 = this.options.static;
      _fn = function(app, urlpath, folder) {
        return app.map(urlpath, function() {
          return app.use(strata.file, folder, ['index.html', 'index.htm']);
        });
      };
      for (urlpath in _ref3) {
        folder = _ref3[urlpath];
        _fn(this.app, urlpath, folder);
      }
      this.app.run(app_router);
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
        return console.log("" + this.options.conf + " already exists");
      } else {
        fs.writeFileSync(this.options.conf, sample_conf);
        return console.log("Wrote " + this.options.conf);
      }
    };

    Weber.prototype._loadConfig = function(conf) {
      var input, inputType, options, slug, urlpath, _i, _len, _ref, _results;
      if (conf == null) conf = this.options.conf;
      if (!(conf && path.existsSync(conf))) return;
      slug = JSON.parse(fs.readFileSync(conf, 'utf-8'));
      if (!slug.hasOwnProperty("/")) throw "Root path '/' not specified in config";
      this.options.js = {};
      this.options.css = {};
      this.options.static = {};
      _results = [];
      for (urlpath in slug) {
        options = slug[urlpath];
        if (0 <= ["conf", "port"].indexOf(urlpath)) continue;
        switch (path.extname(urlpath)) {
          case ".js":
            input = {
              lib: [],
              module: []
            };
            if (Array.isArray(options)) {
              options.forEach((function(e, i, a) {
                return input.module.push({
                  file: e
                });
              }), this);
            } else if ("object" === typeof options) {
              if (!(options.module != null)) {
                logger.warn("Skipping " + urlpath + ", no inputs found");
                continue;
              }
              _ref = ["lib", "module"];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                inputType = _ref[_i];
                if (options[inputType]) {
                  options[inputType].forEach((function(e, i, a) {
                    if ("string" === typeof e) {
                      return input[inputType].push({
                        file: e
                      });
                    } else if ("object" === typeof e) {
                      return input[inputType].push(e);
                    } else {
                      return logger.warn("Skipping " + inputType + " " + e + " for " + urlpath);
                    }
                  }), this);
                }
              }
            } else {
              logger.warn("Skipping " + urlpath + ", unable to parse options");
              continue;
            }
            this.options.js[urlpath] = {
              id: path.basename(urlpath, ".js"),
              input: input
            };
            _results.push(logger.info("JS: " + urlpath));
            break;
          case ".css":
            if (0 >= options.length) {
              logger.warn("Skipping " + urlpath + ", no inputs found");
              continue;
            }
            this.options.css[urlpath] = options;
            _results.push(logger.info("CSS: " + urlpath));
            break;
          case "":
            if (path.existsSync(options)) {
              _results.push(this.options.static[urlpath] = options);
            } else {
              _results.push(logger.warn("Folder not found: " + options));
            }
            break;
          default:
            _results.push(logger.warn("Unrecognized path type: " + urlpath));
        }
      }
      return _results;
    };

    return Weber;

  })();

  module.exports = Weber;

  sample_conf = "{\n    \"/\" : \"./public_assets\",\n\n    \"/css/app.css\" : [\n        \"./css/reset.css\",\n        \"./css/main.styl\"\n    ],\n\n    \"/js/app.js\" : [\n        \"./coffee\"\n    ],\n\n    \"/js/test.js\" : {\n        \"lib\" : [\n            \"./lib/testrunner.js\"\n        ],\n        \"module\": [\n            \"testbase.js\",\n            {\n                \"file\":     \"./test/test.coffee\",\n                \"minify\": false\n            }\n        ]\n    }\n}\n";

}).call(this);
