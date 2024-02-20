/*global location */
sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/base/BaseController",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/app/utils/dates",
		"com/ssp/ocm/manage/declarations/app/domain/CashierItem",
		'sap/ui/core/Fragment',
		"sap/ui/model/Sorter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/ColumnListItem",
		"sap/m/Text",
		"sap/ui/core/Icon",
		"sap/ui/core/BusyIndicator",
		"sap/ui/core/Item",
		"sap/ui/model/type/Float"
	],
	function (BaseController, 
		models, 
		ApiFacade, 
		formatter, 
		dates, 
		CashierItem, 
		Fragment, 
		Sorter, 
		Filter, 
		FilterOperator,
		ColumnListItem,
		Text,
		Icon,
		BusyIndicator,
		Item,
		FloatType) {
		"use strict";

		/**
		 * Controller for the Main view
		 * @exports com/ssp/ocm/manage/declarations/view/main/Main
		 */
		return BaseController.extend("com.ssp.ocm.manage.declarations.view.cashier.Cashier", {
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			formatStatus: formatter.formatStatus,
			formatDates: dates.toDDMMYYYY,
			formatFilteredBy: formatter.formatFilteredBy,
			formatIconVisibility: formatter.formatIconVisibility,
			formatNumbers: formatter.formatNumbers,
			formatVARIANCE_VALUE_1:formatter.formatVARIANCE_VALUE_1,

			onInit: function () {
				this.getRouter().getRoute("cashier").attachPatternMatched(this._onRouteMatched, this);
				BusyIndicator.hide();
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Get the item clicked on the table and get its binding path to set its value on SelectedCashier prop.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			onNavDeclarations: function (oEvent) {
				var oElement = oEvent.getSource();

				if(this.isValidObject(oElement)) {
					var sPath = oElement.getBindingContextPath();
					const oCashier = this.getGlobalModelProp(sPath, 'CashierModel');
					this.setGlobalModelProp("/SelectedCashier", oCashier, 'CashierModel');
					let sDecId = "missing";
					try {
						sDecId = oCashier.DecId ? oCashier.DecId : `missing-${oCashier.Site}-${oCashier.Date.getTime()}-${oCashier.Cashier}-`; // note:
						// it is possible decId is empty. When this happens, we pass a fixed string
						// followed by: site, date, cashier
					} catch (error) { 
						sDecId = "missing"; // navigation will still work. Refreshing on that screen will not work
					}
					this.doNavTo("declarations", {
						decid: sDecId
					});
				}
			},

			/**
			 * Handles the panel expand property.
			 * @returns {null}	-Returns nothing
			 */
			onClickPanel: function () {
				var oPanel = this.byId('idFiltersPanel');
				oPanel.setExpanded(!oPanel.getExpanded());
			},

			/**
			 * Change the visibility of icon and filter label on panel when the expand property is changed.
			 * @returns {null}	-Returns nothing
			 */
			onExpandCollapse: function (){
				var oArrowUp = this.byId('idArrowIconUp');
				var oArrowDown = this.byId('idArrowIconDown');
				var oLabel = this.byId('idFilteredLabel');

				oArrowUp.setVisible(!oArrowUp.getVisible());
				oArrowDown.setVisible(!oArrowDown.getVisible());
				oLabel.setVisible(!oLabel.getVisible());
			},

			/**
			 * Change the filter value on model and denies deselection of the last value.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			onChangeFilterSite: function (oEvent) {
				var oMultiCombo = oEvent.getSource(),
					aSelectedSites = oMultiCombo.getSelectedItems(),
					aAllKeys = [];
				
				aAllKeys = aSelectedSites.map(function (oItem) {
					return oItem.getProperty("key");
				});

				if(aAllKeys.length !== 0) {
					this.setGlobalModelProp("/FilteredSite", aAllKeys, "CashierFiltersModel");
				}
			},

			/**
			 * Set the binding filtering when the user ends selecting sites on dropdown.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			onFinishSiteFilter: function (oEvent) {
				var aSelectedSites = oEvent.getParameter('selectedItems'),
					aAllKeys = [];
				var oBinding = this.byId("idCashierTable").getBinding("items"),
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "Site" && oFilter.sPath !== undefined; }) || [];

				//All site keys from the parameter
				aAllKeys = aSelectedSites.map(function (oItem) {
					return oItem.getProperty("key");
				});

				if(aAllKeys.length !== 0) {
					this.setGlobalModelProp("/FilteredSite", aAllKeys, "CashierFiltersModel");
					aFilters.push(this._getSiteFilter());
					oBinding.filter(aFilters.flat());
				} else {
					oBinding.filter(aFilters.flat());
					this._reloadData(true);
				}
			},

			/**
			 * Filters the table's model by the cashier settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeCashierFilter: function () {
				var sFilteredCashier = this.getGlobalModelProp("/FilteredCashier", "CashierFiltersModel"),
					oBinding = this.byId("idCashierTable").getBinding("items"),
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "Cashier"; }) || [];

				if (undefined !== sFilteredCashier && sFilteredCashier !== "" && sFilteredCashier !== "All") {
					aFilters.push(
						new Filter("Cashier", FilterOperator.EQ, sFilteredCashier)
					);
				}
				
				oBinding.filter(aFilters);
			},

			/**
			 * Filters the table's model by the status settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeStatusFilter: function () {
				var sFilteredStatus = this.getGlobalModelProp("/FilteredStatus", "CashierFiltersModel"),
					oBinding = this.byId("idCashierTable").getBinding("items"),
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "StatusKey"; }) || [];

				if (undefined !== sFilteredStatus && sFilteredStatus !== "" && sFilteredStatus !== "All" ) {
					aFilters.push(
						new Filter("StatusKey", FilterOperator.EQ, parseInt(sFilteredStatus, 10))
					);
				}

				oBinding.filter(aFilters);
			},

			/**
			 * Filters the table's model by the variance settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeVarianceFilter: function () {
				var sFilteredVariance = this.getGlobalModelProp("/FilteredVariance", "CashierFiltersModel"),
					oBinding = this.byId("idCashierTable").getBinding("items"),
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "Variance"; }) || [];

				if (sFilteredVariance === "Variances") {
					aFilters.push(
						new Filter("Variance", FilterOperator.NE, Number(0).toFixed(2))
					);
				}

				oBinding.filter(aFilters);
			},

			/**
			 * Reload the table data with the date values on the FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeDateFilter: function () {
				this._reloadData();
			},

			/**
			 * Opens the sorting dialog.
			 * @returns {null}	-Returns nothing
			 */
			onOpenReordering: function () {
				// creates dialog list if not yet created
				if (!this._oSorter) {
					Fragment.load({
						name: "com.ssp.ocm.manage.declarations.view.cashier.fragment.ViewSettingsDialog",
						controller: this
					}).then(function(oDialog){
						this._oSorter = oDialog;
						this.getView().addDependent(this._oSorter);
						// opens the dialog
						this._oSorter.open();
					}.bind(this));
				} else {
					this._oSorter.open();
				}
			},

			/**
			 * Sorts the table by the values that were selected on Sorting Dialog.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			handleConfirmSorting: function (oEvent) {
				var oSortItem = oEvent.getParameter("sortItem"),
					sSortField = oSortItem.getProperty("key"),
					bDescending = oEvent.getParameter("sortDescending"),
					oSort = new Sorter(sSortField, bDescending),
					oBinding = this.byId("idCashierTable").getBinding("items");

				oBinding.sort(oSort);
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			_onRouteMatched: function (oEvent) {
				// Note: This controller assumes some models are already setup by the main controller. 
				// If some models are not setup then we take the easy approach of navigating back 
				// to the main route. - SSPFI-18585
				var oVariance = oEvent.getParameter("arguments").Variance;
				// var ovalue = this.formatVARIANCE_VALUE_1(oVariance);
				this.getView().getModel("ViewModel").setProperty("/VarianceDecimal",oVariance);
				if( !this.isValidObject(this.getGlobalModel("SummaryModel")) ) {
					this.doNavTo("main");
					return;
				}
				this.resetMessageModel();
				this.byId("idCashierTable").setVisible(false);
				this._onPrepareModels();
			},

			/**
			 * Prepares the model and set if there is new data or have to reload.
			 * @returns {null} - Returns nothing
			 */
			_onPrepareModels: function () {
				var bReload = true;
				
				if(!this.isValidObject(this.getGlobalModel("CashierFiltersModel"))){
					var oFiltersJSON = {
						SiteFilterList: this.getGlobalModelProp("/SiteFilterList", "FiltersModel").filter(function (oSite) { return oSite.Site !== "All"; }),
						StatusFilterList: this.getGlobalModelProp("/StatusFilterList", "FiltersModel"),
						FilteredVariance: "",
						FilteredStatus: "",
						SelectedSites: []
					}
					
					this.setGlobalModel(models.createJSONModel(oFiltersJSON), "CashierFiltersModel");

					//DEFAULT VALUES
					var oSelectedSummary = this.getGlobalModelProp("/SelectedSummary", "SummaryModel");
					this.setGlobalModelProp("/FilteredDateStart", oSelectedSummary.Date, "CashierFiltersModel");
					this.setGlobalModelProp("/FilteredDateEnd", oSelectedSummary.Date, "CashierFiltersModel");
					this.setGlobalModelProp("/FilteredSite", [oSelectedSummary.Site], "CashierFiltersModel");
					this.setGlobalModelProp("/SelectedSites", [new Item({ key: oSelectedSummary.Site })], "CashierFiltersModel");
					
					this.byId("idComboSite").setSelectedKeys([oSelectedSummary.Site]);

					bReload = false;
				}

				if(!this.isValidObject(this.getGlobalModel("CashierModel"))){
					var oJSON = {
						CashierList: [],
						SelectedCashier: {}
					};
					this.setGlobalModel(models.createJSONModel(oJSON), "CashierModel");
				}

				if (bReload) { 
					this._reloadData(); 
					this.byId("idComboSite").rerender(); 
				} else { 
					this._loadCashierList(); 
				}
			},



			/**
			 * Reload the page with the dates on .
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			_reloadData: function () {
				return this._loadCashierList(true);
			},

			/**
			 * Creates the site filter based on the data obtained by the service.
			 * @returns {null}	-Returns nothing
			 */
			_getSitesFilterList: function () {
				var aSummaryList = this.getGlobalModelProp('/CashierList', 'CashierModel'),
					aResult = [],
					aAux = [];

				aSummaryList
					.map(
						function (oSite) {
							return oSite.Site; //'Creates' a String array containing only the sites keys
						}
					).forEach(
						function (sSite, iIndex, oSelf) {
							if(oSelf.indexOf(sSite) === iIndex) {
								aAux.push(iIndex); //Push only unique keys
							}
						}
					);

				//Creates a simpler object so its easier to maintain
				aAux.forEach(function (iIndex) {
					aResult.push({
						Site: aSummaryList[iIndex].Site,
						SiteDesc: aSummaryList[iIndex].SiteDesc
					});
				})

				aResult = aResult.sort((a, b) => a.SiteDesc.localeCompare(b.SiteDesc))


				this.setGlobalModelProp("/SiteFilterList", aResult, "CashierFiltersModel");
			},


			_setCashiersOnModel: function(aCashierList, bReload) {
					BaseController.prototype._setCashiersOnModel.call(this, aCashierList, bReload);
					this._getCashierFilterList();
					this._bindTableRows(bReload);
			},


			_getCashierFilterList: function () {
				var aCashierList = this.getGlobalModelProp('/CashierList', 'CashierModel'),
					aResult = [],
					aAux = [];

				aCashierList
					.map(
						function (oCashier) {
							return oCashier.Cashier;
						}
					).forEach(
						function (sCashier, iIndex, oSelf) {
							if(oSelf.indexOf(sCashier) === iIndex) {
								aAux.push(iIndex);
							}
						}
					);

				aAux.forEach(function (iIndex) {
					aResult.push({
						Cashier: aCashierList[iIndex].Cashier,
						CashierDesc: aCashierList[iIndex].CashierDesc
					});
				})

				aResult.unshift({
					Cashier: "All",
					CashierDesc: this.getResourceBundle().getText("SHOW_ALL_FILTER")
				});

				this.setGlobalModelProp("/CashierFilterList", aResult, "CashierFiltersModel");

			},

			_bindTableRows: function (bReload) {
				var oCashierTable = this.byId("idCashierTable"),
					oSelectedSummary = this.getGlobalModelProp("/SelectedSummary", "SummaryModel"),
					oCashierModel = this.getGlobalModel("CashierModel");

				if(this.isValidObject(oCashierTable.getBinding("items"))){
					oCashierTable.unbindItems();
				}

				var aFilters = bReload ? 
						this._getSiteFilter()
						:
						[new Filter("Site", FilterOperator.EQ, oSelectedSummary.Site)];

				oCashierModel.setSizeLimit((oCashierModel.getProperty("/CashierList") || []).length);
				oCashierTable.setModel(oCashierModel);
				oCashierTable.bindItems({
					path: '/CashierList',
					template: this._createTemplate(),
					// sorter: new Sorter('Cashier', false)
				});
				oCashierTable.getBinding("items").filter(aFilters);
				this._reloadFilters();
				
				oCashierTable.setVisible(true);
				
				BusyIndicator.hide();
			},


			formatVARIANCE_VALUE_1: function(iVarianc) {
				if(iVarianc<0){
					return iVarianc*(-1);
				}
				else {
					return iVarianc*(-1);
				}
			},

			/**
			 * Builds a ui5 model filter from the value in the field
			 * @returns 
			 */
			_getSiteFilter: function () {
				var aSelectedSites = this.byId("idComboSite").getSelectedKeys(), 
					aInnerFilter = aSelectedSites.map(function (sSite) {
						return new Filter("Site", FilterOperator.EQ, sSite);
					});

				if(aInnerFilter && Array.isArray(aInnerFilter) && aInnerFilter.length > 0) {
					return [new Filter({
						filters: aInnerFilter,
						and: false //important to establish that the filters are not exclusive one with another
					})];
				}
				return [];

			},

			_createTemplate: function () {
				var oRow = new ColumnListItem();
				oRow.setType("Navigation");
				oRow.addStyleClass("rowColor");
				oRow.attachPress(this.onNavDeclarations.bind(this));

				var oSiteText = new Text({
						text: { 
							parts: ["SiteDesc", "Site"],
							formatter: formatter.formatSiteNameDropdown
						}
					}),
					oCashierText = new Text({text: "{CashierDesc}"}),
					oDateText = new Text(),
					oTenderFlagIcon = new Icon(),
					oCashierFlagIcon = new Icon(),
					oSalesText = new Text(),
					oDeclaredText = new Text(),
					oVarianceText = new Text(),
					oStatusText = new Text({text:"{Status}"});

				oDateText.bindText({path:"Date", formatter: this.formatDates.bind(this)});
				
				oTenderFlagIcon.bindProperty("visible", {path:"TenderFlag", formatter: this.formatIconVisibility.bind(this)});
				oTenderFlagIcon.setSrc("sap-icon://accept")
				oTenderFlagIcon.setColor("#000000")
				oTenderFlagIcon.addStyleClass("iconSizeRow");
				
				oCashierFlagIcon.bindProperty("visible", {path:"CashierFlag", formatter: this.formatIconVisibility.bind(this)});
				oCashierFlagIcon.setSrc("sap-icon://accept")
				oCashierFlagIcon.setColor("#000000")
				oCashierFlagIcon.addStyleClass("iconSizeRow");
				
				//Formatting the numbers for proper sorting
				// oSalesText.bindText({path:"Sales", formatter: this.formatNumbers.bind(this)});
				const oType = new FloatType({
					minFractionDigits: 2,
					maxFractionDigits: 2
				}); 
				oSalesText.bindText({ path:"Sales", type: oType });
				oDeclaredText.bindText({path:"Declared", type: oType });
				oVarianceText.bindText({path:"Variance", type: oType });

				oRow.addCell(oSiteText);
				oRow.addCell(oCashierText);
				oRow.addCell(oDateText);
				oRow.addCell(oTenderFlagIcon);
				oRow.addCell(oCashierFlagIcon);
				oRow.addCell(oSalesText);
				oRow.addCell(oDeclaredText);
				oRow.addCell(oVarianceText);
				oRow.addCell(oStatusText);

				return oRow;
			},

			_reloadFilters: function () {
				this.onChangeCashierFilter();
				this.onChangeStatusFilter();
				this.onChangeVarianceFilter();
			}
		});
	}
);