/*global history */
sap.ui.define(
	[
		"sap/m/MessageBox",
		"sap/ui/core/mvc/Controller",
		"sap/ui/core/routing/History",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessagePopover",
		"sap/m/MessageItem",
		"sap/ui/core/BusyIndicator",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/app/domain/Message",
		"com/ssp/ocm/manage/declarations/app/domain/CashierItem",
		"com/ssp/ocm/manage/declarations/app/domain/StatusItem"
	],
	function (
		MessageBox,
		Controller,
		History,
		JSONModel,
		Filter,
		FilterOperator,
		MessagePopover,
		MessageItem,
		BusyIndicator,
		models,
		ApiFacade,
		formatter,
		Message,
		CashierItem,
		StatusItem
	) {
		"use strict";

		/**
		 * Base object from which all other controllerss inherit
		 * @exports com/ssp/ocm/manage/declarations/app/base/BaseController
		 */
		return Controller.extend(
			"com.ssp.ocm.manage.declarations.app.base.BaseController", {
				/**
				 * Shared app formatter
				 * @type {com.ssp.ocm.manage.declarations.app.utils.formatter}
				 */
				formatter: formatter,

				_oErrorPopover: null,

				_hasPreviousFilters: false,

				/* =========================================================== */
				/* public methods					                                     */
				/* =========================================================== */

				onInit: function () {
					this.createMessagePopover();
				},

				createMessageModel: function () {
					if(!this.getGlobalModel("MessageModel")) { //Only creates if it is not created yet.
						var oMessageJSON = {
							MessageList: [],
							Length: 0
						};
		
						this.setGlobalModel(new JSONModel(oMessageJSON), "MessageModel");
					}
				},

				resetMessageModel: function () {
					var oMessageJSON = {
						MessageList: [],
						Length: 0
					};
	
					this.setGlobalModel(new JSONModel(oMessageJSON), "MessageModel");
				},

				/**
				 * Creates the popover template and the binding.
				 * @return {undefined} - nothing to return :)
				 */
				createMessagePopover: function () {
					if (!this._oMessagePopover) {
						this.createMessageModel();

						var oMessageTemplate = new MessageItem({
							type: '{type}',
							activeTitle: '{active}',
							title: '{title}',
							description: '{description}',
							subtitle: '{subtitle}'
						});

						this._oMessagePopover = new MessagePopover({
							items: {
								path: '/MessageList/',
								template: oMessageTemplate
							}
						});

						this._oMessagePopover.setModel(this.getGlobalModel('MessageModel'));
					}
				},

				generateCashierFilters : function () {
					var oSelectedSummary = this.getGlobalModelProp("/SelectedSummary", "SummaryModel");

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

					return [new Filter("datum", FilterOperator.BT, dDateStart, dDateEnd),
							new Filter("site", FilterOperator.EQ, oSelectedSummary.Site)];
				},


				/**
				 * Fetches cashier list and sets it in the model.
				 * @returns {null}	-Returns nothing
				 */
				_loadCashierList: function (bReload=false, dDateStartIn=false, dDateEndIn=false) {
					BusyIndicator.show(0);
					
					var dDateStart = dDateStartIn || this.getGlobalModelProp("/FilteredDateStart", "CashierFiltersModel"),
						dDateEnd = dDateEndIn || this.getGlobalModelProp("/FilteredDateEnd", "CashierFiltersModel");

					return ApiFacade.getInstance()
						.getCashierList(bReload, dDateStart, dDateEnd)
						.then(
							function (oResult) {
								this._setCashiersOnModel(oResult.results, bReload);
							}.bind(this),
							function (oError) {
								this.addMessage(oError);
								BusyIndicator.hide();
							}.bind(this)
						);
				},

				/**
				 * 
				 * @returns 
				 */
				_loadStatusList: function() {
					return ApiFacade.getInstance()
						.getStatusList()
						.then(
							function (oResult) {
									this._setStatusOnModel(oResult.results);
							}.bind(this));
				},

			/**
			 * Set the status list on model to use its texts with the formatters.
			 * @param {Array} aStatusList - Status list returned by the service
			 * @returns {null}	-Returns nothing
			 */
			_setStatusOnModel: function (aStatusList) {
				if(aStatusList){
					//Iterates the Status list and create an Item by each one to handle easily on model
					aStatusList.forEach(function(oStatus) {
						var oStatusItem = new StatusItem(oStatus);
						this.pushGlobalModelProp('/StatusList', oStatusItem, 'StatusModel');
					}.bind(this));
					this._getStatusFilterList(); //Creates the filter list
				}
			},

			/**
			 * 
			 */
			_initStatusModel: function() {
				var oStatusJSON = {
					StatusList: []
				};
				this.setGlobalModel(models.createJSONModel(oStatusJSON), "StatusModel");
			},


			/**
			 * 
			 */
			_initSummaryModel: function() {
				var oSummaryJSON = {
					SummaryList: [],
					SelectedSummary: {}
				};
				this.setGlobalModel(models.createJSONModel(oSummaryJSON), "SummaryModel");
			},


			/**
			 * 
			 */
			_initFiltersModel: function() {
				var oFiltersJSON = this.getWithExpiry('FiltersModel')

				if(!oFiltersJSON) {
					var oFiltersJSON = {
						SiteFilterList: [],
						StatusFilterList: [],
						FilteredSite: "All",
						FilteredVariance: "",
						FilteredStatus: "",
						FilteredDateStart: new Date(),
						FilteredDateEnd: new Date(),
						maxDate: new Date()
					}
				} else {
					this._hasPreviousFilters = true
				}

				this.setGlobalModel(models.createJSONModel(oFiltersJSON), "FiltersModel");
			},


			/**
			 * Creates the filters values for the Dropdown.
			 * @returns {null}	-Returns nothing
			 */
				_getStatusFilterList: function () {
					var aStatusList = this.getGlobalModelProp('/StatusList', 'StatusModel'),
						aResult = [];
					
					const aStatusListEN = aStatusList.filter(
						s => s.Language === "EN"); // harcode language to EN SSPFI-21648
					//For each status we create a simpler object
					aResult = aStatusListEN.map(function (oStatus) {
						return {
							Description : oStatus.Description,
							ID : oStatus.StatusID
						}
					}, this);
					
					//Unshift a 'Show All' option to the StatusFilterList 
					//so we can 'delete' the filter selected previously
					aResult.unshift({
						Description: this.getResourceBundle().getText("SHOW_ALL_FILTER"),
						ID: "All"
					});
	
					this.setGlobalModelProp("/StatusFilterList", aResult, "FiltersModel");
				},

				/**
				 * 
				 * @param {Array} aCashierList 
				 * @param {Boolean} bReload 
				 */
				_setCashiersOnModel: function (aCashierList, bReload) {
					if(aCashierList){
						var aCashiers = [],
							aStatusList = this.getGlobalModelProp("/StatusList", "StatusModel");
	
						aCashierList.forEach( function(oCashier) {
							aCashiers.push(new CashierItem(oCashier, aStatusList));
						});
	
						this.setGlobalModelProp("/CashierList", aCashiers, "CashierModel");
					}
				},

				/**
				 * Show the message popover over the button that´s pressed
				 * @param  {Object}  oEvent 	Contains the info that shot this event and attach it the pop over
				 * @return {undefined} - nothing to return :)
				 */
				handleMessagePopoverPress: function (oEvent) {
					//Changes to id to allow opening on event of error
					//this._oMessagePopover.toggle(this.getView().byId("idMessageButton"));
					if(!this._oMessagePopover) {
						this.createMessagePopover();
					}
					this._oMessagePopover.toggle(oEvent.getSource());
				},

				addMessage: function (oMessage, sErrorType) {
					var oMessageItem = new Message(oMessage, sErrorType);
					this.pushGlobalModelProp("/MessageList", oMessageItem, "MessageModel");
					var iLength = this.getGlobalModelProp("/MessageList", "MessageModel").length;
					this.setGlobalModelProp("/Length", iLength, "MessageModel");
				},

				isValidObject: function (oObject) {
					if (oObject && Object.keys(oObject).length > 0) {
						return true;
					}
					return false;
				},

				forceLockedViewIfneeded: function () {
					if (this.getGlobalModelProp("/UserLocked", "AmendModel")) {
						this.doNavTo("locked");
					}
				},

				/**
				 * Convenience method for accessing the router in every controller of the application.
				 * @public
				 * @returns {sap.ui.core.routing.Router} the router for this component
				 */
				getRouter: function () {
					return this.getOwnerComponent().getRouter();
				},

				/**
				 * Convenience method for getting the view model by name in every controller of the application.
				 * @public
				 * @param {string} sName the model name
				 * @returns {sap.ui.model.Model} the model instance
				 */
				getModel: function (sName) {
					return this.getView().getModel(sName);
				},

				/**
				 * Convenience method for setting the view model in every controller of the application.
				 * @public
				 * @param {sap.ui.model.Model} oModel the model instance
				 * @param {string} sName the model name
				 * @returns {sap.ui.mvc.View} the view instance
				 */
				setModel: function (oModel, sName) {
					return this.getView().setModel(oModel, sName);
				},

				/**
				 * Convenience method to get the device model.
				 * @returns {sap.ui.model.Model} Device model
				 */
				getDeviceModel: function () {
					return this.getOwnerComponent().getModel("device");
				},

				getClientLanguage: function () {
					return this.getOwnerComponent().getCurrentLanguageOnClient().toUpperCase();
				},

				getSiteDesc: function (sText) {
					var oStatusModel = this.getOwnerComponent().getModel("FiltersModel");

					if(oStatusModel) {
						var aSiteList = oStatusModel.getProperty("/SiteFilterList"),
							oResult;

						oResult = aSiteList.find(function (oSite) {
							return oSite.Site === sText;
						});

						return oResult ? oResult.SiteDesc : "";
					}

					return "";
				},

				getStatusText: function (iKey) {
					var oStatusModel = this.getOwnerComponent().getModel("StatusModel");

					if(oStatusModel) {
						var aStatusList = oStatusModel.getProperty("/StatusList"),
							oResult;

						oResult = aStatusList.find(function (oStatus) {
							return oStatus.StatusID === iKey && oStatus.Language === this.getClientLanguage();
						}.bind(this));

						return oResult ? oResult.Description : "";
					}

					return "";
				},

				getTenderGroupText: function (iKey) {
					var oTendersModel = this.getOwnerComponent().getModel("TenderTypeModel");

					if(oTendersModel) {
						var aTenderGroupList = oTendersModel.getProperty("/TenderGroupList"),
							oResult;

						oResult = aTenderGroupList.find(function (oTender) {
							return oTender.TenderTypeGroup === iKey && oTender.Language === this.getClientLanguage();
						}.bind(this));

						return oResult ? oResult.Description : "";
					}
					return "";
						
				},

				getTenderTypeText: function (iKey,bDeclared, bLocalCurr, bExchange_rate, bLocal_Currency) {
					var oTendersModel = this.getOwnerComponent().getModel("TenderTypeModel");
					if(oTendersModel) {
						var aTenderTypesList = oTendersModel.getProperty("/TenderTypesList"),
							oResult;

						oResult = aTenderTypesList.find(function (oTender) {
							return oTender.TenderType === iKey && oTender.Language === this.getClientLanguage();
						}.bind(this));
						var oTenderDescription = oResult.Description;
						// if(bLocalCurr!== null || undefined && bExchange_rate!== null || undefined && bDeclared!== null || undefined && bLocal_Currency!== null || undefined)
						if(bExchange_rate!== '0.0000')
						// if( bLocalCurr!==bLocal_Currency)
						{
							var oTenderConcat = "(" + bDeclared +" "+ bLocalCurr + "@" + bExchange_rate + " "+ bLocal_Currency + "/" + bLocalCurr + ")";
							oTenderDescription = oResult.Description + oTenderConcat ;
							return oResult ? oTenderDescription : "";
						} 
						else{
							return oResult ?  oResult.Description : "";
						}
						// return oResult ? oResult.Description : "";
						// return oResult ? oTenderDescription : "";
					}
					return "";
				},

				/**
				 * Convenience method for getting the resource bundle.
				 * @public
				 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
				 */
				getResourceBundle: function () {
					return this.getOwnerComponent()
						.getModel("i18n")
						.getResourceBundle();
				},

				/**
				 * Convenience method for getting translated text
				 * @param {String} i18nText i18n text key
				 * @returns {String} the text defined in the i18n file
				 */
				getText: function (i18nText) {
					return this.getResourceBundle().getText(i18nText);
				},

				/**
				 * Formatter instance
				 * @public
				 * @return {com.ssp.ocm.manage.declarations.app.utils.formatter} App formatter
				 */
				getFormatter: function () {
					return this.formatter;
				},

				/**
				 * Do a hardcoded navigation, no parameters needed.
				 * @public
				 * @param  {string} sRouteName Route name defined in 'manifest.json'
				 * @param  {object} oParams It depends how route is defined in 'manifest.json' file
				 * @param  {object} oComponentTargetInfo 
				 * @param  {object} bReplace If set to true, the hash is replaced, and there will be no entry in the browser history
				 * @return {undefined}
				 */
				doNavTo: function (sRouteName, oParams, oComponentTargetInfo, bReplace) {
					if (oParams) {
						this.getRouter().navTo(sRouteName, oParams, oComponentTargetInfo, bReplace);
					} else {
						this.getRouter().navTo(sRouteName);
					}
				},

				/**
				 * Display the selected target without changing the hash
				 * @public
				 * @param  {string} sTargetNameFrom From target name
				 * @param  {string} sTargetNameTo Destination target name
				 * @param  {object} oParams     Additional data to pass
				 * @return {undefined}
				 */
				doNavToBasedOnTarget: function (
					sTargetNameFrom,
					sTargetNameTo,
					oParams
				) {
					var oDataNavigations = {
						from: sTargetNameFrom,
						data: oParams
					};

					this.getRouter()
						.getTargets()
						.display(sTargetNameTo, oDataNavigations);
				},

				/**
				 * Switch on busy indicator in app screens
				 * @public
				 * @return {undefined}
				 */
				switchOnBusy: function () {
					var oAppViewModel = this.getOwnerComponent().getModel("appView");
					oAppViewModel.setProperty("/busy", true);
				},

				/**
				 * Switch off busy indicator in app screens
				 * @public
				 * @return {undefined}
				 */
				switchOffBusy: function () {
					var oAppViewModel = this.getOwnerComponent().getModel("appView");
					oAppViewModel.setProperty("/busy", false);
				},

				/**
				 * Method to show messages to users.
				 * Next, values considered to "sType":
				 * 	- "S" -> Success
				 * 	- "W" -> Warning
				 * 	- "E" -> Error
				 *
				 * @public
				 * @param  {object|string} i18nText Text&parameters key
				 * @param  {string} sType Type of alert to be shown.
				 * @param  {function} fnCloseHandler Close handler
				 * @return {undefined}
				 */
				alert: function (i18nText, sType, fnCloseHandler) {
					var bCompact = Boolean(
							this.getView()
							.$()
							.closest(".sapUiSizeCompact").length
						),
						sStyleClass = bCompact ? "sapUiSizeCompact" : "";

					var sText = "";
					if (typeof i18nText === "string") {
						sText = this.getResourceBundle().getText(i18nText);
					} else {
						var sPattern = this.getResourceBundle().getText(i18nText.pattern);
						sText = jQuery.sap.formatMessage(sPattern, i18nText.params);
					}

					fnCloseHandler = fnCloseHandler || function () {};

					switch (sType) {
						case "S":
							MessageBox.success(sText, {
								styleClass: sStyleClass,
								onClose: fnCloseHandler.bind(this)
							});
							break;
						case "W":
							MessageBox.warning(sText, {
								styleClass: sStyleClass,
								onClose: fnCloseHandler.bind(this)
							});
							break;
						case "E":
							MessageBox.error(sText, {
								styleClass: sStyleClass,
								onClose: fnCloseHandler.bind(this)
							});
							break;
						default:
							MessageBox.warning(sText, {
								styleClass: sStyleClass,
								onClose: fnCloseHandler.bind(this)
							});
					}
				},

				/**
				 * Helper function for paginating tables
				 * @public
				 * @param  {string}            sModelName The model name
				 * @param  {integer|string}    isRelIndex  Relative index from the current position to move to
				 * @return {undefined}
				 */
				tablePagePass: function (sModelName, isRelIndex) {
					var oData = this.getModel(sModelName).getData();

					// We save any possible changes into the data property
					var iMaxOverwrite = Math.min(
						oData.currentIndex + oData.growingThreshold,
						oData.data.length
					);
					oData.data = Array.prototype.concat(
						oData.data.slice(0, oData.currentIndex),
						oData.currentData,
						oData.data.slice(iMaxOverwrite, oData.data.length)
					);

					if (typeof isRelIndex === "string") {
						switch (isRelIndex) {
							case "pageUp":
								isRelIndex = -Math.min(
									this.getModel(sModelName).getProperty("/growingThreshold"),
									this.getModel(sModelName).getProperty("/currentIndex")
								);
								break;
							case "begin":
								isRelIndex = -this.getModel(sModelName).getProperty(
									"/currentIndex"
								);
								break;
							case "pageDown":
								isRelIndex = Math.min(
									this.getModel(sModelName).getProperty("/growingThreshold"),
									this.getModel(sModelName).getProperty("/data/length") -
									this.getModel(sModelName).getProperty("/currentIndex") -
									this.getModel(sModelName).getProperty("/growingThreshold")
								);
								break;
							case "end":
								isRelIndex =
									this.getModel(sModelName).getProperty("/data/length") -
									this.getModel(sModelName).getProperty("/currentIndex") -
									this.getModel(sModelName).getProperty("/growingThreshold");
								break;
							default:
								isRelIndex = 0;
						}
					}

					oData.currentIndex += isRelIndex;

					oData.currentData = oData.data.slice(
						oData.currentIndex,
						oData.currentIndex + oData.growingThreshold
					);

					this.getModel(sModelName).setData(oData);
				},

				/**
				 * Helper function for changing the row number manually
				 * @public
				 * @param  {sap.ui.base.Event} oEvent The change event
				 * @param  {string}            sModelName The table model name
				 * @return {undefined}
				 */
				onTypeTableCurrentIndex: function (oEvent, sModelName) {
					var sValue = oEvent.getParameter("value");
					var sFormerValue =
						this.getModel(sModelName).getProperty("/currentIndex") + 1;
					if (!sValue.match(/\D/g)) {
						var iValue = Number(sValue);
						if (iValue < 1) {
							iValue = 1;
						} else if (
							iValue >
							1 +
							this.getModel(sModelName).getProperty("/data/length") -
							this.getModel(sModelName).getProperty("/growingThreshold")
						) {
							iValue =
								1 +
								this.getModel(sModelName).getProperty("/data/length") -
								this.getModel(sModelName).getProperty("/growingThreshold");
						}
						oEvent.getSource().setValue(iValue);
						this.tablePagePass(
							sModelName,
							iValue -
							1 -
							this.getModel(sModelName).getProperty("/currentIndex")
						);
						this.getModel(sModelName).setProperty("/currentIndex", iValue - 1);
					} else {
						oEvent.getSource().setValue(sFormerValue);
					}
				},

				/**
				 * Helper function for retrieving fragments
				 * @public
				 * @param  {string} sProperty     The property in which the control will be stored and retrieved
				 * @param  {string} sFragmentName The fragment name (optional after the first call)
				 * @return {sap.ui.core.Control}  The control insided the fragment
				 */
				getFragment: function (sProperty, sFragmentName) {
					if (!this[sProperty]) {
						this[sProperty] = sap.ui.xmlfragment(sFragmentName, this);
						this.getView().addDependent(this[sProperty]);
					}

					return this[sProperty];
				},

				setGlobalModel: function (oJSONModel, sModelName) {
					return this.getOwnerComponent().setModel(oJSONModel, sModelName);
				},

				getGlobalModel: function (sModelName) {
					return sModelName ? this.getOwnerComponent().getModel(sModelName) : this.getOwnerComponent().getModel();
				},

				getGlobalModelProp: function (sProp, sModelName) {
					var oModel = sModelName ? this.getGlobalModel(sModelName) : this.getGlobalModel();
					return oModel.getProperty(sProp);
				},
				setGlobalModelProp: function (sProp, oValue, sModelName) {
					var oModel = sModelName ? this.getGlobalModel(sModelName) : this.getGlobalModel();
					return oModel.setProperty(sProp, oValue);
				},

				/**
				 * Convenience method to set a property on the "global" model
				 * Only sets if there is nothing there yet.
				 * @param {String} sProp model property name
				 * @param {Object} oValue property value
				 * @returns {Object} Result of setProperty
				 */
				defaultGlobalModelProp: function (sProp, oValue) {
					var oModel = this.getOwnerComponent().getModel();
					var oVal = oModel.getProperty(sProp, oValue);
					if (!oVal) {
						return oModel.setProperty(sProp, oValue);
					}
					return null;
				},

				/**
				 * Convenience method to push an item to an array in the model
				 * @param {String} sProp model property name
				 * @param {Object} oItem Item to push
				 * @returns {Object} Result of setProperty
				 */
				pushViewModelProp: function (sProp, oItem) {
					var aItems = this.getViewModelProp(sProp);
					aItems.push(oItem);
					return this.setViewModelProp(sProp, aItems);
				},

				/**
				 * Convenience method to push an item to an array in the model
				 * @param {String} sProp model property name
				 * @param {Object} oItem Item to push
				 * @param {String} sModel model name
				 * @returns {Object} Result of setProperty
				 */
				pushGlobalModelProp: function (sProp, oItem, sModel) {
					var aItems = sModel ? this.getGlobalModelProp(sProp, sModel) || [] : this.getGlobalModelProp(sProp) || [];
					aItems.push(oItem);
					var oPush = sModel ? this.setGlobalModelProp(sProp, aItems, sModel) : this.setGlobalModelProp(sProp, aItems);
					return oPush;
				},

				/**
				 * Convenience method to push an item to an array in the model
				 * @param {String} sProp model property name
				 * @param {Array} aItemsToPush Items to push
				 * @returns {Object} Result of setProperty
				 */
				pushMultipleGlobalModelProp: function (sProp, aItemsToPush) {
					var aItems = this.getGlobalModelProp(sProp) || [];
					aItemsToPush.forEach(function (oItem) {
						aItems.push(oItem);
					});
					return this.setGlobalModelProp(sProp, aItems);
				},

				/* =========================================================== */
				/* event handlers                                              */
				/* =========================================================== */

				/**
				 * Event handler for navigating back.
				 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
				 * If not, it will replace the current entry of the browser history with the master route.
				 * @public
				 * @return {undefined}
				 */
				onNavBack: function () {
					var oHistory = History.getInstance(),
						sPreviousHash = oHistory.getPreviousHash();

					if (sPreviousHash !== undefined) {
						history.go(-1);
					} else {
						this.doNavTo("main");
					}
				},

				/**
				 * Event handler for navigating back.
				 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
				 * If not, it will replace the current entry of the browser history with the master route.
				 * @public
				 * @return {undefined}
				 */
				onNavBackTarget: function () {
					if (this._sFromTargetName) {
						this.doNavToBasedOnTarget(null, this._sFromTargetName);
					} else {
						this.doNavTo("main");
					}
				},

				/**
				 * Generic function that can filter down the `items` aggregations of a SelectDialog
				 * based on the given property names.
				 * @param {Event} oEvent Search event
				 * @param {Array} aPropNames Array of strings with the fields to use in the filter
				 * @param {Function} fValueTransformer Optional function to transform the value before sending to the filter
				 * @returns {void}
				 */
				onSelectDialogSearch: function (oEvent, aPropNames, fValueTransformer) {
					var sValue = oEvent.getParameter("value");

					if (fValueTransformer) {
						sValue = fValueTransformer(sValue);
					}

					var aFilters = aPropNames.map(function (sPropName) {
						return new Filter(
							sPropName,
							sap.ui.model.FilterOperator.Contains,
							sValue
						);
					});
					var oFilter = new Filter({
						and: false,
						filters: aFilters
					});
					oEvent
						.getSource()
						.getBinding("items")
						.filter([oFilter]);
				},


				onPressDebug: function() {
					debugger;
				},

				/**
				 * Standard function to display ajax call error
				 * @param  {object} oReject Object with error description
				 * @return {undefined}      Nothing to return
				 */
				standardAjaxErrorDisplay: function (oReject) {
					//Check if there are any message with the error
					if (
						oReject &&
						oReject.error &&
						oReject.error.responseJSON &&
						oReject.error.responseJSON.message
					) {
						this.alert(oReject.error.responseJSON.message, "E");
					} else {
						this.alert("serverError", "E");
					}
				},

				setWithExpiry: function(key, value, ttl) {
					const now = new Date()
				
					// `item` is an object which contains the original value
					// as well as the time when it's supposed to expire
					const item = {
						value: JSON.stringify(value),
						expiry: now.getTime() + ttl * 1000 * 60,
					}
					localStorage.setItem(key, JSON.stringify(item))
				},

				getWithExpiry: function(key) {
					const itemStr = localStorage.getItem(key)
					// if the item doesn't exist, return null
					if (!itemStr) {
						return null
					}
					const item = JSON.parse(itemStr)
					const now = new Date()
					// compare the expiry time of the item with the current time
					if (now.getTime() > item.expiry) {
						// If the item is expired, delete the item from storage
						// and return null
						localStorage.removeItem(key)
						return null
					}

					var dateTimeReviver = function (key, value) {
						var a;
						if (typeof value === 'string') {
							if(key.toUpperCase().indexOf('DATE') > -1) {
								return new Date(value);
							}
						}
						return value;
					}
					return JSON.parse(item.value, dateTimeReviver)
				}
			}
		);
	}
);