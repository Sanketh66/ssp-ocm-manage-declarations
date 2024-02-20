/*global location */
sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/base/BaseController",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"com/ssp/ocm/manage/declarations/app/domain/TenderTypeItem",
		"com/ssp/ocm/manage/declarations/app/domain/TenderGroupItem",
		"com/ssp/ocm/manage/declarations/app/domain/TenderTotalItem",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/app/utils/dates",
		"sap/m/MessageToast",
		'sap/ui/core/Fragment',
		"sap/ui/model/Sorter",
		"sap/ui/core/BusyIndicator",
		"sap/m/MessageBox",
		"sap/base/Log",
		"sap/ui/core/routing/History",
	],
	function (BaseController,
		models,
		ApiFacade,
		TenderTypeItem,
		TenderGroupItem,
		TenderTotalItem,
		formatter,
		dates,
		MessageToast,
		Fragment,
		Sorter,
		BusyIndicator,
		MessageBox,
		Log,
		History) {
		"use strict";

		/**
		 * Controller for the Main view
		 * @exports com/ssp/ocm/manage/declarations/view/main/Main
		 */
		return BaseController.extend("com.ssp.ocm.manage.declarations.view.declarations.Declarations", {
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			formatStatus: formatter.formatStatus,

			formattedVariance: formatter.formattedVariance,

			formatDates: dates.toDDMMYYYY,
			formatTenderDescription: formatter.formatTenderDescription,
			formatDeclared: formatter.formatDeclared,
			// Statuses as given by /sap/opu/odata/sap/ZOC_GENERAL_SRV/ZC_OCDECLARATIONT_pos
			// example: https://devs4hana2020.mercury.ssp-intl.com/sap/opu/odata/sap/ZOC_GENERAL_SRV/ZC_OCDECLARATIONT_pos
			STATUS_SALES_PENDING: 1,
			STATUS_SYSTEM_CLOSED: 2,
			STATUS_NEEDS_APPROVAL: 3,
			STATUS_MANAGER_APPROVED: 4,
			STATUS_CLOSED_CHANGED: 5,
			STATUS_WAITING_DECL: 6,
			STATUS_WAITING_CHECK: 7,
			STATUS_AUTO_DECLARED: 8,
			STATUS_MNG_DELETED: 9,

			onInit: function () {
				BusyIndicator.hide();
				this.getRouter().getRoute("declarations").attachPatternMatched(this._onRouteMatched, this);
			},

			/**
			 * navigateToCreateDeclaration
			 * PResents a dialog explaining to the user that we will open
			 * the create declaration on a new tab/window.
			 */
			navigateToCreateDeclaration: function () {
				var that = this;
				MessageBox.information(this.getText("MSG_OPEN_CREATE_DECL_INFO"), {
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							that.doOpenCreateDeclaration();
						}
					},
				});
			},

			/**
			 * Opens the create declaration app passing a set of parameters to it.
			 * The parameters passed in are `Date`,`Site`,`Cashier`.
			 * These parameters are passed as a base64 json string to prevent users
			 * from casualling fiddling with them in the URL so we only pass a string under
			 * name `ocmState`.
			 */
			doOpenCreateDeclaration: function () {
				const oCashier = this.getModel("CashierModel").getProperty("/SelectedCashier");
				const oNavParams = this._buildParametersForCreateDeclarationNavigation(oCashier);
				const oParams = { ocmState: oNavParams.ocmState };
				const sParams = oNavParams.urlQuery;

				// If we are running in localhost we'll open the DEV instance
				const devURL = `https://devs4hana2020.mercury.ssp-intl.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#ZOC_CREATEDECL-display?${sParams}`;
				if (window.location.hostname === "localhost") {
					window.open(devURL, "_blank");
					return;
				}

				// Otherwise, let's do a cross app navigation:
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCrossAppNavigator) {
					console.log(`doOpenCreateDeclaration: Got handle to navigation service`);
					try {
						var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
							target: {
								semanticObject: "ZOC_CREATEDECL",
								action: "display"
							},
							params: oParams
						})) || ""; // generate the Hash to display a Supplier
						console.log(`doOpenCreateDeclaration: navigating to ${hash} via ui5 lib`);
						oCrossAppNavigator.toExternal({
							target: {
								shellHash: hash
							}
						});
					} catch (error) {
						// that didn't work very well. Let's try normal navigation as a last resort
						console.log(`doOpenCreateDeclaration: navigating to the create declaration app via url replacement`);
						const a = window.location;
						window.location.href = `${a.origin}/${a.pathname}#ZOC_CREATEDECL-display?${sParams}`;
					}
				});
			},


			/**
			 * 
			 * @param {*} oCashier 
			 * @returns 
			 */
			_buildParametersForCreateDeclarationNavigation: function (oCashier) {
				function pad(number, length) {
					var str = "" + number
					while (str.length < length) {
						str = '0' + str
					}
					return str
				}
				const d = oCashier.Date;
				const oNavValues = {
					Site: oCashier.Site,
					Cashier: oCashier.Cashier,
					Date: `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${d.getDate()}`
				};
				const sEncodedNavValues = encodeURIComponent(window.btoa(window.btoa(JSON.stringify(oNavValues))));
				const oParams = {
					ocmState: sEncodedNavValues,
					urlQuery: `ocmState=${sEncodedNavValues}`
				};
				return oParams;
			},


			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * onPressAmendDeclaration: Called when the user presses amend declaration.
			 * In certain cases there is no declaration. In those scenarios we instead
			 * jump to the create declaration app.
			 */
			onPressAmendDeclaration: function () {
				var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
				if (oSelectedCashier.StatusKey === this.STATUS_WAITING_DECL) {
					// Jump to the create declaration app.
					this.navigateToCreateDeclaration();
				} else {
					this.setGlobalModel(null, "AmendModel");
					this.doNavTo("amends", {}, {}, true);
				}
			},

			/**
			 * onPressDeleteDeclaration: Called when the user presses delete declaration.
			 * In certain cases there is no declaration. In those scenarios we instead
			 * jump to the create declaration app.
			 */
			onPressDeleteDeclaration: async function () {
				MessageBox.warning(this.getText("MSG_CONFIRM_DELETE_DECL"), {
					actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.DELETE,
					onClose: async function (sAction) {
						if (sAction === MessageBox.Action.DELETE) {
							var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
							if (oSelectedCashier.StatusKey !== this.STATUS_WAITING_DECL) {
								const oApi = ApiFacade.getInstance();
								BusyIndicator.show(0);
								try {
									const res = await oApi.deleteDeclaration();
									BusyIndicator.hide();
									var sText = this.getResourceBundle().getText("SUCCESS_DECL_DELETED");
									MessageToast.show(sText);
									this.doNavTo("cashier");
								} catch (error) {
									BusyIndicator.hide();
									Log.error(error);
									var sText = this.getResourceBundle().getText("FAILURE_DELETING_DECL");
									MessageToast.show(sText);
								}
							}
						}
					}.bind(this)
				});
			},


			onClickPanel: function () {
				var oPanel = this.byId('idFiltersPanel');
				if (!oPanel.getExpanded()) {
					oPanel.setExpanded(!oPanel.getExpanded());
				}
			},

			onExpandCollapse: function () {
				var oArrow = this.byId('idArrowIcon');
				var oLabel = this.byId('idFilteredLabel');

				oArrow.setVisible(!oArrow.getVisible());
				oLabel.setVisible(!oLabel.getVisible());
			},

			onFilterSelection: function () {
				var oPanel = this.byId('idFiltersPanel');
				oPanel.setExpanded(false);
			},

			onApproveDeclaration: function () {
				// eslint-disable-next-line no-warning-comments
				//TODO: Check and approval functionality.
				var oCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");
				if (oCashier.TenderFlag === 'X') {
					this.onOpenApproval();
				} else {
					this.onConfirmApproval({}, false);
					//this.doNavTo("cashier");
				}
			},

			onOpenApproval: function () {
				// creates dialog list if not yet created
				if (!this._oApproval) {
					Fragment.load({
						name: "com.ssp.ocm.manage.declarations.view.declarations.fragment.DeclarationApproval",
						controller: this
					}).then(function (oDialog) {
						this._oApproval = oDialog;
						this.getView().addDependent(this._oApproval);
						// opens the dialog
						this._oApproval.open();
					}.bind(this));
				} else {
					this._oApproval.open();
				}
			},

			onConfirmApproval: function (oEvent, bClosePopup) {
				if (bClosePopup === null || bClosePopup === undefined) {
					bClosePopup = true;
				}
				BusyIndicator.show(0);
				ApiFacade
					.getInstance()
					.approveDeclaration()
					.then(
						function () {
							var sText = this.getResourceBundle().getText("SUCCESS_MSG_APPROVAL");
							MessageToast.show(sText);
							if (bClosePopup) {
								this.onCancelApproval();
							}
							BusyIndicator.hide();
							setTimeout(
								this.onNavBack, 150
							);
						}.bind(this),
						function (oError) {
							this.onCancelApproval();
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			onCancelApproval: function () {
				if (this._oApproval) {
					this._oApproval.close();
					this._oApproval.destroy();
					this._oApproval = null;
				}
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			_onRouteMatched: async function (oEvent) {
				var oArgs = oEvent.getParameter("arguments");
				this.resetMessageModel();
				await this._onPrepareModels(oArgs);
				const { forceLoad } = await this._populateModelsIfUnset(oArgs);

				if (forceLoad) {
					this.onNavBack()
				} else {
					this._getTenderTypes();
					this._btnState();
				}
			},

			onNavBack: function () {
				var oHistory = History.getInstance(),
					sPreviousHash = oHistory.getPreviousHash();

				if (sPreviousHash !== undefined) {
					history.go(-1);
				} else {
					// If we can't go back then we need to add the history back to the browser
					// Gross but should work
					var oEventBus = sap.ui.getCore().getEventBus()
					oEventBus.subscribeOnce('LOADED', () => {
						setTimeout(() => {
							this.doNavTo("cashier");
						}, 30)
					})
					this.doNavTo("main");
				}
			},

			/**
			 * Updates buttons enabled property as a function of the declaration status
			 * @see _btnStateInner
			 */
			_btnState: function () {
				var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel");

				const oEnabled = this._btnStateInner(
					oSelectedCashier.StatusKey,
					oSelectedCashier.Cashier,
					oSelectedCashier.DecId);
				this.byId("idBtnApprove").setEnabled(oEnabled.appr);
				this.byId("idBtnAmend").setEnabled(oEnabled.amend);
				this.byId("idBtnDelete").setEnabled(oEnabled.del);

			},

			/**
			 * Defines enabled property for buttons `Amend` `Delete` and `Approve`
			 * of the declaration.
			 * SSPFI-17931 SSPFI-19734
			 *  - if there is no declaration id then the delete button should be disabled.
			 * @param {String} sStatus 
			 * @param {String} sCashier 
			 * @param {String} sDecId 
			 * @returns object with 3 flags: `amend`, `del` and `appr` 
			 * 	for amend/delete/approve buttons enablement
			 */
			_btnStateInner: function (sStatus, sCashier, sDecId) {
				let bDecIdExists = true;

				const result = function (a, d, ap) {
					return { amend: a, del: d, appr: ap };
				}

				const empty = function (s) {
					return s === null || s === undefined || s === ""
				};

				// If there is no cashier disable delete/amend. SSPFI-19878
				if (empty(sCashier)) {
					return result(false, false, false);
				}
				// when there is no DecId then delete button is disabled.
				if (empty(sDecId)) {
					bDecIdExists = false;
				}
				// In other cases the status controls it:
				// Status                    Buttons
				// 1 - Sales pending        	Amend/delete enabled, approve disabled
				// 2 - System closed        	Amend/delete disabled, approve disabled
				// 3 - Needs approval        	Amend/delete enabled, approve enabled
				// 4 - Manager approved    		Amend/delete disabled, approve disabled
				// 5 - Closed (changed)     	Amend/delete disabled, approve disabled
				// 6 - Awaiting declaration   Amend/delete enabled, approve disabled
				// 7 - Awaiting check        	Amend/delete enabled, approve enabled
				// 8 - auto declared         	Amend/delete disabled, approve disabled
				// 9 - Closed (mng deleted) 	Amend/delete disabled, approve disabled
				//
				// Note switch could be reordered to reduce LoCs but this way
				// it is easier to check against "spec" above.
				switch (sStatus) {
					case this.STATUS_SALES_PENDING:
						return result(true, true && bDecIdExists, false);

					case this.STATUS_SYSTEM_CLOSED:
						return result(false, false, false);

					case this.STATUS_NEEDS_APPROVAL:
						return result(true, true && bDecIdExists, true);

					case this.STATUS_MANAGER_APPROVED:
						return result(false, false, false);

					case this.STATUS_CLOSED_CHANGED:
						return result(false, false, false);

					case this.STATUS_WAITING_DECL:
						return result(true, false, false);

					case this.STATUS_WAITING_CHECK:
						return result(true, true && bDecIdExists, true);

					case this.STATUS_AUTO_DECLARED:
					case this.STATUS_MNG_DELETED:
						return result(false, false, false);

					default:
						return result(false, false, false);
				}
			},

			_onPrepareModels: async function (oArgs) {
				var oJSON = {
					DeclarationsList: [],
					SelectedCashier: {},
					ApproveComment: ""
				};

				var oFiltersJSON = {
					TenderTypesList: [],
					TenderGroupList: []
				}

				this.setGlobalModel(models.createJSONModel(oFiltersJSON), "TenderTypeModel");
				this.setGlobalModel(models.createJSONModel(oJSON), "DeclarationsModel");
				// check if the CashierModel exists. If not hydrate it.
				if (!this.getGlobalModel("CashierModel")) {
					const aCashItems = await ApiFacade.getInstance().getTotalCashByDeclarationId(oArgs.decid);
					var oJSON = {
						CashierList: [],
						SelectedCashier: aCashItems[0]
					};
					this.setGlobalModel(models.createJSONModel(oJSON), "CashierModel");
				}


			},

			_getTenderTypes: function () {
				BusyIndicator.show(0);
				ApiFacade.getInstance()
					.getTenderTypesList()
					.then(
						function (oResult) {
							if (oResult.results) {
								this._setTenderTypesOnModel(oResult.results);
								//console.log("Service TenderTypes:", oResult.results);
							}
							this._getTenderGroup()

						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			_getTenderGroup: function () {
				ApiFacade.getInstance()
					.getTenderGroupList()
					.then(
						function (oResult) {
							if (oResult.results) {
								this._setTenderGroupOnModel(oResult.results);
								//console.log("Service TenderGroup:", oResult.results);
							}
							this._getTableData();
						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},

			_getTableData: function () {
				ApiFacade.getInstance()
					.getCashierData()
					.then(
						function (oResult) {
							if (oResult.results) {
								this._setTenderTotalOnModel(oResult.results);
								//console.log("Service CashierData:", oResult.results);
							}
							BusyIndicator.hide();
						}.bind(this),
						function (oError) {
							this.addMessage(oError);
							BusyIndicator.hide();
						}.bind(this)
					);
			},


			/**
			 * In case the app is opened in the Declarations screen 
			 * , perhaps because of a back button from another app,
			 * the models may be unset. This function populates them.
			 */
			_populateModelsIfUnset: async function (oArgs) {
				// Takes a string like 'missing-A001-1675123200000-JDOYLE-' or 'AIOREGZHKZFMVAMFRRMI'.
				// If the first format, returns the components, otherwise returns the ID itself.
				const parseDecId = function (s) {
					const split = s.split("-");
					if (split.length === 1) {
						return {
							decid: s
						};
					}
					let forceLoad = split[0] !== 'missing'
					let decid = split[0] !== 'missing' ? split[2] : null
					return {
						site: split[1],
						date: new Date(parseInt(split[2], 10)),
						decid: decid,
						cashier: split[3],
						forceLoad
					};
				};
				const sDecId = oArgs.decid;
				const oArgsParsed = parseDecId(sDecId);

				if (oArgsParsed.decid && !oArgsParsed.forceLoad) {
					return {}; // nothing else to do.
				}
				// when we don't have a declaration id, we need to load the list and match by partial parameters:
				const oCashierModel = this.getGlobalModel("CashierModel");
				let aCashierList = oCashierModel.getProperty("/CashierList");
				if (!Array.isArray(aCashierList) || aCashierList.length === 0) {
					if (!this.isValidObject(this.getGlobalModel("StatusModel"))) {
						this._initStatusModel();
					}

					if (oArgsParsed.decid) { // we were given a key

					}

					if (!this.isValidObject(this.getGlobalModel("SummaryModel"))) {
						this._initSummaryModel();
						this.setGlobalModelProp("/SelectedSummary/Date", oArgsParsed.date, "SummaryModel");
						this.setGlobalModelProp("/SelectedSummary/Site", oArgsParsed.site, "SummaryModel");
					}
					if (!this.isValidObject(this.getGlobalModel("FiltersModel"))) {
						this._initFiltersModel();
						this.setGlobalModelProp("/FilteredSite", oArgsParsed.site, "FiltersModel");
						this.setGlobalModelProp("/FilteredDateStart", oArgsParsed.date, "FiltersModel");
					}
					// fetch cashiers list, set selectedCashier
					await this._loadStatusList();
					await this._loadCashierList(true, oArgsParsed.date, oArgsParsed.date);
					// one of the items set on /CashierList needs to go into /SelectedCashier
					aCashierList = this.getGlobalModelProp('/CashierList', 'CashierModel');
					// Can we find the item with this date,site,cashier?
					const oSelected = aCashierList.find(c => c.Site === oArgsParsed.site
						&& c.Cashier === oArgsParsed.cashier);
					this.setGlobalModelProp("/SelectedCashier", oSelected, 'CashierModel');
				}
				return oArgsParsed
			},



			_setTenderTotalOnModel: function (aTenderList) {
				if (aTenderList) {
					var aTenders = [];
					aTenderList.forEach(function (oTender) {
						var oTenderItem = new TenderTotalItem(oTender, true);
						aTenders.push(oTenderItem);
						oTender.to_tt.results.forEach(function (oTenderChild) {
							var oTenderChildItem = new TenderTotalItem(oTenderChild, false);
							aTenders.push(oTenderChildItem);
						});
					});
					for (var i = 1; i < aTenders.length; i++) {
						aTenders[i].varianceN= (parseFloat(aTenders[i].Conv_Declared) - parseFloat(aTenders[i].Sales)).toFixed(3);
					}
					aTenders[0].varianceN = 0;
					for (var i = 1; i < aTenders.length; i++) {
						aTenders[0].varianceN = parseFloat(aTenders[0].varianceN) + parseFloat(aTenders[i].varianceN);
					}

					//aTenders.slice(0,1);
					
					this.setGlobalModelProp("/DeclarationsList", aTenders, "DeclarationsModel");
					//console.table("Full parsed list:", aTenders);
				}
			},

			_setTenderGroupOnModel: function (aTenderGroupList) {
				if (aTenderGroupList) {
					var aTendersGroups = [];
					aTenderGroupList.forEach(function (oTender) {
						var oTenderGroup = new TenderGroupItem(oTender);
						aTendersGroups.push(oTenderGroup);
					});
					this.setGlobalModelProp("/TenderGroupList", aTendersGroups, "TenderTypeModel");
					//console.table("Tender group parsed list:", aTendersGroups);
				}
			},

			_setTenderTypesOnModel: function (aTenderTypesList) {
				if (aTenderTypesList) {
					var aTenderTypes = [];
					aTenderTypesList.forEach(function (oTender) {
						var oTenderGroup = new TenderTypeItem(oTender);
						aTenderTypes.push(oTenderGroup);
					});
					this.setGlobalModelProp("/TenderTypesList", aTenderTypes, "TenderTypeModel");
					//console.table("Tender types parsed list:", aTenderTypes);
				}
			}

		});
	}
);