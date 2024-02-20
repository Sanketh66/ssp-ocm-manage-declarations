sap.ui.define(["sap/ui/test/Opa5", "./Common"], function(Opa5, Common) {
  "use strict";

  Opa5.createPageObjects({
    onTheMainPage: {
      baseClass: Common,

      actions: {
        iEnterSomeTextInTheSerialNumberInput: function(sText) {
          //I can call some utility functionality from my common page object, serving as base class
          return this.iEnterTextInInput("skeleton_input", "main.Main", sText);
        },

        iPressTheShowButton: function() {
          return this.iPressAButton("skeleton_show_button", "main.Main");
        },

        iPressTheCloseButton: function() {
          return this.iPressAButton(null, "close_button", true);
        }
      },

      assertions: {
        iShouldSeeTheMainPageText: function(sText) {
          return this.iShouldSeeTheText("skeleton_text", "main.Main", sText);
        },

        iShouldSeeTheProductDataText: function() {
          return this.iShouldSeeTheText(null, null, "The data", true);
        }
      }
    }
  });
});
