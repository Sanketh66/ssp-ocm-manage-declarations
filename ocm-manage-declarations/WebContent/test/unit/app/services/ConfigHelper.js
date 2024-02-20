sap.ui.require(
  ["com/ssp/ocm/manage/declarations/app/services/ConfigHelper"],
  function(ConfigHelper) {
    "use strict";

    QUnit.module("ConfigHelper - Get Working mode", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.configHelper._oConfigData = {
          mode: "relative"
        };
      },

      afterEach: function() {
        this.configHelper.destroy();
      }
    });

    QUnit.test("The mode is retreived successfully", function(assert) {
      assert.strictEqual(
        typeof this.configHelper.getWorkingMode(),
        "string",
        "The mode was retrieved correctly"
      );
    });

    QUnit.module("ConfigHelper - Get Timeout duration", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.configHelper._oConfigData = {
          timeout: {
            short: "10000",
            medium: "50000",
            long: "300000"
          }
        };
      },

      afterEach: function() {
        this.configHelper.destroy();
      }
    });

    function getTimeout(oOptions) {
      var sDuration = this.configHelper.getTimeout(oOptions.timeoutDuration);
      oOptions.assert.strictEqual(
        sDuration,
        oOptions.expected,
        "The " +
          oOptions.timeoutDuration +
          " timeout duration was retreived correctly"
      );
    }

    QUnit.test("The short timeout is retreived successfully", function(assert) {
      getTimeout.call(this, {
        assert: assert,
        timeoutDuration: "short",
        expected: "10000"
      });
    });

    QUnit.test("The medium timeout is retreived successfully", function(
      assert
    ) {
      getTimeout.call(this, {
        assert: assert,
        timeoutDuration: "medium",
        expected: "50000"
      });
    });

    QUnit.test("The long timeout is retreived successfully", function(assert) {
      getTimeout.call(this, {
        assert: assert,
        timeoutDuration: "long",
        expected: "300000"
      });
    });

    QUnit.module("ConfigHelper - Get base url", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.configHelper._sUrlBase = "baseUrl";
      },

      afterEach: function() {
        this.configHelper.destroy();
      }
    });

    QUnit.test("The base url is retreived successfully", function(assert) {
      assert.strictEqual(
        typeof this.configHelper._getUrlBase(),
        "string",
        "The  base url was retrieved correctly"
      );
    });

    QUnit.module("ConfigHelper - Build base url", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.configHelper._oConfigData = {
          mode: "relative",
          https: "true",
          environments: {
            dev: {
              host: "localhost",
              port: "8080"
            }
          }
        };
      },

      afterEach: function() {
        this.configHelper.destroy();
      }
    });

    function buildBaseUrl(oOptions) {
      this.configHelper._oConfigData = {
        mode: oOptions.mode
          ? oOptions.mode
          : this.configHelper._oConfigData.mode,
        https: oOptions.https
          ? oOptions.https
          : this.configHelper._oConfigData.https,
        environments: oOptions.environments
          ? oOptions.environments
          : this.configHelper._oConfigData.environments
      };
      this.configHelper._buildUrlBase();
      var sUrl = this.configHelper._sUrlBase;
      oOptions.assert.strictEqual(
        sUrl,
        oOptions.expected,
        "The base url with " + oOptions.test + " changed was built correctly"
      );
    }

    QUnit.test("The base url is built correctly with local mode", function(
      assert
    ) {
      buildBaseUrl.call(this, {
        assert: assert,
        mode: "local",
        expected: "",
        test: "mode"
      });
    });

    QUnit.test("The base url is built correctly with relative mode", function(
      assert
    ) {
      buildBaseUrl.call(this, {
        assert: assert,
        expected: "",
        test: "mode"
      });
    });

    QUnit.test(
      "The base url is built correctly with http and dev mode",
      function(assert) {
        buildBaseUrl.call(this, {
          assert: assert,
          mode: "dev",
          https: "false",
          expected: "http://localhost:8080",
          test: "https"
        });
      }
    );

    QUnit.test(
      "The base url is built correctly with https and dev mode",
      function(assert) {
        buildBaseUrl.call(this, {
          assert: assert,
          mode: "dev",
          expected: "https://localhost:8080",
          test: "https"
        });
      }
    );

    QUnit.module("ConfigHelper - Get common path", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.configHelper._oConfigData = {
          mode: "relative",
          urls: {
            path: "/base/test"
          }
        };
        this.configHelper._getUrlBase = function() {
          return "";
        };
      },

      afterEach: function() {
        this.configHelper.destroy();
      }
    });

    function getCommonPath(oOptions) {
      this.configHelper._oConfigData.mode = oOptions.mode
        ? oOptions.mode
        : this.configHelper._oConfigData.mode;
      var sCommonPath = this.configHelper.getCommonPath();
      oOptions.assert.strictEqual(
        sCommonPath,
        oOptions.expected,
        "The common path was retreived correctly"
      );
    }

    QUnit.test("The common path is retreived correctly", function(assert) {
      getCommonPath.call(this, {
        assert: assert,
        expected: "/base/test"
      });
    });

    QUnit.module("ConfigHelper - Get call data", {
      beforeEach: function() {
        this.configHelper = ConfigHelper.getInstance();
        this.getCommonPathStub = sinon.stub(
          this.configHelper,
          "getCommonPath",
          function() {
            return "/baseTest";
          }
        );
        this.configHelper._oConfigData = {
          urls: {
            test: {
              path: "/v1/test/$/",
              GetAsignacionList: {
                method: "GET"
              }
            }
          }
        };
      },

      afterEach: function() {
        this.getCommonPathStub.restore();
        this.configHelper.destroy();
      }
    });

    function getCallData(oOptions) {
      var oCallData = this.configHelper._getCallData(
        oOptions.apiPath,
        oOptions.apiMethod,
        oOptions.aParams
      );
      oOptions.assert.strictEqual(
        oCallData[oOptions.test],
        oOptions.expected,
        "The " + oOptions.test + " was retreived correctly"
      );
    }

    QUnit.test("The common path has been recovered", function(assert) {
      this.configHelper._getCallData("test", "GetAsignacionList");
      assert.ok(
        this.configHelper.getCommonPath.calledOnce,
        "The common path has been recovered"
      );
    });

    QUnit.test("The method is retreived correctly", function(assert) {
      getCallData.call(this, {
        assert: assert,
        apiPath: "test",
        apiMethod: "GetAsignacionList",
        aParams: [],
        expected: "GET",
        test: "method"
      });
    });

    QUnit.test("The url is retreived correctly", function(assert) {
      getCallData.call(this, {
        assert: assert,
        apiPath: "test",
        apiMethod: "GetAsignacionList",
        aParams: [],
        expected: "/baseTest/v1/test/",
        test: "url"
      });
    });

    QUnit.test("The url with params is retreived correctly", function(assert) {
      getCallData.call(this, {
        assert: assert,
        apiPath: "test",
        apiMethod: "GetAsignacionList",
        aParams: ["testParam"],
        expected: "/baseTest/v1/test/testParam/",
        test: "url"
      });
    });
  }
);
