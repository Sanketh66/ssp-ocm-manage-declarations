sap.ui.define(["sap/ui/test/Opa5", "test/integration/fakeServer"], function(
  Opa5,
  fakeServer
) {
  "use strict";

  var Common = Opa5.extend("test.integration.arrangements.Common", {
    iStartMyApp: function() {
      fakeServer.stop();
      fakeServer.start();
      return this.iStartMyUIComponent({
        componentConfig: {
          name: "com.ssp.ocm.manage.declarations"
        },
        autoWait: true,
        // testing deeplinks is possible by setting a hash
        hash: ""
      });
    }
  });

  return Common;
});
