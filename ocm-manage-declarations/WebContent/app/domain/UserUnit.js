sap.ui.define(["sap/ui/base/Object"], function(UI5Object) {
  "use strict";

  return UI5Object.extend("com.ssp.ocm.manage.declarations.domain.UserUnit", {
    constructor: function(oBEUnit) {
      // BESite has the following fields:
      // UserID
      // UserSite
      // SiteDescription
      // Currency
      // Locked
      Object.keys(oBEUnit).forEach(
        function(k) {
          if (k !== "__metadata") {
            this[k] = oBEUnit[k];
          }
        }.bind(this)
      );
      // Generate an uppercase version of the name for case insensitive searches.
      this.SiteDescriptionCAPS = (this.SiteDescription || "").toUpperCase();
    }
  });
});
