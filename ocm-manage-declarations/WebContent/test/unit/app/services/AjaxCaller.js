sap.ui.require(["com/ssp/ocm/manage/declarations/app/services/AjaxCaller"], function(
  AjaxCaller
) {
  "use strict";
  var ConfigHelper;

  QUnit.module("AjaxCaller - Caller Test", {
    beforeEach: function() {
      // Arrange
      ConfigHelper = {
        getInstance: function() {
          return {
            getTimeout: function() {
              return 100000;
            }
          };
        }
      };
      this.ajaxCaller = AjaxCaller.getInstance(ConfigHelper);
      this.xhr = sinon.useFakeXMLHttpRequest();
      var requests = this.requests = [];

      this.xhr.onCreate = function(xhr) {
        requests.push(xhr);
      };
    },

    afterEach: function() {
      // Clean
      this.xhr.restore();
      ConfigHelper = null;
      this.ajaxCaller.destroy();
    }
  });

  QUnit.test(
    "Should make one request and return a promise that succeeds when the call is successful",
    function(assert) {
      assert.expect(3);

      var doneSuccess = assert.async();
      var doneError = assert.async();
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();
      var oCallPromise = this.ajaxCaller.requestAjax("GET", "/fake/endpoint");

      assert.equal(1, this.requests.length, "Right number of requests");

      this.requests[0].respond(
        200,
        { "Content-Type": "application/json" },
        '[{ "foo": "bar", "bar" : "foo" }]'
      );

      var finallyFunc = function() {
        assert.ok(
          successCallback.calledWith([{ foo: "bar", bar: "foo" }]),
          "Success callback is called right"
        );
        doneSuccess();
        assert.ok(errorCallback.notCalled, "Error callback is not called");
        doneError();
      };

      oCallPromise
        .then(function(oData) {
          successCallback(oData);
          finallyFunc();
        })
        .catch(function(oError) {
          errorCallback(oError);
          finallyFunc();
        });
    }
  );

  QUnit.test(
    "Should make one request and return a promise that fails when the call is not successful",
    function(assert) {
      var doneSuccess = assert.async();
      var doneError = assert.async();
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();
      var oCallPromise = this.ajaxCaller.requestAjax("GET", "/fake/endpoint");

      assert.equal(1, this.requests.length, "Right number of requests");

      this.requests[0].respond(
        404,
        { "Content-Type": "text/plain" },
        "Not Found"
      );

      var finallyFunc = function() {
        assert.ok(successCallback.notCalled, "Success callback is not called");
        doneSuccess();
        assert.ok(errorCallback.calledOnce, "Error callback is called");
        doneError();
      };

      oCallPromise
        .then(function(oData) {
          successCallback(oData);
          finallyFunc();
        })
        .catch(function(oError) {
          errorCallback(oError);
          finallyFunc();
        });
    }
  );

  QUnit.test(
    "In a POST request the json body request should be sent to the server",
    function(assert) {
      this.ajaxCaller.requestAjax(
        "POST",
        "/fake/endpoint",
        { data: "hello" },
        "long",
        "json"
      );

      assert.equal(1, this.requests.length, "Right number of requests");

      assert.equal(
        '{"data":"hello"}',
        this.requests[0].requestBody,
        "Body sent correctly"
      );

      assert.equal(
        "application/json;charset=utf-8",
        this.requests[0].requestHeaders["Content-Type"],
        "Content-Type header set correctly"
      );
    }
  );

  QUnit.test(
    "In a POST request the xml body request should be sent to the server with the correct headers",
    function(assert) {
      assert.expect(3);

      this.ajaxCaller.requestAjax(
        "POST",
        "/fake/endpoint",
        '<?xml version="1.0"?><data>hello</data>',
        "long",
        "xml"
      );

      assert.equal(1, this.requests.length, "Right number of requests");

      assert.equal(
        this.requests[0].requestBody,
        '<?xml version="1.0"?><data>hello</data>',
        "Body sent correctly"
      );

      assert.equal(
        this.requests[0].requestHeaders["Content-Type"],
        "application/xml;charset=utf-8",
        "Content-Type header set correctly"
      );
    }
  );

  QUnit.test(
    "In a POST request the form body request should be sent to the server with no Content-Type header",
    function(assert) {
      assert.expect(2);

      this.ajaxCaller.requestAjax(
        "POST",
        "/fake/endpoint",
        new FormData(),
        "long",
        "form"
      );

      assert.equal(1, this.requests.length, "Right number of requests");

      assert.equal(
        null,
        this.requests[0].requestHeaders["Content-Type"],
        "Content-Type header set correctly"
      );
    }
  );

  QUnit.test(
    "If we try to make a call with no internet connection the call fails",
    function(assert) {
      assert.expect(3);

      var doneSuccess = assert.async();
      var doneError = assert.async();
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();

      this.online = window.navigator.onLine;
      window.navigator.__defineGetter__("onLine", function() {
        return false;
      });

      var oCallPromise = this.ajaxCaller.requestAjax(
        "DELETE",
        "/fake/endpoint"
      );

      assert.equal(this.requests.length, 0, "Right number of requests");

      var finallyFunc = function() {
        assert.ok(successCallback.notCalled, "Success callback is not called");
        doneSuccess();
        assert.ok(errorCallback.calledOnce, "Error callback is called");
        doneError();
        window.navigator.__defineGetter__(
          "onLine",
          function() {
            return this.online;
          }.bind(this)
        );
      }.bind(this);

      oCallPromise
        .then(function(oData) {
          successCallback(oData);
          finallyFunc();
        })
        .catch(function(oError) {
          errorCallback(oError);
          finallyFunc();
        });
    }
  );

  QUnit.test(
    "If we receive a session expired header then we send a session expired event and we don't resolve the call",
    function(assert) {
      assert.expect(4);

      var doneSuccess = assert.async();
      var doneError = assert.async();
      var doneTimeout = assert.async();
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();
      var timeoutCallback = sinon.spy();

      sap.ui
        .getCore()
        .getEventBus()
        .subscribe("xpr:ajaxCaller", "sessionTimeout", timeoutCallback);

      var oCallPromise = this.ajaxCaller.requestAjax(
        "DELETE",
        "/fake/endpoint"
      );

      assert.equal(1, this.requests.length, "Right number of requests");

      this.requests[0].respond(
        200,
        {
          "com.sap.cloud.security.login": "timeout",
          "Content-Type": "application/json"
        },
        '{ "error": "timeout" }'
      );

      var finallyFunc = function() {
        assert.ok(successCallback.notCalled, "Success callback is not called");
        doneSuccess();
        assert.ok(errorCallback.notCalled, "Error callback is not called");
        doneError();
        assert.ok(timeoutCallback.calledOnce, "Timeout event has triggered");
        doneTimeout();
      };

      oCallPromise.then(successCallback).catch(errorCallback);

      $.sap.delayedCall(this, 300, finallyFunc);
    }
  );

  QUnit.test(
    "If the call succeeds we should be able to recover a header from the server",
    function(assert) {
      assert.expect(3);

      var doneSuccess = assert.async();
      var doneError = assert.async();
      var successCallback = sinon.spy();
      var errorCallback = sinon.spy();
      var oCallPromise = this.ajaxCaller.requestAjax(
        "GET",
        "/fake/endpoint",
        null,
        "long",
        null,
        ["genericHeader"]
      );

      assert.equal(1, this.requests.length, "Right number of requests");

      this.requests[0].respond(
        200,
        { "Content-Type": "application/json", genericHeader: "recovery" },
        '{ "foo": "bar", "bar" : "foo" }'
      );

      var finallyFunc = function() {
        assert.ok(
          successCallback.calledWith({
            foo: "bar",
            bar: "foo",
            responseHttpHeaders: { genericHeader: "recovery" }
          }),
          "Success callback is called right"
        );
        doneSuccess();
        assert.ok(errorCallback.notCalled, "Error callback is not called");
        doneError();
      };

      oCallPromise
        .then(function(oData) {
          successCallback(oData);
          finallyFunc();
        })
        .catch(function(oError) {
          errorCallback(oError);
          finallyFunc();
        });
    }
  );

  QUnit.test("The basic authentication token is launched correctly", function(
    assert
  ) {
    this.ajaxCaller.requestAjax(
      "GET",
      "/fake/endpoint",
      null,
      "long",
      null,
      null,
      "auth_string"
    );

    assert.equal(this.requests.length, 1, "Right number of requests");

    assert.equal(
      this.requests[0].requestHeaders.Authorization,
      "Basic auth_string"
    );
  });

  QUnit.test("The call should fail after the timeout threshold", function(
    assert
  ) {
    assert.expect(3);

    var clock = sinon.useFakeTimers(Date.now());

    var doneSuccess = assert.async();
    var doneError = assert.async();
    var successCallback = sinon.spy();
    var errorCallback = sinon.spy();
    var oCallPromise = this.ajaxCaller.requestAjax(
      "GET",
      "/fake/endpoint",
      null,
      "long",
      null,
      ["genericHeader"]
    );

    assert.equal(1, this.requests.length, "Right number of requests");

    var finallyFunc = function() {
      assert.ok(successCallback.notCalled, "Success callback is not called");
      doneSuccess();
      assert.ok(errorCallback.calledOnce, "Error callback is called");
      doneError();

      clock.restore();
    };

    oCallPromise
      .then(function(oData) {
        successCallback(oData);
        finallyFunc();
      })
      .catch(function(oError) {
        errorCallback(oError);
        finallyFunc();
      });

    clock.tick(100500);
  });
});
