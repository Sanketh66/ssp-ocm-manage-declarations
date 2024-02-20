// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.TenderTotalItem", {
			constructor: function (data, bGroup) {
				if (data) {
					this.Date = data.datum;
					this.Site = data.site;
					this.SiteDesc = data.Site_desc;
					this.Cashier = data.Cashier;
					this.CashierDesc = data.Cashier_name;

					this.Sales = Number(data.total_dmbtr).toFixed(2); 
					this.Declared = Number(data.open_dmbtr).toFixed(2);
					this.Conv_Declared = data.conv_ambtr;
					this.Declared_Total = data.conv_dmbtr;
					this.Variance = Number(data.total_open).toFixed(2);
					this.LocalCurr = data.local_curr;
					this.ExchangeRate = data.exchange_rate;
					this.Local_Currency = data.Local_Currency;
					this.TenderTypeDescription = data.TenderTypeDescription;
					


					this.Status = isNaN(parseInt(data.status, 10)) ? -1 : parseInt(data.status, 10); //there is nothing expected to be -1 in the status text list
					this.TenderFlag = data.var_tt;

					this.TenderType = bGroup ? parseInt(data.tendergroup, 10) : parseInt(data.tendertype, 10); 
					this.isTenderGroup = bGroup;
				}
			},

			/**
			 * Returns a new SiteItem fully copied
			 * @returns {TenderTotalItem} new declaration item.
			 */
			clone: function () {
				return $.extend(true, {}, this);
			}
		}
	);
});