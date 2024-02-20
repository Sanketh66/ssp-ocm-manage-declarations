// eslint
sap.ui.define(["sap/ui/base/Object"], function (Object) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.SiteItem", {
			constructor: function (oParam, sErrorType) {
				if (oParam) {
					this.type = this.getErrorType(sErrorType);
					this.active = true;

					if(this.type === "Success") {
						this.title = oParam.title;
						this.subtitle = oParam.subtitle;
						this.description = oParam.description;
					} else {
						this.title = oParam.message;
						this.subtitle = oParam.statusText;

						if (this.isXML(oParam)){
							var XMLParser = new DOMParser(),
								oXML;
							if(oParam.error) {
								oXML = XMLParser.parseFromString(oParam.error.responseText, "text/xml");
							} else if (oParam.responseText) {
								oXML = XMLParser.parseFromString(oParam.responseText, "text/xml");
							} 

							if(oXML) {
								this.description = oXML.getElementsByTagName('message')[0].innerHTML;
							} else {
								this.description = "Unknown error";
							}
							
						} else if (this.isJSON(oParam)){
							if (oParam.responseText) {
								this.description = JSON.parse(oParam.responseText).error.message.value;
							} else if(oParam.error) {
								this.description = JSON.parse(oParam.error.responseText).error.message.value;
							} else {
								this.description = "Unknown error";
							}
						} else {
							if (oParam.responseText) {
								this.description = oParam.responseText;
							} else if(oParam.error) {
								this.description = oParam.error.responseText;
							} else {
								this.description = "Unknown error";
							}
						}
					}
				}
			},

			isXML: function (oParam) {
				if (oParam.responseText.startsWith("<")) {
					return true;
				}
				return false;
			},

			isJSON: function (oParam) {
				if (oParam.responseText.startsWith("{")) {
					return true;
				}
				return false;
			},

			getErrorType: function (sErrorType) {
				switch (sErrorType) {
					case 'E': return "Error";
					case 'W': return "Warning";
					case 'S': return "Success";
					default: return 'Error';
				}
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