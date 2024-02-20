sap.ui.define(["sap/ui/base/Object"], function(Object) {
  "use strict";
  return Object.extend(
    "com.ssp.ocm.manage.declarations.app.domain.DeclarationHeader",
    {
      constructor: function() {
        this.items = [];
      }
    }
  );
});
