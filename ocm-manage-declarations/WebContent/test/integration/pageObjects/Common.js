sap.ui.define(
  ["sap/ui/test/Opa5", "sap/ui/test/matchers/PropertyStrictEquals"],
  function(Opa5, PropertyStrictEquals) {
    "use strict";

    return Opa5.extend("test.integration.pageObjects.Common", {
      //You can have some utility functionality for all Page Objects deriving from it
      // Arrangements
      iLookAtTheScreen: function() {
        return this;
      },

      // Actions
      iEnterTextInInput: function(sId, sViewName, sText, bDialog) {
        return this.waitFor({
          id: sId,
          viewName: sViewName,
          searchOpenDialogs: bDialog,
          controlType: "sap.m.Input",
          success: function(oInput) {
            oInput.setValue(sText);
          }
        });
      },

      iPressAButton: function(sId, sViewName, bDialog) {
        return this.waitFor({
          id: sId,
          viewName: sViewName,
          searchOpenDialogs: bDialog,
          controlType: "sap.m.Button",
          success: function(oButton) {
            if (oButton.forEach) {
              oButton.forEach(function(ob) {
                ob.$().trigger("tap");
              });
            } else {
              oButton.$().trigger("tap");
            }
          }
        });
      },

      // Assertions
      iShouldSeeTheText: function(sId, sViewName, sText, bDialog) {
        return this.waitFor({
          id: sId,
          viewName: sViewName,
          searchOpenDialogs: bDialog,
          controlType: "sap.m.Text",
          success: function(oText) {
            if (oText.length && oText.length === 1) {
              oText = oText[0];
            }
            Opa5.assert.strictEqual(oText.getText(), sText);
          }
        });
      },

      iCanSeeADialog: function(sId) {
        return this.waitFor({
          id: sId,
          controlType: "sap.m.Dialog",
          success: function(oDialog) {
            Opa5.assert.ok(oDialog.isOpen(), "Dialog is open");
          }
        });
      },

      iCannotSeeADialog: function(sId) {
        return this.waitFor({
          visible: false,
          id: sId,
          controlType: "sap.m.Dialog",
          check: function(oDialog) {
            return !oDialog.isOpen();
          },
          success: function() {
            Opa5.assert.ok(true, "Dialog is closed");
          }
        });
      },

      theDialogHasTheTitle: function(sTitle) {
        return this.waitFor({
          controlType: "sap.m.Dialog",
          matchers: new PropertyStrictEquals({
            name: "title",
            value: sTitle
          })
        });
      }
    });
  }
);
