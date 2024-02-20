sap.ui.define(
	[
		"sap/ui/model/json/JSONModel",
		"com/ssp/ocm/manage/declarations/app/base/BaseObject"
	],
	function (JSONModel, BaseObject) {
		"use strict";

		var oInstance;
		/**
		 * Module for extracting configuration values from the config.json file
		 * @exports com/ssp/ocm/manage/declarations/app/services/ConfigHelper
		 */
		var oClassInstance = BaseObject.extend(
			"com.ssp.ocm.manage/declarations.app.services.ConfigHelper", {
				/* =========================================================== */
				/* begin: public methods                                     */
				/* =========================================================== */

				/**
				 * Get access to config model from "config.json" file
				 * @public
				 * @return {[type]} [description]
				 */
				constructor: function () {
					//Call super constructor
					BaseObject.call(this);

					//Load config json
					var oConfigModel = new JSONModel();
					oConfigModel.loadData(
						jQuery.sap.getModulePath(
							"com.ssp.ocm.manage/declarations",
							"/config.json"
						),
						"",
						false
					);

					this._oConfigData = oConfigModel.getData();

					//Build url base
					this._buildUrlBase();
				},

				/**
				 * Get working mode.
				 * @public
				 * @return {string} Working mode
				 */
				getWorkingMode: function () {
					return this._oConfigData.mode;
				},

				/**
				 * Return semantic timeout: short, medium & long
				 * @public
				 * @param {string} sTimeoutDuration Timeout duration: "short", "medium" & "long"
				 * @return {number} semantic timeout: short, medium & long
				 */
				getTimeout: function (sTimeoutDuration) {
					return this._oConfigData.timeout[sTimeoutDuration];
				},

				// /**
				//  * Return an info object with all data needed to call the Product Data API Endpoint
				//  * @public
				//  * @return {object} The product data info object
				//  */
				// getProductDataInfo: function() {
				//   return this._getCallData("productData", "GetProductData");
				// },

				/**
				 * Return an object with HTTP `method` and `url` to call the
				 * general parameters service.
				 * @public
				 * @param {String} sParameter Parameter name in the General service
				 * @return {object} The non working days data info object
				 */
				getGeneralData: function (sParameter) {
					return this._getCallData("generalData", "GetGeneralData", [
						encodeURIComponent(sParameter)
					]);
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getSitesSummaryData: function () {
					return this._getCallData("SitesSummaryData", "GetSitesSummary");
				},

				getDefaultTenderData: function () {
					return this._getCallData("DefaultTenderData", "GetDefault");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getCashierListData: function () {
					return this._getCallData("CashierListData", "GetCashiers");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getStatusData: function () {
					return this._getCallData("StatusData", "GetStatus");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getTenderGroupData: function () {
					return this._getCallData("TenderGroupData", "GetGroup");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getFloatData: function () {
					return this._getCallData("FloatData", "GetFloat");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getBagData: function () {
					return this._getCallData("BagData", "GetBag");
				},

				getAmendData: function () {
					return this._getCallData("AmendData", "AmendDec");
				},

				getUserStatusData: function () {
					return this._getCallData("UserStatus", "GetUserStatus");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getTenderTypesData: function () {
					return this._getCallData("TenderTypesData", "GetTender");
				},

				/**
				 * Return an info object with all data needed to call the Demand Overview API Endpoint
				 * @public
				 * @return {object} The product data info object
				 */
				getCashierData: function () {
					return this._getCallData("CashierData", "GetCashier");
				},

				/**
				 * @public
				 * @param {String} sParameter Parameter name in the General service
				 * @return {object} The non working days data info object
				 */
				getLogout: function () {
					var oConfig = this._oConfigData.urls;
					return {
						url: oConfig.logout.path,
						method: oConfig.logout.DoLogout.method
					};
				},

				/**
				 * Returns url of the logout page, redirecting to the login page afterwards
				 * @returns {String} URL of the logout page.
				 */
				getLogoutPage: function () {
					var oConfig = this._oConfigData.urls;
					return oConfig.logout.page;
				},

				/**
				 * @return {String} Path to the application in the Fiori Launchpad, without domain
				 */
				getApplicationPath: function () {
					return this._oConfigData.urls.applicationPath;
				},

				/**
				 * Get common url path and local auth for app
				 * @public
				 * @return {object} Get common context path and local auth
				 */
				getCommonPath: function () {
					return this._oConfigData.urls.path;
				},

				/**
				 * Returns the base backend path
				 * @return {string} The base backend path
				 */
				getBasePath: function () {
					return this._oConfigData.urls.path;
				},

				/* =========================================================== */
				/* begin: internal methods                                     */
				/* =========================================================== */

				/**
				 * Return url base calculated at initialization of object
				 * @private
				 * @return {string} url based on system
				 */
				_getUrlBase: function () {
					return this._sUrlBase;
				},

				/**
				 * Get an url like "https://<host>:port" based on working mode and system
				 * configuration.
				 *
				 * When "sMode" internally configured to use "relative" mode,
				 * then it is not necessary to build absolute URL, so empty string is
				 * returns.
				 *
				 * Method save "urlBase" built at "_sUrlBase".
				 *
				 * @private
				 * @return {string} The base url
				 */
				_buildUrlBase: function () {
					var sMode = this._oConfigData.mode,
						sHttps = this._oConfigData.https === "true" ? "https" : "http",
						oSystems = this._oConfigData.environments;

					switch (sMode) {
						case "relative":
						case "local":
							this._sUrlBase = "";
							break;

						default:
							if (!sMode) {
								sMode = "dev";
							}

							var oEnvironmentInfo = oSystems[sMode],
								sHostname = oEnvironmentInfo.host,
								sPort = oEnvironmentInfo.port;

							this._sUrlBase = sHttps + "://" + sHostname + ":" + sPort;

							break;
					}
				},

				/**
				 * Get specific url path and mehod call
				 * @private
				 * @param {string} sApiPath The API path
				 * @param {string} sApiMethod The HTTP Method
				 * @param {array} aParams The array of parameters
				 * @return {object} Get API Method specific context path and http method
				 */
				_getCallData: function (sApiPath, sApiMethod, aParams) {
					var sContextPath = "";
					sContextPath = this._oConfigData.urls[sApiPath].path;

					//If there are given parameters then apply it on url
					if (aParams) {
						for (var i in aParams) {
							if (aParams.hasOwnProperty(i)) {
								sContextPath =
									sContextPath.split(/\$(.+)/)[0] +
									aParams[i] +
									sContextPath.split(/\$(.+)/)[1];
							}
						}
					}
					//Delete possible unnecesary param placeHolders
					if (sContextPath.indexOf("$") !== -1) {
						sContextPath = sContextPath.split("$")[0];
					}

					var sMethod = "";
					sMethod = this._oConfigData.urls[sApiPath][sApiMethod].method;
					return {
						method: sMethod,
						url: this.getCommonPath() + sContextPath
					};
				}
			}
		);

		return {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @return {com.xpr.test.app.app.services.ConfigHelper} ConfigHelp singleton instance
			 */
			getInstance: function () {
				if (!oInstance) {
					oInstance = new oClassInstance();
				}
				return oInstance;
			}
		};
	}
);