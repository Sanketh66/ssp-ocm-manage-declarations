sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function(
  JSONModel,
  Device
) {
  "use strict";

  /**
   * Model factory
   * @exports com/ssp/ocm/manage/declarations/app/model/models
   */
  return {
    /**
     * Wrap of standard sap.ui.Device object
     *
     * @return {sap.ui.Device} UI5 device object
     * @public
     */
    createDeviceModel: function() {
      var oModel = this.createJSONModel(Device);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    /**
     * Convenience method for creating a JSON Model
     * @public
     * @param {object} oData The model data
     * @returns {sap.ui.model.json.JSONModel} The JSON Model with the data
     */
    createJSONModel: function(oData) {
      return new JSONModel(oData);
    }
  };
});
