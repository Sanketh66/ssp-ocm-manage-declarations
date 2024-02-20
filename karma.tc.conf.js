/* eslint-disable */
// Karma configuration
// Generated on Tue May 22 2018 17:31:25 GMT+0200 (Romance Daylight Time)

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "./ocm-manage-declarations",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["qunit", "sinon", "openui5"],

    // path to openui5
    openui5: {
      path:
        "https://openui5.hana.ondemand.com/1.99.1/resources/sap-ui-core.js",
      useMockServer: false
    },

    // client
    client: {
      openui5: {
        config: {
          libs: "sap.m",
          theme: "sap_belize",
          compatVersion: "edge",
          resourceroots: {
            "com.ssp.ocm.manage.declarations": "WebContent",
            test: "test"
          }
        },

        tests: ["test/unit/allTests", "test/integration/allFeatures"]
      }
    },

    // list of files / patterns to load in the browser
    files: [{ pattern: "**", included: false, served: true, watched: true }],

    // increased timeout
    browserNoActivityTimeout: 300000,

    // list of files / patterns to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      "./WebContent/**/*.js": ["coverage"]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "coverage", "teamcity"],

    // configure the reporter
    coverageReporter: {
      type: "html",
      reporters: [{ type: "html", subdir: "html" }],
      dir: "../coverage/"
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeHeadless"],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
