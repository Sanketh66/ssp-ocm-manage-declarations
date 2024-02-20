// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.TenderItem", {
			constructor: function (data) {
				if (data) {
					/* this.Date = data.datum;
					this.Site = data.site;
					this.Cashier = data.cashier; */

					this.Amount = isNaN(parseFloat(data.amount)) ? 
								parseFloat(0).toFixed(2) 
								: 
								parseFloat(data.amount).toFixed(2);

					this.TenderType = isNaN(Number(data.tendertype)) ? 
								Number(data.tenderType) 
								: 
								Number(data.tendertype);

					this.TenderGroup = data.tenderGroup;


					this.TenderTypeDescription = data.tenderTypeDescription;

					this.Currency = data.local_curr ? data.local_curr : data.currencyCode ? data.currencyCode : "EUR";

					this.BagId = data.bagid ? data.bagid : "";
					this.Bagged = this.BagId ? true : false;
				}
			},

			/**
			 * Returns a new SiteItem fully copied
			 * @returns {TenderItem} new declaration item.
			 */
			clone: function () {
				return $.extend(true, {}, this);
			}
		}
	);
});