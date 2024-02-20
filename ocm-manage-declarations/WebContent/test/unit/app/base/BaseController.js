sap.ui.require(
  [
    "com/ssp/ocm/manage/declarations/app/base/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    "sap/m/Dialog"
  ],
  function(BaseController, JSONModel, History, MessageBox, Dialog) {
    "use strict";
    QUnit.module("BaseController - Router tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.routerSpy = sinon.spy();
        this.baseController.getOwnerComponent = function() {
          return {
            getRouter: this.routerSpy
          };
        }.bind(this);
      },
      afterEach: function() {
        this.routerSpy = null;
        this.baseController.destroy();
      }
    });

    QUnit.test("Get router", function(assert) {
      this.baseController.getRouter();
      assert.ok(
        this.routerSpy.calledOnce,
        "The router was obtained successfully"
      );
    });

    QUnit.module("BaseController - Models getter and setter tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.modelsTest = {};
        this.baseController.getView = function() {
          return {
            models: this.modelsTest,
            getModel: function(sName) {
              return this.models[sName];
            },
            setModel: function(oModel, sName) {
              this.models[sName] = oModel;
            }
          };
        }.bind(this);
      },
      afterEach: function() {
        this.getViewSpy = null;
        this.baseController.destroy();
      }
    });

    QUnit.test(
      "The model obtained by the getter should be the same that is set by the setter",
      function(assert) {
        var model1 = {
          property: "value1"
        };
        var model2 = {
          property: "value2"
        };

        this.baseController.setModel(model1, "testModel1");
        assert.equal(
          this.baseController.getModel("testModel1"),
          model1,
          "The model 1 was set and get correctly"
        );

        this.baseController.setModel(model2, "testModel2");
        assert.equal(
          this.baseController.getModel("testModel2"),
          model2,
          "The model 2 was set and get correctly"
        );

        assert.notEqual(
          this.baseController.getModel("testModel1"),
          model2,
          "The model 1 is different than model 2 then they were set and get correctly"
        );
      }
    );

    QUnit.module("BaseController - Resource bundle tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.resourceBundleSpy = sinon.spy();
        this.baseController.getOwnerComponent = function() {
          return {
            getModel: function() {
              return {
                getResourceBundle: this.resourceBundleSpy
              };
            }.bind(this)
          };
        }.bind(this);
      },
      afterEach: function() {
        this.resourceBundleSpy = null;
        this.baseController.destroy();
      }
    });

    QUnit.test("Get resource bundle", function(assert) {
      this.baseController.getResourceBundle();
      assert.ok(
        this.resourceBundleSpy.calledOnce,
        "The resource bundle was obtained successfully"
      );
    });

    QUnit.module("BaseController - Formatter tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.formatter = "formatter";
        this.baseController.formatter = this.formatter;
      },
      afterEach: function() {
        this.baseController.destroy();
      }
    });

    QUnit.test("Get formatter", function(assert) {
      assert.equal(
        this.baseController.getFormatter(),
        this.formatter,
        "The formatter was obtained successfully"
      );
    });

    QUnit.module("BaseController - Do navegation tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.controlFlow = "";
        this.createHistoryStub = sinon.stub(
          History,
          "getInstance",
          function() {
            return {
              getPreviousHash: function() {
                if (this.controlFlow !== "") {
                  return this.controlFlow;
                }

                return undefined;
              }.bind(this)
            };
          }.bind(this)
        );

        this.targetSpy = sinon.spy();
        this.historyGoSpy = sinon.spy();
        history.go = this.historyGoSpy;
        this.baseController.getRouter = function() {
          return {
            navTo: function(sRouteName, oParams) {
              if (oParams) {
                this.controlFlow = "With params";
              } else {
                this.controlFlow = "Without params";
              }
            }.bind(this),
            getTargets: function() {
              return {
                display: this.targetSpy
              };
            }.bind(this)
          };
        }.bind(this);
      },
      afterEach: function() {
        this.baseController.destroy();
        this.createHistoryStub.restore();
      }
    });

    QUnit.test(
      "The method doNav was called with and without oParams parameter",
      function(assert) {
        this.baseController.doNavTo("router", { param1: "p1" });
        assert.equal(
          this.controlFlow,
          "With params",
          "The doNavTo method was proceesed correctly with parameters"
        );

        this.baseController.doNavTo("router");
        assert.equal(
          this.controlFlow,
          "Without params",
          "The doNavTo method was proceesed correctly without parameters"
        );
      }
    );

    QUnit.test(
      "The method doNavToBasedOnTarget was proceesed correctly",
      function(assert) {
        this.baseController.doNavToBasedOnTarget();
        assert.ok(
          this.targetSpy.calledOnce,
          "The navigation based on targets was called successfully"
        );
      }
    );

    QUnit.test(
      "The method onNavBack was called to navegate to Back correctly",
      function(assert) {
        this.controlFlow = "back";
        this.baseController.onNavBack();
        assert.ok(
          this.historyGoSpy.calledOnce,
          "The navigation back using history was called successfully"
        );
      }
    );

    QUnit.test(
      "The method onNavBack was called to navegate to Main correctly",
      function(assert) {
        this.baseController.onNavBack();
        assert.equal(
          this.controlFlow,
          "Without params",
          "The navigation back to Main was called successfully"
        );
      }
    );

    QUnit.test(
      "The method onNavBackTarget was called to navegate to Main correctly",
      function(assert) {
        this.baseController._sFromTargetName = undefined;
        this.baseController.onNavBackTarget();
        assert.equal(
          this.controlFlow,
          "Without params",
          "The navigation back to target 'Main' was called successfully"
        );
      }
    );

    QUnit.test(
      "The method onNavBackTarget was called to navegate to a defined target correctly",
      function(assert) {
        this.baseController._sFromTargetName = "target";
        this.baseController.onNavBackTarget();
        assert.ok(
          this.targetSpy.calledOnce,
          "The navigation back to a defined target was called successfully"
        );
      }
    );

    QUnit.module("BaseController - Switch on / off busy tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.oAppViewModel = {
          "/busy": true,
          setProperty: function(sName, sValue) {
            this[sName] = sValue;
          }
        };
        this.baseController.getOwnerComponent = function() {
          return {
            getModel: function() {
              return this.oAppViewModel;
            }.bind(this)
          };
        }.bind(this);
      },
      afterEach: function() {
        this.baseController.destroy();
      }
    });

    QUnit.test("The busy switch is set to true and false correctly", function(
      assert
    ) {
      this.baseController.switchOnBusy();
      assert.equal(
        this.oAppViewModel["/busy"],
        true,
        "The busy switch was set to on / true correctly"
      );

      this.baseController.switchOffBusy();
      assert.equal(
        this.oAppViewModel["/busy"],
        false,
        "The busy switch was set to off / false correctly"
      );
    });

    QUnit.module("BaseController - Validate phone number tests");

    // QUnit.test(
    //   "The method isValidPhoneNumber validated a wrong phone number correctly",

    //   function(assert) {
    //     this.baseController = new BaseController();
    //     assert.equal(
    //       this.baseController.isValidPhoneNumber("asd"),
    //       false,
    //       "The phone number 'asd' was validated as worng phone number successfully"
    //     );
    //     this.baseController.destroy();
    //   }
    // );

    // QUnit.test(
    //   "The method isValidPhoneNumber validated a right phone number correctly",

    //   function(assert) {
    //     this.baseController = new BaseController();
    //     assert.equal(
    //       this.baseController.isValidPhoneNumber("911111111"),
    //       true,
    //       "The phone number '911111111' was validated as right phone number successfully"
    //     );
    //     this.baseController.destroy();
    //   }
    // );

    QUnit.module("BaseController - Alert tests", {
      beforeEach: function() {
        this.baseController = new BaseController();
        this.bCompactLength = 0;
        this.baseController.getView = function() {
          return {
            $: function() {
              return {
                closest: function() {
                  return {
                    length: this.bCompactLength
                  };
                }.bind(this)
              };
            }.bind(this)
          };
        }.bind(this);

        this.baseController.getResourceBundle = function() {
          return {
            getText: function(sText) {
              return sText;
            }
          };
        };

        this.alertSpy = sinon.spy();
        this.successSpy = sinon.spy();
        this.warningSpy = sinon.spy();
        this.errorSpy = sinon.spy();

        this.successMessageStub = sinon.stub(
          MessageBox,
          "success",
          this.successSpy
        );

        this.warningMessageStub = sinon.stub(
          MessageBox,
          "warning",
          this.warningSpy
        );

        this.errorMessageStub = sinon.stub(MessageBox, "error", this.errorSpy);

        // this.baseController.alert = this.alertSpy;
      },
      afterEach: function() {
        this.alertSpy = null;
        this.successSpy = null;
        this.warningSpy = null;
        this.errorSpy = null;
        this.successMessageStub.restore();
        this.warningMessageStub.restore();
        this.errorMessageStub.restore();
        this.baseController.destroy();
      }
    });

    QUnit.test(
      "Show alert message when Ajax error without Reject parameter",
      function(assert) {
        this.baseController.standardAjaxErrorDisplay();
        assert.ok(
          this.errorSpy.calledOnce,
          "The alert was showed successfully"
        );
      }
    );

    QUnit.test(
      "Show alert message when Ajax error with Reject parameter",
      function(assert) {
        this.baseController.standardAjaxErrorDisplay({
          error: { responseJSON: { message: "message" } }
        });
        assert.ok(
          this.errorSpy.calledOnce,
          "The alert was showed successfully"
        );
      }
    );

    QUnit.test("Show alert message of type 'success'", function(assert) {
      this.baseController.alert("test", "S", function() {});
      assert.ok(
        this.successSpy.calledOnce,
        "The success alert was showed successfully"
      );
    });

    QUnit.test("Show alert message of type 'warning'", function(assert) {
      this.baseController.alert("test", "W", function() {});
      assert.ok(
        this.warningSpy.calledOnce,
        "The warning alert was showed successfully"
      );
    });

    QUnit.test("Show alert message of type 'error'", function(assert) {
      this.baseController.alert("test", "E", function() {});
      assert.ok(
        this.errorSpy.calledOnce,
        "The error alert was showed successfully"
      );
    });

    QUnit.test("Show alert message of type 'default'", function(assert) {
      this.baseController.alert("test", "", function() {});
      assert.ok(
        this.warningSpy.calledOnce,
        "The default alert was showed successfully"
      );
    });

    QUnit.test(
      "Show alert message of type 'default' with i18n.pattern parameter",
      function(assert) {
        this.baseController.alert({ pattern: "pattern" }, "", function() {});
        assert.ok(
          this.warningSpy.calledOnce,
          "The default alert was showed successfully"
        );
      }
    );

    QUnit.test(
      "Show alert message of type 'default' without fnCloseHandler parameter",
      function(assert) {
        this.baseController.alert({ pattern: "pattern" }, "");
        assert.ok(
          this.warningSpy.calledOnce,
          "The default alert was showed successfully"
        );
      }
    );

    QUnit.module("BaseController - Table pagination logic", {
      beforeEach: function() {
        this.setModelStub = sinon.stub(
          BaseController.prototype,
          "setModel",
          function(oModel, sModel) {
            this[sModel] = oModel;
          }.bind(this)
        );
        this.getModelStub = sinon.stub(
          BaseController.prototype,
          "getModel",
          function(sModel) {
            return this[sModel];
          }.bind(this)
        );
        this.baseController = new BaseController();

        var oData = {
          data: [
            {
              loc: 0,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 1,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 2,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 3,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 4,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 5,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            },
            {
              loc: 6,
              descr: "descr",
              amr: "amr",
              serialNo: "12345",
              contract: "test",
              selected: true
            }
          ],
          currentIndex: 0,
          growingThreshold: 3
        };

        oData.currentData = oData.data.slice(
          oData.currentIndex,
          oData.currentIndex + oData.growingThreshold
        );
        this.baseController.setModel(new JSONModel(oData), "testModel");
      },
      afterEach: function() {
        this.setModelStub.restore();
        this.getModelStub.restore();
        this.baseController.destroy();
        this.baseController = null;
      }
    });

    var fnTestPaging = function(assert, iIndex, iGrowingThreshold, sTestDescr) {
      assert.equal(
        this.baseController.getModel("testModel").getProperty("/currentIndex"),
        iIndex,
        "The current index was updated correctly - " + sTestDescr
      );

      assert.deepEqual(
        this.baseController.getModel("testModel").getProperty("/currentData"),
        this.baseController
          .getModel("testModel")
          .getProperty("/data")
          .slice(iIndex, iIndex + iGrowingThreshold),
        "The current array is correct - " + sTestDescr
      );
    };

    QUnit.test("Move a single row", function(assert) {
      this.baseController.tablePagePass("testModel", 1);
      fnTestPaging.call(this, assert, 1, 3, "Advance a row");

      this.baseController.tablePagePass("testModel", -1);
      fnTestPaging.call(this, assert, 0, 3, "Move back a row");
    });

    QUnit.test("Move a page", function(assert) {
      this.baseController.tablePagePass("testModel", "pageDown");
      fnTestPaging.call(this, assert, 3, 3, "Advance a page");

      this.baseController.tablePagePass("testModel", "pageDown");
      fnTestPaging.call(this, assert, 4, 3, "Advance a page and overflow");

      this.baseController.tablePagePass("testModel", "pageUp");
      fnTestPaging.call(this, assert, 1, 3, "Move back a page");

      this.baseController.tablePagePass("testModel", "pageUp");
      fnTestPaging.call(this, assert, 0, 3, "Move back a page and overflow");
    });

    QUnit.test("Move to the end and the beginning", function(assert) {
      this.baseController.tablePagePass("testModel", "end");
      fnTestPaging.call(this, assert, 4, 3, "Move to the end");

      this.baseController.tablePagePass("testModel", "begin");
      fnTestPaging.call(this, assert, 0, 3, "Move back to the beginning");
    });

    var fnTestIndex = function(assert, iIndex, iGrowingThreshold, sTestDescr) {
      fnTestPaging.call(this, assert, iIndex, iGrowingThreshold, sTestDescr);
      assert.ok(
        this.setValueSpy.calledWith(iIndex + 1),
        "The input value was set correctly - " + sTestDescr
      );
    };

    QUnit.test("Move to a specified index", function(assert) {
      this.setValueSpy = sinon.spy();

      this.baseController.onTypeTableCurrentIndex(
        {
          getParameter: function() {
            return "3";
          },
          getSource: function() {
            return {
              setValue: this.setValueSpy
            };
          }.bind(this)
        },
        "testModel"
      );

      fnTestIndex.call(this, assert, 2, 3, "Move to a normal index");
      this.setValueSpy.reset();

      this.baseController.onTypeTableCurrentIndex(
        {
          getParameter: function() {
            return "asd";
          },
          getSource: function() {
            return {
              setValue: this.setValueSpy
            };
          }.bind(this)
        },
        "testModel"
      );

      fnTestIndex.call(
        this,
        assert,
        2,
        3,
        "Keep the index after an invalid value"
      );
      this.setValueSpy.reset();

      this.baseController.onTypeTableCurrentIndex(
        {
          getParameter: function() {
            return "437";
          },
          getSource: function() {
            return {
              setValue: this.setValueSpy
            };
          }.bind(this)
        },
        "testModel"
      );

      fnTestIndex.call(
        this,
        assert,
        4,
        3,
        "Move to the end after an overflowing value"
      );
      this.setValueSpy.reset();

      this.baseController.onTypeTableCurrentIndex(
        {
          getParameter: function() {
            return "0";
          },
          getSource: function() {
            return {
              setValue: this.setValueSpy
            };
          }.bind(this)
        },
        "testModel"
      );
      fnTestIndex.call(
        this,
        assert,
        0,
        3,
        "Move to the beginning after writing a zero"
      );
      this.setValueSpy.reset();
    });

    QUnit.module("BaseController - Fragment getter method", {
      beforeEach: function() {
        this.addDependentSpy = sinon.spy();
        this.controllerStub = sinon.stub(
          BaseController.prototype,
          "getView",
          function() {
            return {
              addDependent: this.addDependentSpy
            };
          }.bind(this)
        );
        this.baseController = new BaseController();
      },

      afterEach: function() {
        this.addDependentSpy = null;
        this.controllerStub.restore();
        this.baseController.destroy();
        this.baseController = null;
      }
    });

    QUnit.test("Check the fragment getter method", function(assert) {
      var oDialog = this.baseController.getFragment(
        "testFragment",
        "test.unit.app.base.TestFragment"
      );

      assert.ok(oDialog instanceof Dialog, "The getter returned a dialog");

      assert.ok(
        this.addDependentSpy.calledOnce &&
          this.addDependentSpy.calledWith(oDialog),
        "The popover was correctly added to the dependent aggregation in the view"
      );

      assert.equal(
        this.baseController.getFragment("testFragment"),
        oDialog,
        "The dialog was retrieved correctly using the reference to the property"
      );
    });
  }
);
