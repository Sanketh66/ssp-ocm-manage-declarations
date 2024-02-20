/* eslint-disable no-extra-parens */
sap.ui.define(
	[
		"sap/ui/model/json/JSONModel",
		"com/ssp/ocm/manage/declarations/app/services/ConfigHelper",
		"com/ssp/ocm/manage/declarations/app/services/AjaxCaller",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/app/base/BaseObject",
		"com/ssp/ocm/manage/declarations/app/utils/dates",
		"com/ssp/ocm/manage/declarations/app/domain/DeclarationItem",
		"com/ssp/ocm/manage/declarations/app/domain/DeclarationHeader",
		"com/ssp/ocm/manage/declarations/app/domain/DeclarationHeaderList",
		"com/ssp/ocm/manage/declarations/app/domain/UserTender",
		"com/ssp/ocm/manage/declarations/app/domain/UserUnit",
		"com/ssp/ocm/manage/declarations/app/domain/CashierItem",
		"com/ssp/ocm/manage/declarations/app/domain/StatusItem",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	],
	function (
		JSONModel,
		ConfigHelper,
		AjaxCaller,
		formatter,
		BaseObject,
		dates,
		DeclarationItem,
		DeclarationHeader,
		DeclarationHeaderList,
		UserTender,
		UserUnit,
		CashierItem,
		StatusItem,
		Filter,
		FilterOperator
	) {
		"use strict";

		var oInstance;
		/**
		 * Module for managing the calls of the controllers to the backend server
		 * (input/output mapping, methods...)
		 * @exports com/ssp/ocm/manage/declarations/app/services/ApiFacade
		 */
		var classSingleton = BaseObject.extend(
			"com.ssp.ocm.manage/declarations.app.services.ApiFacade", {
				/**
				 * Shared app formatter
				 * @type {com.ssp.ocm.manage/declarations.app.utils.formatter}
				 */
				formatter: formatter,

				constructor: function () {
					//Call super constructor
					BaseObject.call(this);
				},

				getGlobalModel: function (sModelName) {
					return sModelName ? this.getOwnerComponent().getModel(sModelName) : this.getOwnerComponent().getModel();
				},

				getGlobalModelProp: function (sProp, sModelName) {
					var oModel = sModelName ? this.getOwnerComponent().getModel(sModelName) : this.getOwnerComponent().getModel();
					return oModel.getProperty(sProp);
				},

				getSitesSummaryList: function () {
					// TODO: SSPFI-17537
					// return a promise
					var oConfig = ConfigHelper.getInstance().getSitesSummaryData();
					return AjaxCaller.getInstance()
						.requestOdata("ManageModel", oConfig.method, oConfig.url)
						.then(function (oResult) {
							return oResult;
						});
				},

				getStatusList: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getStatusData();
					return AjaxCaller.getInstance()
						.requestOdata("GeneralModel", oConfig.method, oConfig.url)
						.then(function (oResult) {
							return oResult;
						});
				},

				getTenderGroupList: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getTenderGroupData();
					return AjaxCaller.getInstance()
						.requestOdata("UserModel", oConfig.method, oConfig.url)
						.then(function (oResult) {
							return oResult;
						});
				},

				getTenderTypesList: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getTenderTypesData();
					return AjaxCaller.getInstance()
						.requestOdata("UserModel", oConfig.method, oConfig.url, {}, {
							"$select" : "TenderType,Language,TenderGroup,TenderTypeDescription"
						})
						.then(function (oResult) {
							return oResult;
						});
				},

				getCashierData: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getCashierData();

					return AjaxCaller.getInstance()
						.requestOdata("ManageModel", 
							oConfig.method, 
							oConfig.url, 
							{}, 
							{
								"$expand" : "to_tt"
							}, 
							this.generateCashierFilters())
						.then(function (oResult) {
							return oResult;
						});
				},

				getBagValue: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getBagData();

					return AjaxCaller.getInstance()
						.requestOdata("ManageModel", 
								oConfig.method, 
								oConfig.url,
								{},{},
								this.generateBagsFilters())
						.then(function (oResult) {
							return oResult;
						});
				},

				/**
				 * 
				 * @returns 
				 */
				generateBagsFilters: function () {
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
					// TODO: remove this once stable. On the 17/06/2022 we changed the keys to the bags: 
					// -> We now read by decid, not site/date/cashier
					// var oSiteFilter = {}, oCashierFilter = {};
					// oSiteFilter = new Filter("site", FilterOperator.EQ, oSelectedCashier.Site);
					// oCashierFilter = new Filter("cashier", FilterOperator.EQ, oSelectedCashier.Cashier);
					// return [this.getDateStartEnd(oSelectedCashier), oSiteFilter, oCashierFilter];
					let oDecidFilter = new Filter("decid", FilterOperator.EQ, oSelectedCashier.DecId)
					return [oDecidFilter];
				},

				/**
				 * 
				 * @returns 
				 */
				getFloatValue: function () {
					// TODO: SSPFI-17537
					// return a promise
					var oConfig = ConfigHelper.getInstance().getFloatData();

					return AjaxCaller.getInstance()
						.requestOdata("ManageModel", 
								oConfig.method, 
								oConfig.url + this.generateFloatFilters())
						.then(function (oResult) {
							return oResult;
						});
				},

				/**
				 * Returns a string of the form "(decid='1234')" where 1234 is the declaration Id.
				 * @returns String with the OData filter query
				 */
				generateFloatFilters: function () {
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
					var sFilter = `(decid='${oSelectedCashier.DecId}')`;
					return sFilter;

					// TODO: remove this once stable. On the 17/06/2022 we changed the keys to the bags: 
					// -> We now read by decid, not site/date/cashier
					// sFilter = "(site='{0}',cashier='{1}',datum=datetime'{2}')",
					// oDate = this._changeDatesFromGMT(oSelectedCashier.Date),
					// sDate = encodeURIComponent(oDate.toISOString().substr(0, oDate.toISOString().length-5));
					// sFilter = sFilter.replace('{0}', oSelectedCashier.Site);
					// sFilter = sFilter.replace('{1}', oSelectedCashier.Cashier);
					// sFilter = sFilter.replace('{2}', sDate);
					// return sFilter;
				},

				/**
				 * Returns a promise to the minimum declaration date value
				 * @returns {Promise} Promise to a Date instance N days in the past
				 */
				getHistoryList: function () {
					var oConfigHelper = ConfigHelper.getInstance();
					// return a promise
					var oConfig = oConfigHelper.getGeneralData(
						"'DEFAULT_LIST_HISTORY'" /* parameter name */
					);
					return AjaxCaller.getInstance()
						.requestOdata("GeneralModel", oConfig.method, oConfig.url)
						.then(function (oResult) {
							return oResult;
						});
				},

				/**
				 * 
				 */
				getCashierList: function (bReload, dDateStart, dDateEnd) {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getCashierListData();

					return AjaxCaller.getInstance()
						.requestOdata("ManageModel", 
							oConfig.method, 
							oConfig.url, 
							{}, 
							{}, 
							this.generateCashierListFilters(bReload, dDateStart, dDateEnd))
						.then(function (oResult) {
							oResult.results = oResult.results.sort((a ,b) => b.datum - a.datum)
							return oResult;
						});
				},


				/**
				 * Reads ZC_OCTOTALCASH with a filter for declaration id to fetch more details by ID.
				 * @param {String} sDecId Declaration ID
				 */
				getTotalCashByDeclarationId: async function(sDecId) {
					let aStatusList = await this.getStatusList();
					aStatusList = (aStatusList.results || []).map(s => new StatusItem(s));
					return this.getEntitySet("ManageModel", 
						"ZC_OCTOTALCASH", 
						new Filter("decid", FilterOperator.EQ, sDecId),
						aTotalCash => aTotalCash.map(t => new CashierItem(t, aStatusList)),
						null);
				},

				/**
         * Fetches an entity set from the backend from model sModelName
         * with entityset sEntitySet. No filters are passed.
         * The resulting set is passed through fnDataTransformer.
         * Returns a promise with that data.
         * @param {String} sModelName Name of model
         * @param {String} sEntitySet Name of entity set
         * @param {Filter} oFilter UI5 model filter
         * @param {Function} fnDataTransformer A function that transforms the data from the backend.
         * @param {Object} urlParameters Parameters object
         * @returns {Promise} Promise to transformed entityset data
         */
				 getEntitySet: function(
          sModelName,
          sEntitySet,
          oFilter,
          fnDataTransformer,
          urlParameters
        ) {
          var that = this;
          return new Promise(function(resolve, reject) {
						var oModel = that.getOwnerComponent().getModel(sModelName);
						oModel.metadataLoaded().then(function() {
							oModel.read("/" + sEntitySet, {
								success: function(aData) {
									var results = aData.results || [];
									resolve(fnDataTransformer(results));
								},
								error: reject,
								filters: [oFilter],
								urlParameters: urlParameters
							});
						});
          });
        },


				/**
				 * 
				 * @param {Boolean} bReload 
				 * @param {Date} dDateStart 
				 * @param {Date} dDateEnd 
				 * @returns UI5 Filter
				 */
				generateCashierListFilters : function (bReload, dDateStart, dDateEnd) {
					if(bReload || dDateStart && dDateEnd) {
						var oFilter = this.getCashierDateStartEnd(dDateStart, dDateEnd);
						if(oFilter) {
							return [oFilter];
						}
						return [];
					}

					var oSelectedSummary = this.getGlobalModelProp("/SelectedSummary", "SummaryModel");
					return [this.getDateStartEnd(oSelectedSummary)];
				},


				getCashierDateStartEnd: function (dDateStartIn, dDateEndIn) {
					let dDateStart = dDateStartIn,
						dDateEnd = dDateEndIn;

					// if not given, read from model
					if (!dDateStart || !dDateEnd) { 
						dDateStart = this.getGlobalModelProp("/FilteredDateStart", "CashierFiltersModel");
						dDateEnd = this.getGlobalModelProp("/FilteredDateEnd", "CashierFiltersModel");
					}

					if(dDateStart && dDateEnd) {
						// Set first date as start of day
						dDateStart.setMilliseconds(0);
						dDateStart.setSeconds(0);
						dDateStart.setMinutes(0);
						dDateStart.setHours(0);

						// Set second date as end of day
						dDateEnd.setMilliseconds(0);
						dDateEnd.setSeconds(59);
						dDateEnd.setMinutes(59);
						dDateEnd.setHours(23);

						return new Filter("datum", FilterOperator.BT, this._changeDatesFromGMT(dDateStart), this._changeDatesFromGMT(dDateEnd));
					}
					return null;
				},

				generateCashierFilters : function () {
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel"),
						oSiteFilter, 
						oCashierFilter,
						oDecIdFilter;
					
					oSiteFilter = new Filter("site", FilterOperator.EQ, oSelectedCashier.Site);
					oDecIdFilter = new Filter("decid", FilterOperator.EQ, oSelectedCashier.DecId);
					oCashierFilter = new Filter("Cashier", FilterOperator.EQ, oSelectedCashier.Cashier);

					return [this.getDateStartEnd(oSelectedCashier), oSiteFilter, oCashierFilter, oDecIdFilter];
				},

				getDateStartEnd: function (oSelectedSummary) {
					var dDateStart = oSelectedSummary.Date,
						dDateEnd = new Date(dDateStart);

					// Set first date as start of day
					dDateStart.setMilliseconds(0);
					dDateStart.setSeconds(0);
					dDateStart.setMinutes(0);
					dDateStart.setHours(0);

					// Set second date as end of day
					dDateEnd.setMilliseconds(0);
					dDateEnd.setSeconds(59);
					dDateEnd.setMinutes(59);
					dDateEnd.setHours(23);

					return new Filter("datum", FilterOperator.BT, this._changeDatesFromGMT(dDateStart), this._changeDatesFromGMT(dDateEnd));
				},

				getSiteFilter: function () {
					var aSelectedSites = this.getGlobalModelProp("/FilteredSite", "FiltersModel"),
						
					aInnerFilter = aSelectedSites.map(function (sSite) {
						return new Filter("site", FilterOperator.EQ, sSite);
					});

					return new Filter({
						filters: aInnerFilter,
						and: false //important to establish that the filters are not exclusive one with another
					});
				},

				generateTotalFilter: function () {
					var aSelectedSites = this.getGlobalModelProp("/SelectedCashier", "CashierModel"),
						
					aInnerFilter = aSelectedSites.map(function (sSite) {
						return new Filter("site", FilterOperator.EQ, sSite);
					});

					return new Filter({
						filters: aInnerFilter,
						and: false //important to establish that the filters are not exclusive one with another
					});
				},

				getDefaultTender: function () {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getDefaultTenderData();

					return AjaxCaller.getInstance()
						.requestOdata("UserModel", 
							oConfig.method, 
							oConfig.url,
							{}, {},
							[new Filter("UserSite", FilterOperator.EQ, this.getGlobalModelProp("/Unit", "AmendModel"))])
						.then(function (oResult) {
							if(oResult.results.length > 0) {
								return oResult.results[0];
							}
							return {};
						});
				},

				approveDeclaration: function () {
					var oDataModel = this.getOwnerComponent().getModel("DeclarationModel");
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
					var d = new Date(oSelectedCashier.Date);
					d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
					var sDate = d.toISOString().slice(0,19);
					var sComment = this.getGlobalModelProp("/ApproveComment", "DeclarationsModel"),
						oParams = {
							"decid": oSelectedCashier.DecId,
							"site": oSelectedCashier.Site,
							"cashier": oSelectedCashier.Cashier,
							"datum": sDate,
							"comment": "",
							"localtime": new Date()
						};

					if(sComment) {
						oParams.comment = sComment;
					}

					oParams = this._changeDatesFromGMT(oParams);

					return new Promise (function (resolve, reject) {
						oDataModel.metadataLoaded().then(
							function () {
								oDataModel.callFunction("/APPROVE",{
									method: 'POST',
									urlParameters: oParams,
									success: function(oData) {
										resolve (oData);
									},
									error: function(oError){
										reject (oError);
									}
								});
							}
						);
					})
				},

				/**
				 * DELETES a declaration in the backend.
				 * @returns 
				 */
				deleteDeclaration: function () {
					var oDataModel = this.getOwnerComponent().getModel("DeclarationModel");
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
					var d = new Date(oSelectedCashier.Date);
					d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
					var sDate = d.toISOString().slice(0,19);
					var oParams = {
							"decid": oSelectedCashier.DecId,
							"site": oSelectedCashier.Site,
							"cashier": oSelectedCashier.Cashier,
							"datum": sDate,
							"comment": "",
							"localtime": new Date()
						};

					oParams = this._changeDatesFromGMT(oParams);

					return new Promise (function (resolve, reject) {
						oDataModel.metadataLoaded().then(
							function () {
								oDataModel.callFunction("/DELETE",{
									method: 'POST',
									urlParameters: oParams,
									success: function(oData) {
										resolve (oData);
									},
									error: function(oError){
										reject (oError);
									}
								});
							}
						);
					})
				},



				amendDeclaration: function (oValues) {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getAmendData();

					return AjaxCaller.getInstance()
						.requestOdata("DeclarationModel", 
							oConfig.method, 
							oConfig.url, 
							oValues)
						.then(function (oResult) {
							return oResult;
						});
				},

				isUserLockedOrInactive: function (sRole) {
					// return a promise
					var oConfig = ConfigHelper.getInstance().getUserStatusData();
					
					//'1' - Cashiers ; '2' - Managers;
					var sLookingForRole = sRole ? sRole : '2'; 

					return AjaxCaller.getInstance()
						.requestOdata("UserModel", 
							oConfig.method, 
							oConfig.url,
							{}, {},
							[new Filter("UserRole", FilterOperator.EQ, sLookingForRole)])
						.then(function (oResult) {
							return oResult;
						});
				},

				/**
				 * Method to convert all dates of an object from GMT to local timezone 
				 * @private
				 * @param	{object}  oData				The data object 
				 * @return	{object}           			The data object with the dates changed
				 */
				_changeDatesFromGMT: function (oData) {
					var changeDateFromGMT = function (dDate) {
						if (dDate instanceof Date) {
							return new Date(dDate.getTime() - (dDate.getTimezoneOffset() * 60 * 1000));
						}
						return null;
					};

					if (oData instanceof Date) {
						return changeDateFromGMT(oData);
					}

					for (var property in oData) {
						if (oData.hasOwnProperty(property)) {
							if (oData[property] instanceof Date) {
								oData[property] = changeDateFromGMT(oData[property]);
							} else if (typeof oData[property] === "object") {
								oData[property] = this._changeDatesFromGMT(oData[property]);
							}
						}

					}
					return oData;
				},

				/**
				 * Returns a promise to the minimum declaration date value
				 * @returns {Promise} Promise to a Date instance N days in the past
				 */
				getMinimumDeclarationDate: function () {
					var that = this;

					var oConfigHelper = ConfigHelper.getInstance();
					// return a promise
					var oConfig = oConfigHelper.getGeneralData(
						"'POS_DEC_WINDOW'" /* parameter name */
					);
					return AjaxCaller.getInstance()
						.requestOdata("GeneralModel", oConfig.method, oConfig.url)
						.then(function (oResult) {
							// oResult.d.Value is a string, .e.g "4 DAYS" so we need to parse it
							return that._parseDeclarationWindowValue(
								oResult.Value,
								new Date() // use today as reference
							);
						});
				},

				/**
				 * Parses the given string into a date N days in the past.
				 * @param {String} sValue String representing a time window. e.g "4 DAYS"
				 * @param {Date} dReference Optional reference date. If not given uses current date.
				 * @returns {Date} Date N days in the past
				 */
				_parseDeclarationWindowValue: function (sValue, dReference) {
					var aTokens = sValue.split(" ", 2);
					if (aTokens.length === 0) {
						return new Date(); // default value
					}
					var iPeriod = parseInt(aTokens[0], 10);
					var dateInPast = new Date(dReference.getTime());
					if (aTokens.length < 2) {
						// If we get just a number e.g. "4", we assume they mean days
						dateInPast.setDate(dateInPast.getDate() - iPeriod);
						return dateInPast;
					}
					// else we got something like "3 DAYS"
					switch (aTokens[1]) {
						case "DAY":
						case "DAYS":
							dateInPast.setDate(dateInPast.getDate() - iPeriod);
							break;
						case "MONTH":
						case "MONTHS":
							dateInPast.setMonth(dateInPast.getMonth() - iPeriod);
							break;
						default:
							jQuery.sap.log.error(
								"Cannot Parse Declaration Window Value: " + sValue
							);
					}
					return dateInPast;
				},

				/**
				 * @returns {Promise} Promise to an ajax request that logs the user out.
				 */
				logout: function () {
					var oConfigHelper = ConfigHelper.getInstance();
					// return a promise
					var oConfig = oConfigHelper.getLogout();
					return AjaxCaller.getInstance().requestAjax(
						oConfig.method,
						oConfig.url,
						null,
						null,
						"raw"
					);
				},

				getUnitsForUser: function () {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("UserModel");
						oModel.metadataLoaded().then(function () {
							// Read items of declarations
							oModel.read("/ZC_OCCASHIERSITES", {
								// Fetch all items
								success: function (aData) {
									var results = aData.results || [];
									results = results.map(function (r) {
										return new UserUnit(r);
									});
									resolve(results);
								},
								error: reject
							});
						});
					});
				},

				/**
				 * Given the response from the /ZOC_DEC_SRV/ZC_OCDECHTP entityset,
				 * converts the items into a DeclarationHeader with its DeclarationItem(s)
				 * @param {Object} aData Response object
				 * @returns {Array} Array of DeclarationHeader
				 */
				_parseDeclarationHeadersAndItems: function (aData) {
					// eslint-disable-next-line no-extra-parens
					var aDeclarations = (aData && aData.results) || [];
					// unwrap items
					aDeclarations = aDeclarations.map(function (d) {
						var oHeader = new DeclarationHeader(d);
						// eslint-disable-next-line no-extra-parens
						oHeader.items = ((d.to_Items && d.to_Items.results) || []).map(
							function (i) {
								return new DeclarationItem().fromBackend(i);
							}
						);
						return oHeader;
					});
					return aDeclarations;
				},

				/**
				 * Calls the backend to fetch further details about the unit,
				 * like the default tender or if the unit needs to have Float.
				 * Sample call: /sap/opu/odata/sap/ZOC_USERSMD_SRV/ZC_OCUSER_LOCAL?$filter=UserSite%20eq%20%27A011%27
				 * @param {String} sUnitCode Code for the unit to pass in the filter
				 * @returns {Promise} Promise resolved with an instance of `ZOC_USERSMD_SRV/ZC_OCUSER_LOCAL`
				 */
				getDetailsForUnit: function (sUnitCode) {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("UserModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_OCUSER_LOCAL", {
								success: function (aData) {
									// Even though we send a UserSite filter the backend may return multiple
                  // records. Typically 2, one with the site empty, the other with the site filled (if it exists).
                  // We want to look for one that has the Site not blank if it exists
									var aResults = aData.results || [];
									if (aResults.length > 0) {
										let defaultResult = aResults.find(r => r.UserSite === "");
                    let siteSpecificDetails = aResults.find(r => r.UserSite === sUnitCode);
                    return resolve(siteSpecificDetails? siteSpecificDetails : defaultResult);
									}
									return resolve({});
								},
								error: reject,
								filters: [
									new sap.ui.model.Filter({
										path: "UserSite",
										operator: sap.ui.model.FilterOperator.EQ,
										value1: sUnitCode
									})
								]
							});
						});
					});
					//
				},

				/**
				 * Creates a date filter for a date between today and the iDaysAgo days in the past.
				 * @param {String} sPropertyName Name of property to use in the filtering
				 * @param {Number} iDaysAgo Number of days in the past
				 * @returns {Array} Date range filters
				 */
				_dateRangeFilters: function (sPropertyName, iDaysAgo) {
					return [
						new sap.ui.model.Filter({
							path: sPropertyName,
							operator: sap.ui.model.FilterOperator.LT,
							value1: dates.today()
						}),
						new sap.ui.model.Filter({
							path: sPropertyName,
							operator: sap.ui.model.FilterOperator.GT,
							value1: dates.nDaysAgo(iDaysAgo)
						})
					];
				},

				/**
				 * Queries the declarations for the past N days (currently 180 days), to fetch
				 * the set of unique bag ids.
				 * @param {Array} aUserTenders Array of UserTender instances.
				 * @returns {Promise} Promise to a request. Resolved to a list of DeclarationItems
				 */
				getUsedBagIds: function () {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("DeclarationModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_OCDECHTP", {
								error: reject,
								success: function (aData) {
									var oDeclarationList = new DeclarationHeaderList(
										that._parseDeclarationHeadersAndItems(aData)
									);
									return resolve(oDeclarationList.uniqueBagIds());
								},
								urlParameters: {
									$expand: "to_Items"
								},
								filters: that._dateRangeFilters("datum", 180)
							});
						});
					});
				},

				/**
				 * Fetches the list of declarations of the last 14 days with their
				 * respective items. From those, builds a list of the
				 * recently used tender types.
				 * @param {Array} aUserTenders Array of UserTender instances.
				 * @returns {Promise} Promise to a request. Resolved to a list of DeclarationItems
				 */
				getMostRecentlyUsedUniqueTenders: function (aUserTenders) {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("DeclarationModel");
						oModel.metadataLoaded().then(function () {
							// Read declarations of the last N days
							oModel.read("/ZC_OCDECHTP", {
								success: function (aData) {
									var headerList = new DeclarationHeaderList(
										that._parseDeclarationHeadersAndItems(aData)
									);
									var aUniqueDeclarationItems = headerList.uniqueDeclarationItemsByType();
									// The uniqueDeclarations don't have descriptions, so we need to fetch them
									// from the given aTenderNames, which is an array of UserTender instances.
									aUniqueDeclarationItems.forEach(function (d) {
										var oMatchingUserTender = aUserTenders.find(function (
											oUserTender
										) {
											return (
												oUserTender.tenderType === d.tenderType &&
												oUserTender.currencyCode === d.currency
											);
										});
										d.description = oMatchingUserTender ?
											oMatchingUserTender.tenderTypeDescription :
											""; // fixme
									});
									return resolve(aUniqueDeclarationItems);
								},
								error: reject,
								urlParameters: {
									$expand: "to_Items"
								},
								filters: that._dateRangeFilters("datum", 14)
							});
						});
					});
				},

				/**
				 * Fetches tender types from the backend, /zoc_general_srv/ZC_TENDERTYPES
				 * @returns {Promise} Promise to a request
				 */
				getAllTenderTypes: function () {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("GeneralModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_TENDERTYPES", {
								success: resolve,
								error: reject
							});
						});
					});
				},

				/**
				 * Build an or filter with the site and the empty string
				 * @param {String} sSite Site code
				 * @returns {void}
				 */
				USER_TT_Filters: function (sSite) {
					return [
						new sap.ui.model.Filter({
							and: true,
							filters: [
							  new sap.ui.model.Filter({
								path: "UserSite",
								operator: sap.ui.model.FilterOperator.EQ,
								value1: sSite
							  }),
							  new sap.ui.model.Filter({
								and: false,
								filters: [
								  new sap.ui.model.Filter({
									path: "Declared",
									operator: sap.ui.model.FilterOperator.EQ,
									value1: "0002" // Pos
								  }),
								  new sap.ui.model.Filter({
									path: "Declared",
									operator: sap.ui.model.FilterOperator.EQ,
									value1: "0004" // Pos & Safe
								  })
								]
							  })
							]
						})
					];
				},

				/**
				 * @param {String} sSite Site code
				 * @returns {Array} Instances of UserTender
				 */
				getAllTenderTypesForUser: function (sSite) {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("UserModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_OCUSER_TT", {
								filters: that.USER_TT_Filters(sSite),
								success: function (aData) {
									return resolve(
										((aData && aData.results) || []).map(function (oRes) {
											return new UserTender(oRes);
										})
									);
								},
								error: reject
							});
						});
					});
				},

				/**
				 * Build an or filter with the site and the empty string
				 * @param {String} sSite Site code
				 * @returns {void}
				 */
				USER_BAGS_Filters: function (sSite) {
					return [
						new sap.ui.model.Filter({
							path: "UserSite",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: sSite
						})
					];
				},

				/**
				 * Returns a promise to a regex format for the bag barcodes on a specific site.
				 * @param {String} sSite Site code
				 * @returns {Promise} promise to the bag format regex
				 */
				getBagFormatForSite: function (sSite) {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("UserModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_OCUSER_BAGS", {
								filters: that.USER_BAGS_Filters(sSite),
								success: function (aData) {
									if (aData && aData.results && aData.results[0]) {
										return resolve(aData.results[0].BagFormat);
									}
									return resolve("");
								},
								error: reject
							});
						});
					});
				},

				/**
				 * Returns a Promise to a single batch request fetching the descriptions
				 * of the tender types in the given array.
				 *
				 * The given array needs to have objects with:
				 * - tenderType
				 * - profileType
				 * - site
				 *
				 * @param {Array} aTenders Array of Tender instances
				 * @returns {Promise} Promise to a request
				 */
				getTenderTypesDescriptions: function (aTenders) {
					var that = this;
					var sError = "Can't fetch descriptions for tender types";
					if (!aTenders || !Array.isArray(aTenders)) {
						return new Promise.resolve(null);
					}
					var sGroup = jQuery.sap.uid();
					var oModel = that.getOwnerComponent().getModel("GeneralModel");
					oModel.setUseBatch(true);
					var aDeferredGroups = oModel.getDeferredGroups();
					aDeferredGroups = aDeferredGroups.concat([sGroup]);
					oModel.setDeferredGroups(aDeferredGroups);

					return oModel.metadataLoaded().then(function () {
						return new Promise(function (resolve, reject) {
							aTenders.forEach(function (oTender) {
								
								var sPath = oModel.createKey("ZC_TENDERTT", {
									TenderType: oTender.tenderType,
									ProfileType: oTender.profileType,
									Site: oTender.site,
									Language: "EN" // FIXME
								});
								oModel.read("/" + sPath, {
									groupId: sGroup
								});
							});
							// Send the request
							oModel.submitChanges({
								success: function (aBatchResponse) {
									// Because we get a batch response, we are going to process it and call resolve manually
									if (
										aBatchResponse &&
										Array.isArray(aBatchResponse.__batchResponses)
									) {
										// unwrap .data and check statusCode
										var aResponses = aBatchResponse.__batchResponses;
										if (
											aResponses.some(function (o) {
												return o.statusCode !== "200";
											})
										) {
											reject(sError); // There's at least one error, reject it all
										}
										return resolve(
											aResponses.map(function (o) {
												return o.data;
											})
										);
									}
									return reject(sError);
								},
								error: reject
							});
						});
					});
				},

				/**
				 * Builds an object to send to the backend for declaration creation.
				 * @param {Date} oDate declaration date
				 * @param {String} sUnit Unit
				 * @param {String} sAmount Amount
				 * @param {String} sCurr Currency code
				 * @param {Array} aDeclarationItems items
				 * @param {Array} aBags bags with items
				 * @returns {Object} object to send to the /ZC_OCDECHTP entity
				 */
				_backendDeclarationObject: function (
					oDate,
					sUnit,
					sAmount,
					sCurr,
					aDeclarationItems,
					aBags
				) {
					var amountGreater0 = function (oItem) {
						return oItem.dmbtr && oItem.dmbtr > 0;
					};
					// Convert unbagged items to backend format
					var aUnbaggedItems = aDeclarationItems.map(function (i) {
						return i.toBackend();
					});
					// Convert bags of items to backend format and merge
					var aBaggedItems = aBags
						.map(function (b) {
							return b.toBackendItems();
						})
						.flat();
					// Concatenate both bagged and unbagged
					var aItems = aUnbaggedItems.concat(aBaggedItems);
					// Filter out items with a 0 or empty amount
					aItems = aItems.filter(amountGreater0);
					// Numerate them (itemid needs to increment)
					aItems.forEach(function (item, index) {
						// itemid is a string with 0padding. e.g. "0001"
						// The code below pads with zeros.
						item.itemid = ("000" + (index + 1)).slice(-4);
					});
					var now = new Date();
					var oRes = {
						//datum: "2019-12-09T00:00:00",
						//timestamp: "2019-12-09T13:05:05Z",
						site: sUnit,
						datum: dates.toYYYYMMDDT000000(oDate),
						timestamp: now.toISOString(),
						status: "0001",
						to_Items: aItems
					};
					if (sAmount !== null) {
						oRes.dmbtr = String(sAmount);
						oRes.local_curr = sCurr;
					}
					return oRes;
				},

				/**
				 * Builds an object to send to the backend for declaration creation.
				 * @param {Date} oDate declaration date
				 * @param {String} sUnit Unit
				 * @param {String} sAmount Amount
				 * @param {String} sCurr Currency code
				 * @param {Array} aDeclarationItems items
				 * @param {Array} aBags bags with items
				 * @returns {Object} object to send to the /ZC_OCDECHTP entity
				 */
				createDeclaration: function (
					oDate,
					sUnit,
					sAmount,
					sCurr,
					aDeclarationItems,
					aBags
				) {
					var oDeclaration = this._backendDeclarationObject(
						oDate,
						sUnit,
						sAmount,
						sCurr,
						aDeclarationItems,
						aBags
					);
					var sGroup = jQuery.sap.uid();
					var oModel = this.getOwnerComponent().getModel("DeclarationModel");
					oModel.setUseBatch(true);
					var aDeferredGroups = oModel.getDeferredGroups();
					aDeferredGroups = aDeferredGroups.concat([sGroup]);
					oModel.setDeferredGroups(aDeferredGroups);

					return oModel.metadataLoaded().then(function () {
						return new Promise(function (resolve, reject) {
							oModel.create("/ZC_OCDECHTP", oDeclaration, {
								success: function () {
									return resolve();
								},
								error: reject
							});
						});
					});
				},

				/**
				 * Returns a promise that is resolved with a boolean
				 * specifying if the user is locked out of declarations.
				 * @returns {Promise} Promise to a boolean
				 */
				isUserLocked: function () {
					var that = this;
					return new Promise(function (resolve, reject) {
						var oModel = that.getOwnerComponent().getModel("UserModel");
						oModel.metadataLoaded().then(function () {
							oModel.read("/ZC_OCUSER", {
								success: function (aData) {
									var results = aData.results || [];
									results = results.reduce(function (acc, u) {
										return acc || Boolean(u.Locked);
									}, false);
									resolve(results);
								},
								error: reject
							});
						});
					});
				}
			}
		);

		return {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @return {com.ssp.ocm.manage/declarations.app.services.ApiFacade} The APIFacade instance
			 */
			getInstance: function () {
				if (!oInstance) {
					oInstance = new classSingleton();
				}
				return oInstance;
			}
		};
	}
);