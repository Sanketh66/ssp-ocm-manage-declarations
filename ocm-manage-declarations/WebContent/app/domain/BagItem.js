sap.ui.define(
	[
		"sap/ui/base/Object"
	],
	function (Object) {
		"use strict";

		// A bag has a list of DeclarationItem(s) under .items
		return Object.extend("com.ssp.ocm.manage.declarations.app.domain.BagItem", {
			constructor: function (sBagNumber) {
				this.BagId = sBagNumber;
				this.TenderList = [];
			},

			setItems: function (aItems) {
				this.TenderList = aItems;
				this.TenderList.forEach(
					function (oItem) {
						oItem.BagId = this.BagId;
					}.bind(this)
				);
				return this;
			},

			getItems: function () {
				return this.TenderList;
			},

			pushItem: function (oItem) {
				oItem.BagId = this.BagId;
				oItem.Bagged = true;
				this.TenderList.push(oItem);
			},

			removeItem: function (iIndex) {
				this.TenderList.splice(iIndex, 1);
			}
		});
	}
);