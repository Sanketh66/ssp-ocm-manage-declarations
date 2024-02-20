sap.ui.require(["com/ssp/ocm/manage/declarations/app/App.controller"], function(
  AppController
) {
  "use strict";
  QUnit.module("App Controller - App view initialization", {
    beforeEach: function() {
      this.addStyleClassSpy = sinon.spy();
      this.initAppViewModelStub = sinon.stub(
        AppController.prototype,
        "_initAppViewModel"
      );
      this.getViewStub = sinon.stub(
        AppController.prototype,
        "getView",
        function() {
          return {
            addStyleClass: this.addStyleClassSpy
          };
        }.bind(this)
      );
      this.getOwnerComponentStub = sinon.stub(
        AppController.prototype,
        "getOwnerComponent",
        function() {
          return {
            getContentDensityClass: function() {
              return "testClass";
            }
          };
        }
      );
      this.AppController = new AppController();
    },
    afterEach: function() {
      this.addStyleClassSpy = null;
      this.initAppViewModelStub.restore();
      this.getViewStub.restore();
      this.getOwnerComponentStub.restore();
      this.AppController.destroy();
      this.AppController = null;
    }
  });

  QUnit.test("App view initialization", function(assert) {
    this.AppController.onInit();

    assert.ok(
      this.initAppViewModelStub.calledOnce,
      "The init app model method was called"
    );

    assert.ok(
      this.addStyleClassSpy.calledOnce &&
        this.addStyleClassSpy.calledWith("testClass"),
      "The content density class was added correctly"
    );
  });

  QUnit.module("App Controller - App view model initialization", {
    beforeEach: function() {
      this.AppController = new AppController();
      this.busySpy = sinon.spy(function() {
        return 1000;
      });
      this.setModelSpy = sinon.spy(
        function(oModel, sName) {
          this.oViewModel = oModel;
          this.sModelName = sName;
        }.bind(this)
      );
      this.AppController.getView = function() {
        return {
          getBusyIndicatorDelay: this.busySpy
        };
      }.bind(this);
      this.AppController.getOwnerComponent = function() {
        return {
          setModel: this.setModelSpy
        };
      }.bind(this);
    },
    afterEach: function() {
      this.AppController.destroy();
    }
  });

  QUnit.test("The app view model is created successfully", function(assert) {
    this.AppController._initAppViewModel();
    assert.ok(
      this.busySpy.calledOnce,
      "The busy delay was obtained successfully"
    );
    assert.ok(
      this.setModelSpy.calledOnce,
      "The model was successfully sent to the component"
    );
    assert.deepEqual(
      this.oViewModel.getData(),
      { busy: false, delay: 1000 },
      "The model was created successfully"
    );
    assert.equal(
      this.sModelName,
      "appView",
      "The model name was set successfully"
    );
  });
});
