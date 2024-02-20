// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.SiteItem", {
			constructor: function (data, aStatusList) {
				if (data) {
					this.DecId = data.decid;
					this.Site = data.site;
					this.SiteDesc = data.Site_desc;
					this.Cashier = data.cashier;
					this.CashierDesc = data.Cashier_name;
					this.Date = data.datum;
					this.TenderFlag = data.var_tt;
					this.CashierFlag = data.var_cash;
					this.Sales = Number(data.total_dmbtr); 
					this.Declared = Number(data.open_dmbtr);
					this.Variance = Number(data.total_open);
					this.StatusKey = isNaN(parseInt(data.status, 10)) ? -1 : parseInt(data.status, 10);
					this.Status = this.getStatusText(this.StatusKey, aStatusList);
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
			clone: function () {
				return $.extend(true, {}, this);
			}
		}
	);
});