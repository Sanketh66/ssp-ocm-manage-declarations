// eslint
sap.ui.define(["sap/ui/base/Object"], function(Object) {
        "use strict";
        return Object.extend(
          "com.ssp.ocm.manage.declarations.app.domain.StatusItem",
          {
            constructor: function(data) {
              if (data) {
                this.StatusID = parseInt(data.DeclarationStatusID, 10);
                this.Language = data.Language;
                this.Description = data.DeclarationDescription;
              }
            },
      
            /**
             * Returns a new SiteItem fully copied
             * @returns {StatusItem} new declaration item.
             */
            clone: function() {
              return $.extend(true,{},this);
            }
          }
        );
      });
      