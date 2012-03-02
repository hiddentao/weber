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

  argv = optimist.usage(['  usage: weber COMMAND', '    init     create a weber.json config file', '    server   start a dynamic development server', '    build    serialize application to disk', '    watch    build & watch disk for changes'].join("\n")).alias('p', 'port').alias('d', 'debug').argv;

  help = function() {
    optimist.showHelp();
    return process.exit();
  };

  Weber = (function() {

    Weber.prototype.options = {
      conf: './weber.json',
      port: process.env.PORT || argv.port || 9294,
      outputs: {}
    };

    Weber.exec = function(command, options) {
      return (new this(options)).exec(command);
    };

    function Weber(options) {
      var key, value, _ref;
      if (options == null) options = {};
      for (key in options) {
        value = options[key];
        this.options[key] = value;
      }
      _ref = this._readSlug();
      for (key in _ref) {
        value = _ref[key];
        this.options[key] = value;
      }
      this.app = new strata.Builder;
    }

    Weber.prototype.exec = function(command) {
      if (command == null) command = argv._[0];
      if (!this[command]) return help();
      return this[command]();
    };

    Weber.prototype.server = function() {
      var app_router, options, urlpath, _ref;
      this.app.use(strata.contentLength);
      app_router = new strata.Router;
      _ref = this.options.outputs;
      for (urlpath in _ref) {
        options = _ref[urlpath];
        switch (path.extname(urlpath)) {
          case ".js":
            app_router.get(urlpath, js.createPackage(options).createServer());
            logger.info("JS route setup: " + urlpath);
            break;
          case ".css":
            app_router.get(urlpath, css.createPackage(options).createServer());
            logger.info("CSS route setup: " + urlpath);
            break;
          case "":
            if (path.existsSync(options)) {
              (function(app, urlpath, options) {
                return app.map(urlpath, function() {
                  return app.use(strata.static, options, ['index.html', 'index.htm']);
                });
              })(this.app, urlpath, options);
              logger.info("Static route setup: " + urlpath);
            } else {
              logger.warn("Folder not found: " + options);
            }
            break;
          default:
            logger.warn("Unrecognized path type: " + urlpath);
        }
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

    Weber.prototype._readSlug = function(conf) {
      if (conf == null) conf = this.options.conf;
      if (!(conf && path.existsSync(conf))) return {};
      return JSON.parse(fs.readFileSync(conf, 'utf-8'));
    };

    return Weber;

  })();

  module.exports = Weber;

  sample_conf = "{\n    \"outputs\": {\n\n        \"/public\" : \"./public_assets\",\n\n        \"/app.css\" : [\n            \"./css/reset.css\",\n            \"./css/main.css\"\n        ],\n\n        \"/app.js\" : [\n            \"./lib/jquery.js\",\n            \"./js/bootstrap.js\",\n            {\n                \"file\":     \"./test/test.js\",\n                \"minify\":   false\n            }\n        ]\n    }\n}\n";

}).call(this);
