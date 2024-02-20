// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.TenderTypeItem", {
			constructor: function (data) {
				if (data) {
					this.TenderType = isNaN(parseInt(data.TenderType, 10)) ? -1 : parseInt(data.TenderType, 10);
					this.TenderTypeGroup = data.TenderGroup;
					this.Description = data.TenderTypeDescription;
					this.Language = data.Language;
				}
			},

			/**
			 * Returns a new SiteItem fully copied
			 * @returns {TenderTypeItem} new declaration item.
			 */
			clone: function () {
				return $.extend(true, {}, this);
			}
		}
	);
});