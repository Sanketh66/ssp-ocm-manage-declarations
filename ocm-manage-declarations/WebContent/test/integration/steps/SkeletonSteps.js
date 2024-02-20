sap.ui.define(["sap/ui/test/gherkin/StepDefinitions"], function(
  StepDefinitions
) {
  "use strict";

  var Steps = StepDefinitions.extend("test.integration.steps.Skeleton", {
    init: function() {
      // Arrangements
      this.register(/^I look at the screen$/i, function(Given, When) {
        When.onTheMainPage.iLookAtTheScreen();
      });

      // Actions
      this.register(
        /^I enter the Serial Number "(.*?)" in the input$/i,
        function(sText, Given, When) {
          When.onTheMainPage.iEnterSomeTextInTheSerialNumberInput(sText);
        }
      );

      this.register(/^I press the Show button$/i, function(Given, When) {
        When.onTheMainPage.iPressTheShowButton();
      });

      this.register(/^I press the Close button$/i, function(Given, When) {
        When.onTheMainPage.iPressTheCloseButton();
      });

      // Assertions
      this.register(/^I can see the text "(.*?)" on the page$/i, function(
        sText,
        Given,
        When,
        Then
      ) {
        Then.onTheMainPage.iShouldSeeTheMainPageText(sText);
      });

      this.register(/^I can see the product data dialog$/i, function(
        Given,
        When,
        Then
      ) {
        Then.onTheMainPage.iCanSeeADialog("product_data_dialog");
      });

      this.register(/^the dialog has the product data$/i, function(
        Given,
        When,
        Then
      ) {
        Then.onTheMainPage.iShouldSeeTheProductDataText();
      });

      this.register(/^the dialog has the title "(.*?)"$/i, function(
        sText,
        Given,
        When,
        Then
      ) {
        Then.onTheMainPage.theDialogHasTheTitle(sText);
      });

      this.register(/^the dialog closes$/i, function(Given, When, Then) {
        Then.onTheMainPage.iCannotSeeADialog("product_data_dialog");
      });
    }
  });

  return Steps;
});
