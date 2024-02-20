sap.ui.require(
  [
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "com/ssp/ocm/manage/declarations/app/model/models"
  ],
  function(Device, JSONModel, models) {
    "use strict";
    QUnit.module("models - Device model tests");

    QUnit.test("The factory should create a device model correctly", function(
      assert
    ) {
      // Arrange
      var createJSONStub = sinon.stub(models, "createJSONModel", function(
        oData
      ) {
        return new JSONModel(oData);
      });

      // Act
      var deviceModel = models.createDeviceModel();

      // Assert
      assert.ok(deviceModel instanceof JSONModel, "A JSONModel was created");

      assert.equal(
        deviceModel.getData(),
        Device,
        "The data in the model is correct"
      );

      // Clean
      createJSONStub.restore();
    });

    QUnit.module("models - JSON model tests");

    QUnit.test("The factory should create a JSON Model correctly", function(
      assert
    ) {
      // Arrange
      var oData = {
        property1: "value1",
        property2: ["value2", 3]
      };

      // Act
      var jsonModel = models.createJSONModel(oData);

      // Assert
      assert.ok(jsonModel instanceof JSONModel, "A JSONModel was created");

      assert.equal(
        jsonModel.getData(),
        oData,
        "The data in the model is correct"
      );
    });
  }
);
