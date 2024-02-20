sap.ui.require(["com/ssp/ocm/manage/declarations/view/amends/Amends.controller"], function(
  AmendsController
) {
  "use strict";

  QUnit.module("Amends Controller - Amends view initialization", {

    beforeEach: function() {

      // stub getOwnerComponent
      this.getOwnerComponentStub = sinon.stub(
        AmendsController.prototype,
        "getOwnerComponent",
        function() {
          return {
            getContentDensityClass: function() {
              return "testClass";
            }
          };
        }
      );

      // stub getGlobalModelProp
      this.getGlobalModelPropStub = sinon.stub(
        AmendsController.prototype,
        "getGlobalModelProp",
        function(sProp) {
          if (sProp === "/BaggedList") {
            return [{
              TenderList: [
                {
                  Amount: 10
                }
              ]
            }];
          }
          if (sProp === "/NonBaggedList") {
            return [
              {
                Amount: 20
              },
              {
                Amount: 0
              },
              {
                Amount: 30
              },
              {
                Amount: 40
              },
              {
                Amount: null
              },
              {
                Amount: undefined
              }

            ]
          }
          return [];
        }.bind(this)
      );

      // stub setGlobalModelProp
      this.setGlobalModelPropStub = sinon.stub(
        AmendsController.prototype,
        "setGlobalModelProp",
        function(sProp, sValue) {
          console.log(`setGlobalModelProp stub called`);
          this[sProp] = sValue;
        }.bind(this)
      );

      this.AmendsController = new AmendsController();
    },

    afterEach: function() {
      this.addStyleClassSpy = null;
      this.getGlobalModelPropStub.restore();
      this.getOwnerComponentStub.restore();
      this.AmendsController.destroy();
      this.AmendsController = null;
    }
  });


  QUnit.test("Test doRemoveBlankTenders", function(assert) {
    // this.AmendsController.onInit();

    // assert.ok(
    //   this.initAppViewModelStub.calledOnce,
    //   "The init app model method was called"
    // );

    // assert.ok(
    //   this.addStyleClassSpy.calledOnce &&
    //     this.addStyleClassSpy.calledWith("testClass"),
    //   "The content density class was added correctly"
    // );

    // stub getGlobalModelProp
    this.AmendsController.doRemoveBlankTenders();
    // read this.BaggedList and this.NonBaggedList

    assert.equal(this["/BaggedList"].length, 1, "BaggedList has the correct length");
    assert.equal(this["/NonBaggedList"].length, 4, "NonBaggedList has the correct length");
  });

  // QUnit.module("App Controller - App view model initialization", {
  //   beforeEach: function() {
  //     this.AmendsController = new AmendsController();
  //     this.busySpy = sinon.spy(function() {
  //       return 1000;
  //     });
  //     this.setModelSpy = sinon.spy(
  //       function(oModel, sName) {
  //         this.oViewModel = oModel;
  //         this.sModelName = sName;
  //       }.bind(this)
  //     );
  //     this.AmendsController.getView = function() {
  //       return {
  //         getBusyIndicatorDelay: this.busySpy
  //       };
  //     }.bind(this);
  //     this.AmendsController.getOwnerComponent = function() {
  //       return {
  //         setModel: this.setModelSpy
  //       };
  //     }.bind(this);
  //   },
  //   afterEach: function() {
  //     this.AmendsController.destroy();
  //   }
  // });

  // QUnit.test("The app view model is created successfully", function(assert) {
  //   this.AmendsController._initAppViewModel();
  //   assert.ok(
  //     this.busySpy.calledOnce,
  //     "The busy delay was obtained successfully"
  //   );
  //   assert.ok(
  //     this.setModelSpy.calledOnce,
  //     "The model was successfully sent to the component"
  //   );
  //   assert.deepEqual(
  //     this.oViewModel.getData(),
  //     { busy: false, delay: 1000 },
  //     "The model was created successfully"
  //   );
  //   assert.equal(
  //     this.sModelName,
  //     "appView",
  //     "The model name was set successfully"
  //   );
  // });

});
