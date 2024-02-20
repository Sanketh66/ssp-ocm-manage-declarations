sap.ui.require(
  ["sap/ui/core/UIComponent", "com/ssp/ocm/manage/declarations/Component"],
  function(UIComponent, Component) {
    "use strict";
    QUnit.module("Component - Component tests", {
      beforeEach: function() {
        this.models = {
          createDeviceModel: sinon.spy(function() {
            return "device model stub";
          }),
          createJSONModel: sinon.spy(function() {
            return "createJSONModel stub";
          }),
        };

        this.router = {
          initialize: sinon.spy()
        };

        this.configHelperCompSpy = sinon.spy();
        this.configHelper = {
          getInstance: function() {
            return {
              setOwnerComponent: this.configHelperCompSpy
            };
          }.bind(this)
        };

        this.apiFacadeCompSpy = sinon.spy();
        this.apiFacade = {
          getInstance: function() {
            return {
              setOwnerComponent: this.apiFacadeCompSpy
            };
          }.bind(this)
        };

        this.ajaxCallerCompSpy = sinon.spy();
        this.ajaxCaller = {
          getInstance: function() {
            return {
              setOwnerComponent: this.ajaxCallerCompSpy
            };
          }.bind(this)
        };

        sinon.stub(UIComponent.prototype, "init", function() {});
        sinon.stub(UIComponent.prototype, "constructor", function() {});

        this.component = new Component(
          null,
          this.configHelper,
          this.apiFacade,
          this.ajaxCaller,
          this.models
        );

        this.component.setModel = sinon.spy();

        this.component.getRouter = function() {
          return this.router;
        }.bind(this);
      },

      afterEach: function() {
        this.models = null;
        this.router = null;
        this.configHelper = null;
        this.apiFacade = null;
        this.ajaxCaller = null;

        this.component.destroy();

        UIComponent.prototype.init.restore();
        UIComponent.prototype.constructor.restore();

        sap.ui.getCore().getEventBus()._mChannels = {};
      }
    });

    QUnit.test("Component initialization test", function(assert) {
      this.component._initializeBaseObjectSingletonClasses = sinon.spy();

      this.component.init();

      assert.ok(
        this.models.createDeviceModel.calledOnce,
        "A device model was created"
      );

      assert.ok(
        this.component.setModel.calledWith("device model stub", "device"),
        "The device model was set"
      );

      assert.ok(
        UIComponent.prototype.init.calledOnce,
        "The UIComponent prototype was called"
      );

      assert.ok(
        this.router.initialize.calledOnce,
        "The router was initialized"
      );

      assert.ok(
        Boolean(
          sap.ui.getCore().getEventBus()._mChannels["xpr:ajaxCaller"]
            .mEventRegistry.sessionTimeout
        ),
        "Subscribed to event sessionTimeout in xpr:ajaxCaller"
      );
    });

    QUnit.test("Content density test", function(assert) {
      var bTouch = sap.ui.Device.support.touch;

      sap.ui.Device.support.touch = true;
      assert.equal(
        this.component.getContentDensityClass(),
        "sapUiSizeCozy",
        "The correct class gets set if the screen is tactile"
      );

      sap.ui.Device.support.touch = false;
      assert.equal(
        this.component.getContentDensityClass(),
        "sapUiSizeCozy",
        "The correct class gets returned if there is already a class set"
      );

      this.component._sContentDensityClass = null;

      assert.equal(
        this.component.getContentDensityClass(),
        "sapUiSizeCompact",
        "The correct class gets set if the screen is not tactile"
      );

      sap.ui.Device.support.touch = bTouch;
    });

    QUnit.test("Language setting test", function(assert) {
      var sLang = sap.ui
        .getCore()
        .getConfiguration()
        .getLocale()
        .getLanguage();

      this.component.setCurrentLanguageOnClient("lang");

      assert.equal(
        this.component.getCurrentLanguageOnClient(),
        "lang",
        "The setter and getter work correctly"
      );

      assert.equal(
        sap.ui
          .getCore()
          .getConfiguration()
          .getLocale()
          .getLanguage(),
        "lang",
        "The UI5 language was set correctly"
      );

      sap.ui
        .getCore()
        .getConfiguration()
        .setLanguage(sLang);
    });

    QUnit.test("Utility singleton initialization test", function(assert) {
      this.component._initializeBaseObjectSingletonClasses();
      assert.ok(
        this.configHelperCompSpy.calledWith(this.component),
        "The ConfigHelper singleton has its owner set correctly"
      );

      assert.ok(
        this.ajaxCallerCompSpy.calledWith(this.component),
        "The AjaxCaller singleton has its owner set correctly"
      );

      assert.ok(
        this.apiFacadeCompSpy.calledWith(this.component),
        "The ApiFacade singleton has its owner set correctly"
      );
    });
  }
);
