sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/services/ConfigHelper",
		"com/ssp/ocm/manage/declarations/app/base/BaseObject"
	],
	function (ConfigHelper, BaseObject) {
		"use strict";

		var oInstance;
		/**
		 * Module for executing the calls of the controllers to the backend server
		 * @exports com/ssp/ocm/manage/declarations/app/services/AjaxCaller
		 */
		var classSingleton = BaseObject.extend(
			"com.ssp.ocm.manage.declarations.app.services.AjaxCaller", {
				constructor: function (oConfigHelper) {
					// Make it possible to inject dependencies in unit tests
					if (oConfigHelper) {
						ConfigHelper = oConfigHelper;
					}

					//Call super constructor
					BaseObject.call(this);
				},
				/**
				 * Public method to perform an AJAX call with given parameters
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST case
				 * @param  {string} sTimeoutDuration          Timeout length
				 * @param  {string} sDataType                 Data format type
				 * @param  {array} aParamResponseHttpHeaders  Response headers to recover
				 * @param  {string} sAuth                     Basic auth user:pass base64 string
				 * @return {promise}                          Promise generated from ajax call
				 */
				requestAjax: function (
					sMethod,
					sUrl,
					oValues,
					sTimeoutDuration,
					sDataType,
					aParamResponseHttpHeaders,
					sAuth
				) {
					return this._doAjaxCall(
						sMethod.toUpperCase(),
						sUrl,
						oValues,
						sTimeoutDuration,
						sDataType,
						aParamResponseHttpHeaders,
						sAuth
					);
				},

				/**
				 * Public method to perform an AJAX call with given parameters
				 * @param  {string} sModel                   Model for odata calling
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST case
				 * @param  {array} oUrlParams                 URL Parameters
				 * @param  {array} aFilters                 Filters to apply
				 * @param  {array} eTag                       etag
				 * @param  {string} sAuth                     Basic auth user:pass base64 string
				 * @return {promise}                          Promise generated from ajax call
				 */
				requestOdata: function (
					sModel,
					sMethod,
					sUrl,
					oValues,
					oUrlParams,
					aFilters,
					eTag,
					sAuth
				) {
					return this._doOdataCall(
						sModel,
						sMethod,
						sUrl,
						oValues,
						oUrlParams,
						aFilters,
						eTag,
						sAuth
					);
				},

				/**
				 * Public method to perform an AJAX call with given parameters
				 * @param  {string} sModel                   Model for odata calling
				 * @param  {array} aParams                   contains every call and its parameters
				 * @param  {array} eTag                       etag
				 * @param  {string} sAuth                     Basic auth user:pass base64 string
				 * @return {promise}                          Promise generated from ajax call
				 */
				requestBatch: function (
					sModel,
					aParams,
					eTag,
					sAuth
				) {
					return this._doBatchCall(
						sModel,
						aParams,
						eTag,
						sAuth
					);
				},

				/* =========================================================== */
				/* begin: internal methods                                     */
				/* =========================================================== */

				/**
				 * Private method to perform an AJAX call with given parameters
				 * @param  {string} sModel                   Model for odata calling
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST case
				 * @param  {array} oUrlParams                 URL Parameters
				 * @param  {array} aFilters                 Filters to apply
				 * @param  {array} eTag                       etag
				 * @param  {string} sAuth                     Basic auth user:pass base64 string
				 * @return {promise}                          Promise generated from ajax call
				 */
				_doOdataCall: function (
					sModel,
					sMethod,
					sUrl,
					oValues,
					oUrlParams,
					aFilters,
					eTag
				) {
					aFilters = aFilters || [];
					oValues = oValues || "";
					oUrlParams = oUrlParams || {};

					return new Promise(function (resolve, reject) {
						if (!window.navigator.onLine) {
							//Send NO NETWORK available
							reject({
								id: "NO_NETWORK",
								error: {}
							});
						} else {
							var aCallParams = [sUrl, {
								success: function (oResponse) {
									//Send response
									resolve(oResponse);
								},
								error: function (oError) {
									//Send complete error to evaluate what to do
									reject(oError);
								},
								filters: aFilters,
								urlParameters: oUrlParams,
								eTag: eTag
							}];

							if (sMethod === "create" || sMethod === "update") {
								aCallParams.splice(1, 0, oValues);
							}

							this.getOwnerComponent().getModel(sModel)[sMethod].apply(this.getOwnerComponent().getModel(sModel), aCallParams);

						}
					}.bind(this));
				},

				/**
				 * Private method to perform an AJAX call with given parameters
				 * @param  {string} sMethod                   HTTP call method
				 * @param  {string} sUrl                      URL to call
				 * @param  {object} oValues                   Data to send in POST case
				 * @param  {string} sTimeoutDuration          Timeout length
				 * @param  {string} sDataType                 Data format type
				 * @param  {array} aParamResponseHttpHeaders  Response headers to recover
				 * @param  {string} sAuth                     Basic auth user:pass base64 string
				 * @return {promise}                          Promise generated from ajax call
				 */
				_doAjaxCall: function (
					sMethod,
					sUrl,
					oValues,
					sTimeoutDuration,
					sDataType,
					aParamResponseHttpHeaders,
					sAuth
				) {
					sDataType = sDataType || "json";
					oValues = oValues || "";
					sTimeoutDuration = sTimeoutDuration || "long";

					var sContentType = "";
					if (sDataType === "json") {
						sContentType = "application/json; charset=UTF-8";
					} else if (sDataType === "xml") {
						sContentType = "application/xml; charset=UTF-8";
					}

					var oFormattedValues;
					if (oValues instanceof Blob || !oValues) {
						oFormattedValues = oValues;
					} else if (typeof oValues === "string" || sDataType === "form") {
						oFormattedValues = oValues;
					} else {
						oFormattedValues = JSON.stringify(oValues);
					}

					var oHeaders = {};

					if (sDataType && sDataType !== "form") {
						oHeaders["Content-Type"] = sContentType;
					}

					if (sAuth) {
						oHeaders.Authorization = "Basic " + sAuth;
					}

					return new Promise(function (resolve, reject) {
						if (!navigator.onLine) {
							//Send NO NETWORK available
							reject({
								id: "NO_NETWORK",
								error: {}
							});
						} else {
							jQuery.ajax({
								cache: false,
								crossDomain: false,
								timeout: ConfigHelper.getInstance().getTimeout(
									sTimeoutDuration
								),
								type: sMethod,
								url: sUrl,
								headers: oHeaders,
								contentType: sDataType === "form" ?
									false : "application/x-www-form-urlencoded; charset=UTF-8",
								dataType: sDataType !== "raw" ? "json" : "text",
								processData: false,
								data: oFormattedValues,
								success: function (response, textStatus, jqXHR) {
									if (jqXHR.getResponseHeader("com.sap.cloud.security.login")) {
										// publish message in the event manager
										var oEventBus = sap.ui.getCore().getEventBus();
										oEventBus.publish("xpr:ajaxCaller", "sessionTimeout", {});
										//Generation of an orphaned promise
										return;
									}

									//Only takes into account if service wants to receive some HTTP Response Header
									if (aParamResponseHttpHeaders) {
										var oParamValueReponseHttpHeaders = {};

										//Add http response header in a special attribute of retrieved data
										aParamResponseHttpHeaders.forEach(function (
											sParamResponseHttpHeader
										) {
											var sValueResponseHeader = jqXHR.getResponseHeader(
												sParamResponseHttpHeader
											);
											if (sValueResponseHeader) {
												oParamValueReponseHttpHeaders[
													sParamResponseHttpHeader
												] = sValueResponseHeader;
											}
										});

										if (oParamValueReponseHttpHeaders) {
											response.responseHttpHeaders = oParamValueReponseHttpHeaders;
										}
									}
									//Send response
									resolve(response);
								},
								error: function (jqXHR, textStatus) {
									if (textStatus === "timeout") {
										//Send TIMEOUT obtained
										reject({
											id: "TIMEOUT",
											error: {}
										});
									} else {
										//Send complete error to evaluate what to do
										reject({
											id: "HTTP_ERROR",
											error: jqXHR
										});
									}
								}
							});
						}
					});
				},

				/**
				 * Public method to perform an AJAX call with given parameters
				 * @param  {string} sModel                   Model for odata calling
				 * @param  {array} aParams                   contains every call and its parameters
				 * @param  {array} eTag                       etag
				 * @return {promise}                          Promise generated from ajax call
				 */
				_doBatchCall: function (
					sModel,
					aParams,
					eTag
				) {
					this.getOwnerComponent().getModel(sModel).setDeferredGroups([aParams.batchGroupId]);

					var aAllPromises = [];
					for (var i = 0; i < aParams.batchReadOps.length; i++) {
						// eslint-disable-next-line no-loop-func
						var oNewPromise = new Promise(function (resolve, reject) {
							if (!window.navigator.onLine) {
								//Send NO NETWORK available
								reject({
									id: "NO_NETWORK",
									error: {}
								});
							} else {
								var aCallParams = [aParams.batchReadOps[i].url, {
									success: function (oResponse) {
										//Send response
										resolve(oResponse);
									},
									error: function (oError) {
										//Send complete error to evaluate what to do
										reject({
											id: "HTTP_ERROR",
											error: oError
										});
									},
									filters: aParams.batchReadOps[i].params.filters ? aParams.batchReadOps[i].params.filters : [],
									urlParameters: aParams.batchReadOps[i].params.urlParams ? aParams.batchReadOps[i].params.urlParams : {},
									eTag: eTag,
									groupId: aParams.batchGroupId
								}];

								this.getOwnerComponent().getModel(sModel).read.apply(this.getOwnerComponent().getModel(sModel), aCallParams);
							}
						}.bind(this));
						aAllPromises.push(oNewPromise);
					}
					this.getOwnerComponent().getModel(sModel).submitChanges({
						groupId: aParams.batchGroupId
					});
					this.getOwnerComponent().getModel(sModel).setDeferredGroups([]);
					return Promise.all(aAllPromises);
				}
			}
		);

		return {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @param {object} oConfigHelper If not null, it will replace config helper. Use only for unit testing.
			 * @return {com.ssp.ocm.manage.declarations.app.services.AjaxCaller} The AjaxCaller instance
			 */
			getInstance: function (oConfigHelper) {
				if (!oInstance) {
					oInstance = new classSingleton(oConfigHelper);
				}
				return oInstance;
			}
		};
	}
);