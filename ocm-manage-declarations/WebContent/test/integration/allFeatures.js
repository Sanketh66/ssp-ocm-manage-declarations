sap.ui.require(
  [
    "jquery.sap.global",
    "sap/ui/test/Opa5",
    "sap/ui/test/gherkin/opa5TestHarness",
    "test/integration/fakeServer",
    "test/integration/arrangements/Common",
    "test/integration/steps/SkeletonSteps",
    "test/integration/pageObjects/MainPage"
  ],
  function($, Opa5, opa5TestHarness, fakeServer, Common, SkeletonSteps) {
    "use strict";

    Opa5.extendConfig({
      viewNamespace: "com.ssp.ocm.manage.declarations.view.",
      arrangements: new Common()
    });

    opa5TestHarness.test({
      featurePath: "test.integration.Skeleton",
      steps: SkeletonSteps,
      generateMissingSteps: true
    });
  }
);
