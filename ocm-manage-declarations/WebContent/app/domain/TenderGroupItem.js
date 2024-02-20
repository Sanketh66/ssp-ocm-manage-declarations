// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.TenderGroupItem", {
			constructor: function (data) {
				if (data) {
					this.TenderTypeGroup = isNaN(parseInt(data.TenderTypeGroup, 10)) ? -1 : parseInt(data.TenderTypeGroup, 10);
					this.Language = data.Language;
					this.Description = data.TenderTypeGroupDescription;
				}
			},

			/**
			 * Returns a new SiteItem fully copied
			 * @returns {TenderGroupItem} new declaration item.
			 */
			clone: function () {
				return $.extend(true, {}, this);
			}
		}
	);
});