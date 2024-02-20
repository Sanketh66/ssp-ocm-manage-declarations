/*global location */
sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/base/BaseController",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/app/utils/dates",
		"com/ssp/ocm/manage/declarations/app/domain/SiteItem",
		"com/ssp/ocm/manage/declarations/app/domain/StatusItem",
		'sap/ui/core/Fragment',
		"sap/ui/model/Sorter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/ColumnListItem",
		"sap/m/Text",
		"sap/ui/core/Icon",
		"sap/ui/core/BusyIndicator"
	],
	function (BaseController, 
		models, 
		ApiFacade, 
		formatter, 
		dates, 
		SiteItem, 
		StatusItem,
		Fragment,
		Sorter,
		Filter, 
		FilterOperator, 
		ColumnListItem,
		Text,
		Icon,
		BusyIndicator) {
		"use strict";

		/**
		 * Controller for the Main view
		 * @exports com/ssp/ocm/manage/declarations/view/main/Main
		 */
		return BaseController.extend("com.ssp.ocm.manage.declarations.view.main.Main", {
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */
			formatStatus: formatter.formatStatus,
			formatDates: dates.toDDMMYYYY,
			formatFilteredBy: formatter.formatFilteredBy,
			formatVARIANCE_VALUE_1: formatter.formatVARIANCE_VALUE_1,
			formatIconVisibility: formatter.formatIconVisibility,

			onInit: function () {
				BusyIndicator.hide();
				// this.createMessagePopover();
				this.resetMessageModel();
				this.getRouter().getRoute("main").attachPatternMatched(this._onRouteMatched, this);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Handles the navigation on selection a Site Summary to Cashier Screen.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			onNavCashier: function (oEvent) {
				var oElement = oEvent.getSource();
				var oVarianceValue = oEvent.getSource().getBindingContext().getObject().VarianceDecimal

				//If the element is valid we can get the path to the model to set the property
				if(this.isValidObject(oElement)) {
					var sPath = oElement.getBindingContextPath();
					this.setGlobalModelProp("/SelectedSummary", this.getGlobalModelProp(sPath, 'SummaryModel'), 'SummaryModel');
					// this.setGlobalModel(null, "CashierFiltersModel"); //Clean the model if it exists
					const filterModel = this.getGlobalModel("FiltersModel")
					this.setWithExpiry('FiltersModel', filterModel.oData, 10)
					// this.doNavTo("cashier")
					this.doNavTo("cashier",
					{Variance : oVarianceValue});
				}
			},

			/**
			 * Changes the expand status on the panel.
			 * @returns {null}	-Returns nothing
			 */
			onClickPanel: function () {
				var oPanel = this.byId('idFiltersPanel');
				oPanel.setExpanded(!oPanel.getExpanded());
			},

			/**
			 * Sets the visibility of the icons and filtered label on expanding and collapse.
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
			 * Filters the table's model by the sites settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeSiteFilter: function () {
				var sFilteredSite = this.getGlobalModelProp("/FilteredSite", "FiltersModel"),
					oBinding = this.byId("idSummaryTable").getBinding("items"),
					//Deletes the Site previous filter
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "Site"; }) || [];

				//If the sFilteredStatus value is valid then add the filter
				if (undefined !== sFilteredSite && sFilteredSite !== "" && sFilteredSite !== "All") {
					aFilters.push(
						new Filter("Site", FilterOperator.EQ, sFilteredSite)
					);
				}
				
				oBinding.filter(aFilters);
			},

			/**
			 * Filters the table's model by the status settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeStatusFilter: function () {
				var sFilteredStatus = this.getGlobalModelProp("/FilteredStatus", "FiltersModel"),
					oBinding = this.byId("idSummaryTable").getBinding("items"),
					//Deletes the Status previous filter
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "StatusKey"; }) || [];

				//If the sFilteredStatus value is valid then add the filter
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
				var sFilteredVariance = this.getGlobalModelProp("/FilteredVariance", "FiltersModel"),
					oBinding = this.byId("idSummaryTable").getBinding("items"),
					//Deletes the Variances previous filter
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "VarianceFlag"; }) || [];

				if (sFilteredVariance === "Variances") { //Only add filters if the key is 'Variances'
					aFilters.push(
						new Filter("VarianceFlag", FilterOperator.EQ, 'X')
					);
				}

				oBinding.filter(aFilters);
			},

			/**
			 * Filters the table's model by the date settled on FiltersModel.
			 * @returns {null}	-Returns nothing
			 */
			onChangeDateFilter: function () {
				var oBinding = this.byId("idSummaryTable").getBinding("items"),
					aFilters = oBinding.aFilters.filter(function (oFilter) { return oFilter.sPath !== "Date"; }) || [];

				//Gets the date filters
				aFilters = this._addDateFilter(aFilters);

				oBinding.filter(aFilters);
			},

			/**
			 * Opens a ViewSettingsDialog to select the sorting preferences.
			 * @returns {null}	-Returns nothing
			 */
			onOpenReordering: function () {
				// creates dialog list if not yet created
				if (!this._oSorter) {
					Fragment.load({
						name: "com.ssp.ocm.manage.declarations.view.main.fragment.ViewSettingsDialog",
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
			 * Get the sorting preferences and sort the table.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 * 
			 * 
			 * 
			 * 
			 * 
			 */
			handleConfirmSorting: function (oEvent) {
				var oSortItem = oEvent.getParameter("sortItem"),
					sSortField = oSortItem.getProperty("key"), //Selected field to sort by
					bDescending = oEvent.getParameter("sortDescending"), //If descending/ascending
					oSort = new Sorter(sSortField, bDescending), //Sorter object
					oBinding = this.byId("idSummaryTable").getBinding("items"); //Table binding

				oBinding.sort(oSort);
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */
			
			_onRouteMatched: function () {
				this.byId("idSummaryTable").setVisible(false);
				this._onPrepareModels();
				this.applyStartupParams();
			},

			/**
			 * Prepares the FiltersModel and the SummaryModel to work on them. 
			 * StatusModel will be used in the whole app. So we load it on this first screen
			 * so we can use it on every screen filter.
			 * @returns {null}	-Returns nothing
			 */
			_onPrepareModels: function () {
				var bReload = true;
				if( !this.isValidObject(this.getGlobalModel("SummaryModel")) ) {
					this._initSummaryModel();
					bReload = false;
				}

				if( !this.isValidObject(this.getGlobalModel("StatusModel")) ) {
					this._initStatusModel();
					bReload = false;
				}

				if( !this.isValidObject(this.getGlobalModel("FiltersModel")) ) {
					this._initFiltersModel();
					bReload = false;
				}
				
				this._loadData(bReload);
			},

			/**
			 * The app can start with a `site` parameter in which case it will be used to pre-filter 
			 * the site in the header.
			 */
			applyStartupParams: function() {
				const oModel = this.getOwnerComponent().getModel("startupParams");
				// SSPFI-19668: If decid is given as a controller we need to navigate to declaration screen
				if (oModel && oModel.getProperty("/DecId")) {
					this.doNavTo("declarations", {
						decid: oModel.getProperty("/DecId")
					});
				}
				if (oModel && oModel.getProperty("/Site")) {
					this.setGlobalModelProp("/FilteredSite", oModel.getProperty("/Site"), "FiltersModel");
				}
			},

			/**
			 * Calls the StatusList endpoint so we can get the Status texts and values.
			 * after that we call the _loadSitesSummaryData to load the Table data.
			 * @param {Boolean} 	bReload	Determines if you are reloading or not
			 * @returns {null}	-Returns nothing
			 */
			_loadData: function (bReload) {
				BusyIndicator.show(0);
				ApiFacade.getInstance()
					.getStatusList()
					.then(
						function (oResult) {
							if(!bReload) {
								this._setStatusOnModel(oResult.results);
							}
							this._loadSitesSummaryData(bReload);
						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},



			/**
			 * Call the site summary endpoint and set its data inside the model for the table.
			 * After the call we get the HistoryDays to set the Date Filter initial values. 
			 * @param {Boolean}	bReload	Determines if its a reload.
			 * @returns {null}	-Returns nothing
			 */
			_loadSitesSummaryData: function (bReload) {
				ApiFacade.getInstance()
					.getSitesSummaryList(bReload)
					.then(
						function (oResult) {
							this._setSitesOnModel(oResult.results);
							if(!bReload) {
								this._getHistoryDays();
							} else {
								this._bindTableRows();
							}
						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			/**
			 * Get the sites returned by the service and set them on the model.
			 * @param {Array} aSitesList - Sites array returned by the service
			 * @returns {null}	-Returns nothing
			 */
			_setSitesOnModel: function (aSitesList) {
				if(aSitesList){
					//Creating a more simple object and push it to the model
					var aSites = [],
						aStatusList = this.getGlobalModelProp("/StatusList", "StatusModel");

					aSitesList.forEach( function(oSite) {
						aSites.push(new SiteItem(oSite, aStatusList));
					});
					for(var i =0; i<aSites.length; i++){
						if(aSites[i].Variance > 0){
							aSites[i].VarianceDecimal='-' + aSites[i].VarianceDecimal ;
						// aSites[i].VarianceDecimal = -Math.abs(aSites[i].VarianceDecimal);
						}
					}
					this.setGlobalModelProp('/SummaryList', aSites, 'SummaryModel');
					this._getSitesFilterList(); //Get the filter list for the FiltersModel
				}
			},

			/**
			 * Call the history endpoint so we can get the initial values for Dates filter.
			 * @param {Object} oEvent - Event params
			 * @returns {null}	-Returns nothing
			 */
			_getHistoryDays: function () {
				ApiFacade.getInstance()
					.getHistoryList()
					.then(
						function (oResult) {
							//If the result is valid then we create the table template and binding
							if(this.isValidObject(oResult) && oResult.Value) {
								this.setGlobalModelProp("/HistoryDays", 
											parseInt(oResult.Value, 10), //It returns a String
											"FiltersModel");
								if(!this._hasPreviousFilters) {
									this._setDateFilterValues(parseInt(oResult.Value, 10));
								}
								this._bindTableRows();
							}
						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			/**
			 * Create the sites filter for the dropdown.
			 * @returns {null}	-Returns nothing
			 */
			_getSitesFilterList: function () {
				var aSummaryList = this.getGlobalModelProp('/SummaryList', 'SummaryModel'),
					aResult = [],
					aAux = [];

				//We set the aAux array with unique sites values
				aSummaryList
					.map(
						function (oSite) {
							return oSite.Site; //'Creates' a String array to make it easier
						}
					).forEach(
						function (sSite, iIndex, oSelf) {
							if(oSelf.indexOf(sSite) === iIndex) {
								aAux.push(iIndex); //Check if the value is unique to push its index
							}
						}
					);

				//Iterates the indices and create a simple Object for each one 
				//and push to the resulting array
				aAux.forEach(function (iIndex) {
					aResult.push({
						Site: aSummaryList[iIndex].Site,
						SiteDesc: aSummaryList[iIndex].SiteDesc
					});
				})

				aResult = aResult.sort((a, b) => a.SiteDesc.localeCompare(b.SiteDesc))

				//Add the 'Show all' option so we can 'delete' the selected filter
				aResult.unshift({
					Site: "All",
					SiteDesc: this.getResourceBundle().getText("SHOW_ALL_FILTER")
				});

				this.setGlobalModelProp("/SiteFilterList", aResult, "FiltersModel");
			},

			/**
			 * Set the Date filter value to the value of the HistoryDays retrieved by the service.
			 * @param {Integer} iHistoryDays - Integer with the number of days to go back since today
			 * @returns {null}	-Returns nothing
			 */
			_setDateFilterValues: function (iHistoryDays) {
				var dToday = new Date();
				//The first date value of the range is Today - iHistoryDays
				this.byId("idDatePickerFilter").setDateValue(new Date(dToday.getFullYear(), 
											dToday.getMonth(), 
											dToday.getDate() - iHistoryDays));
				//The last value is today's date
				this.byId("idDatePickerFilter").setSecondDateValue(new Date());
			},

			/**
			 * Get the oldest and the youngest date of the SummaryList. Its not used anymore.
			 * @returns {null}	-Returns nothing
			 *
			_getMaxMinDates: function () {
				var aSummaryList = this.getGlobalModelProp('/SummaryList', 'SummaryModel'),
					dOldest = new Date();

				aSummaryList.forEach(
					function (oSite) {
						dOldest = dOldest > oSite.Date ? oSite.Date : dOldest;
					}
				, this);

				this.byId("idDatePickerFilter").setDateValue(dOldest);
				this.byId("idDatePickerFilter").setSecondDateValue(new Date());
			},
			*/

			/**
			 * Add date filter if there is values on the DateRange Input.
			 * @param {Array} aFilters - The Array to modify
			 * @returns {Array} - Returns the array with the dates pushed (if they exists)
			 */
			_addDateFilter: function (aFilters) {
				var dFilteredDateStart = this.getGlobalModelProp("/FilteredDateStart", "FiltersModel"),
					dFilteredDateEnd = this.getGlobalModelProp("/FilteredDateEnd", "FiltersModel");


				if(dFilteredDateStart && dFilteredDateEnd) {
					// Set first date as start of day
					dFilteredDateStart.setMilliseconds(0);
					dFilteredDateStart.setSeconds(0);
					dFilteredDateStart.setMinutes(0);
					dFilteredDateStart.setHours(0);


					// Set second date as end of day
					dFilteredDateEnd.setMilliseconds(0);
					dFilteredDateEnd.setSeconds(59);
					dFilteredDateEnd.setMinutes(59);
					dFilteredDateEnd.setHours(23);
					
					var oFilter = new Filter("Date", FilterOperator.BT, dFilteredDateStart, dFilteredDateEnd);
					aFilters.push(oFilter);
				}

				return aFilters;
			},

			/**
			 * Gets the table and creates the binding and the template for the items.
			 * Also get the DateFilter to set the binding filter
			 * @returns {null}	-Returns nothing
			 */
			_bindTableRows: function () {
				var oSummaryTable = this.byId("idSummaryTable"),
					aFilters = this._addDateFilter([]);

				if(this.isValidObject(oSummaryTable.getBinding("items"))){
					oSummaryTable.unbindItems();
				}

				oSummaryTable.setModel(this.getGlobalModel("SummaryModel"));
				oSummaryTable.bindItems({
					path: '/SummaryList',
					template: this._createTemplate(),
					sorter: new Sorter('Date', false)
				});
				oSummaryTable.getBinding("items").filter(aFilters);
				oSummaryTable.setVisible(true);

				this._reloadFilters();
				
				BusyIndicator.hide();
				var oEventBus = sap.ui.getCore().getEventBus()
				oEventBus.publish('LOADED')
			},

			/**
			 * Creates the row and its cells with every functionality and formatter for its values.
			 * @returns {Object}	-Returns the row template already settled
			 */
			_createTemplate: function () {
				var oRow = new ColumnListItem();
				oRow.setType("Navigation");
				oRow.addStyleClass("rowColor");
				oRow.attachPress(this.onNavCashier.bind(this));

				var oSiteText = new Text({
						text: {
							parts: ["SiteDesc", "Site"], 
							formatter: formatter.formatSiteNameDropdown
						}
					}),
					oDateText = new Text(),
					oTenderFlagIcon = new Icon(),
					oCashierFlagIcon = new Icon(),
					oVarianceFlagIcon = new Icon(),
					oVarianceValue = new Text(),
					oStatusText = new Text({text: "{Status}"});

				oDateText.bindText({path:"Date", formatter: this.formatDates.bind(this)});

				oTenderFlagIcon.bindProperty("visible", {path:"TenderFlag", formatter: this.formatIconVisibility.bind(this)});
				oTenderFlagIcon.setSrc("sap-icon://accept")
				oTenderFlagIcon.setColor("#000000")
				oTenderFlagIcon.addStyleClass("iconSizeRow");
				
				oCashierFlagIcon.bindProperty("visible", {path:"CashierFlag", formatter: this.formatIconVisibility.bind(this)});
				oCashierFlagIcon.setSrc("sap-icon://accept")
				oCashierFlagIcon.setColor("#000000")
				oCashierFlagIcon.addStyleClass("iconSizeRow");

				oVarianceFlagIcon.bindProperty("visible", {path:"VarianceFlag", formatter: this.formatIconVisibility.bind(this)});
				oVarianceFlagIcon.setSrc("sap-icon://accept")
				oVarianceFlagIcon.setColor("#000000")
				oVarianceFlagIcon.addStyleClass("iconSizeRow");

				oVarianceValue.bindText({path:"VarianceDecimal"});
				
				//oStatusText.bindText({path:"Status", formatter: this.formatStatus.bind(this)});

				oRow.addCell(oSiteText);
				oRow.addCell(oDateText);
				oRow.addCell(oTenderFlagIcon);
				oRow.addCell(oCashierFlagIcon);
				oRow.addCell(oVarianceFlagIcon);
				oRow.addCell(oVarianceValue);
				oRow.addCell(oStatusText);

				return oRow;
			},

			_reloadFilters: function () {
				this.onChangeSiteFilter();
				this.onChangeStatusFilter();
				this.onChangeVarianceFilter();
				this.onChangeDateFilter();
			}

			
		});
	}
);