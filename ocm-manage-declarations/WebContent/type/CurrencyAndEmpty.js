//
// An extension of sap.ui.model.type.Currency that also allows empty string
// More info about custom types:
// https://blogs.sap.com/2016/09/16/custom-data-types-in-sapui5/
sap.ui.define([
  "sap/ui/model/type/Currency",
  "sap/ui/model/ValidateException"
], function (Currency, ValidateException) {
  "use strict";

  return Currency.extend("com.ssp.ocm.manage.declarations.type.CurrencyAndEmpty", {

      formatValue: function(vValue, sTargetType) {
          if (Array.isArray(vValue) && isNaN(vValue[0])) {
            return ""; // convert nan numbers into nothing
          }
          return Currency.prototype.formatValue.call(this, vValue, sTargetType);
      },

      // Converts string into internal representation (an array)
      parseValue: function(sValue, sSourceType) {
        if (sValue === "") {
            return [NaN, undefined];
        }
        return Currency.prototype.parseValue.call(this, sValue, sSourceType);
      },

      // checks if internal representation (an array) is OK
      // we also accept an array with a NaN in index 0
      validateValue: function(oValue) {
        return (Array.isArray(oValue) && oValue.length>=1 && isNaN(oValue[0])) || 
            Currency.prototype.validateValue.call(this, oValue);
      }

  });

});