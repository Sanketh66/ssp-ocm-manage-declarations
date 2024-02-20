// eslint
sap.ui.define(["sap/ui/base/Object"], function(Object) {
        "use strict";
        return Object.extend(
          "com.ssp.ocm.manage.declarations.app.domain.SiteItem",
          {
            constructor: function(data, aStatusList) {
              if (data) {
                this.Date = data.datum;
                this.Site = data.site;
                this.SiteDesc = data.Site_desc;
                this.Declared = data.open_dmbtr;
                this.Sales = data.total_dmbtr;
                this.Variance = data.total_open;
                this.VarianceDecimal = data.total_open_pos;
                this.TenderFlag = data.var_tt;
                this.CashierFlag = data.var_cash;
                this.VarianceFlag = data.var_site;
                this.StatusKey = isNaN(parseInt(data.status, 10)) ? -1 : parseInt(data.status, 10);
					      this.Status = this.getStatusText(this.StatusKey, aStatusList);
                //this.Status = isNaN(parseInt(data.status, 10)) ? 1 : parseInt(data.status, 10); //this is probably bad.
              }
            },

            getStatusText: function (iKey, aStatusList) {
              var oResult = aStatusList.find(function (oStatus) {
                return oStatus.StatusID === iKey;
              });
      
              return oResult ? oResult.Description : "";
            },
      
            /**
             * Returns a new SiteItem fully copied
             * @returns {SiteItem} new declaration item.
             */
            clone: function() {
              return $.extend(true,{},this);
            }
          }
        );
      });
      