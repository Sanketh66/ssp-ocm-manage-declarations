/* eslint-disable no-console */
/* eslint-disable no-extra-parens */
/*global location */
sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/base/BaseController",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"sap/m/MessageBox",
		"sap/ui/core/BusyIndicator",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"com/ssp/ocm/manage/declarations/app/domain/TenderItem",
		"com/ssp/ocm/manage/declarations/app/domain/Bag",
		"com/ssp/ocm/manage/declarations/app/domain/BagItem",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"com/ssp/ocm/manage/declarations/type/CurrencyAndEmpty",
		"sap/ui/core/Fragment"
	],
	function (
		BaseController,
		models,
		ApiFacade,
		MessageBox,
		BusyIndicator,
		Filter,
		FilterOperator,
		TenderItem,
		Bag,
		BagItem,
		formatter,
		CurrencyAndEmpty, // do not remove. Needed by the view
		Fragment
	) {
		"use strict";

		/**
		 * Controller for the Main view
		 * @exports com/ssp/ocm/manage/declarations/view/main/Main
		 */
		return BaseController.extend(
			"com.ssp.ocm.manage.declarations.view.amends.Amends", {

				TENDERGRP_CASH: "10", // Cash tender group
				_unitSelectionInputId: "",
				_cancelDialog: null,

				formatTenderDescription: formatter.formatTenderDescription,
				getSiteDescription: formatter.getSiteDescription,
				getSiteToolbar: formatter.getSiteToolbar,

				/* =========================================================== */
				/* lifecycle methods                                           */
				/* =========================================================== */

				onInit: function () {
					BaseController.prototype.onInit.apply(this);
					var that = this;

					BusyIndicator.hide();
					// Load some of the fragments ahead of time
					setTimeout(function () {
						that._loadFragmentsAhead();
					}, 0);

					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter
						.getRoute("amends")
						.attachPatternMatched(this.onRouteMatched, this);
				},

				/**
				 * 
				 */
				onRouteMatched: function () {
					this.resetMessageModel();
					this.onRouteMatchedAsync();
				},

				/**
				 * 
				 */
				onRouteMatchedAsync: async function () {
					this._prepareModels();
					await this.getSiteDetails(this.getGlobalModelProp("/Unit", "AmendModel"));
					// if we are given a step, lets set the wizard on that step
					if( this.isValidObject(this.getGlobalModelProp("/SelectedCashier", "CashierModel")) ) {
						var oWizard = this.byId("StepsWizard");
						// var oStep = this.byId(this.getGlobalModelProp("/CurrentStep", "AmendModel"));
						const aSteps = oWizard.getSteps();
						const sCurrentStep = this.getGlobalModelProp("/CurrentStep", "AmendModel");
						const oStep = aSteps.find(s => s.sId.endsWith(sCurrentStep));
						oWizard.setCurrentStep(oStep);
						this.setGlobalModelProp("/FloatValid", true, "AmendModel");
					}
				},


				isUserLocked: function (bReload) {
					ApiFacade
						.getInstance()
						.isUserLockedOrInactive()
							.then(
								function (aData) {
									var aRes = aData.results || [],
										bLock = aRes.reduce(function(acc, u) {
											return acc || Boolean(u.Locked) || Boolean(u.Inactive);
										}, false);
									
									this.setGlobalModelProp("/UserLocked", bLock, "AmendModel") ;
									if(bLock) {
										this.forceLockedViewIfneeded();
									} else {
										if (bReload) 	{ this._loadAllData(); }
										else 		{ this.reloadModel(); }
									}
									
								}.bind(this),
								function (oErr) {
									this.addMessage(oErr);
									this.forceLockedViewIfneeded();
									BusyIndicator.hide();
								}.bind(this)
							)
				},

				_loadAllData: function () {
					var aConfigBatch = [
						this.loadTendersForSite(),
						this.loadBagFormats(),
						this.getDefaultTender()
					],
					aDataBatch = [
						this.loadFloatValue(),
						this.loadBagsValues()
					];

					this.loadUniqueBagIds();

					BusyIndicator.show(0);
					Promise.all(aDataBatch)
						.then(
							function (oRes) {
								this._setDataOnModel(oRes);
								Promise.all(aConfigBatch)
									.then(
										this._setConfigOnModel.bind(this),
										this._stdErrorMessage.bind(this)
									);
							}.bind(this),
							this._stdErrorMessage.bind(this)
						);

				},

				_setDataOnModel: function (aResponse) {
					var oFloatResponse = aResponse[0],
						aBagsResponse = aResponse[1] ? //if there is response
									aResponse[1].results ? //if results array exists
										aResponse[1].results //then results returned
										: aResponse[1] // else aResponse[1]
									: []; //else empty array

						if(oFloatResponse) {
							this.setFloatAmount(oFloatResponse);
						} else { //default
							this.setFloatAmount({
								float_amount: "0.000",
								currency: "EUR"
							})
						}

						this.createBagAndItems(aBagsResponse);
				},
				
				_setConfigOnModel: function (aResponse) {
					var aUserTenders = aResponse[0] || [],
						sBagFormat = aResponse[1] || "",
						sDefaultTender = Object.keys(aResponse[2]).length > 0 ? 
									aResponse[2].DefaultTender : "";

					var aAvailableTenders = aUserTenders.map(
									function (oTender) {
										return new TenderItem(oTender);
									}
								);

					this.setGlobalModelProp("/AvailableTendersList", aAvailableTenders, "AmendModel");
					this.setGlobalModelProp("/BagFormat", sBagFormat, "AmendModel");
					this._getTenderVisibleKey(sDefaultTender);
					this.loadUniqueBagIds();
				},

				_getTenderVisibleKey: function (sTender) {
					var sKey = "non-bagged";
					if(sTender && Number.parseInt(sTender, 10) === 2) {
						sKey = "bagged";
					}
					this.setGlobalModelProp("/TenderVisible", sKey, "AmendModel");
					this.byId("idTendersSegmentedBtn").setSelectedKey(sKey);
				},

				_stdErrorMessage: function (oErr) {
					this.addMessage(oErr);
					BusyIndicator.hide()
				},

				_prepareModels: function () {
					var bReload = false;
					if(!this.isAlreadyLoaded()) {
						bReload = true;

						var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel"),
							oTenderJSON = {
								CurrentStep: "idStepFloat",
								UserLocked : false,
								AvailableTendersList : [],
								TenderVisible: "non-bagged",
								NonBaggedList : [],
								BaggedList : [],

								Cashier: oSelectedCashier.Cashier,
								Unit : oSelectedCashier.Site,
								DecId: oSelectedCashier.DecId,
								UnitList : [],
								Date : oSelectedCashier.Date,

								Float : 0.00,
								FloatCurrency : "EUR",
								FloatNeeded: true,
								FloatValid: false,

								Width: this.unitWidth(),
								DateWidth: this.declarationDateWidth(),
								FloatWidth: this.floatWidth(),
								StepDateValid: true,
								StepUnitValid: true/* ,
								"DirtyFlag": false */
							};
						
							//sap.ushell.services.Container.setDirtyFlag(false);
						this.setGlobalModel(models.createJSONModel(oTenderJSON), "AmendModel");
					}

					this.isUserLocked(bReload);
				},

				reloadModel: function () {
					//this._wizardAdvanceStep(); //pass from float
					this._getTenderVisibleKey(this.getGlobalModelProp("/TenderVisible", "AmendModel"));
				},

				isAlreadyLoaded: function () {
					var oSelectedCashier = this.getGlobalModelProp("/SelectedCashier", "CashierModel"),
						oAmendModel = this.getGlobalModel("AmendModel");

					if(oSelectedCashier && this.isValidObject(oAmendModel)) {
						var oProp = oAmendModel.getProperty.bind(oAmendModel);
						if(oSelectedCashier.Cashier === oProp("/Cashier")
							&& oSelectedCashier.Site === oProp("/Unit")
							&& oSelectedCashier.Date === oProp("/Date")) {
								return true;
							}
					}
					return false;
				},

				getDefaultTender: function () {
					return ApiFacade.getInstance()
							.getDefaultTender();
				},

				loadFloatValue: function () {
					BusyIndicator.show(0);
					return ApiFacade.getInstance()
						.getFloatValue()
				},

				setFloatAmount: function (oFloat) {
					this.setGlobalModelProp(
						"/Float",
						Number.parseFloat(oFloat.float_amount),
						"AmendModel"
					);
					this.setGlobalModelProp(
						"/FloatValid",
						true,
						"AmendModel"
					);
					this.setGlobalModelProp(
						"/FloatCurrency",
						oFloat.currency,
						"AmendModel"
					);
					// this._wizardAdvanceStep();
				},

				loadTendersForSite: function () {
					var sSite = this.getGlobalModelProp("/Unit", "AmendModel");
					return ApiFacade.getInstance()
						.getAllTenderTypesForUser(sSite);
				},

				getSiteDetails: function (sSite) {
					return ApiFacade
						.getInstance()
						.getDetailsForUnit(sSite)
							.then(function (oDetails) {
								const bFloatNeeded = Boolean(oDetails.FloatEntry);
								this.setGlobalModelProp(
									"/FloatNeeded",
									bFloatNeeded,
									"AmendModel"
								);
								// if float is not needed remove the float step
								if ( !bFloatNeeded ) {
									var oWizard = this.byId("StepsWizard");
									const aSteps = oWizard.getSteps();
									const oFloatStep = aSteps.find(s => s.sId.endsWith("idStepFloat"));
									if (oFloatStep) {
										oWizard.removeAllSteps();
										for (let s = 0; s < aSteps.length; s++) {
											const oStep = aSteps[s];
											if (!oStep.sId.endsWith("idStepFloat")) {
												oWizard.addStep(oStep);
											}
										}
									} 
									this.setGlobalModelProp("/CurrentStep", "idStepTenders", "AmendModel");
								}
						}.bind(this));
				},

				loadBagsValues: function () {
					BusyIndicator.show(0);
					return ApiFacade.getInstance()
						.getBagValue();
				},

				createBagAndItems: function (aItems) {
					var aBagsId = aItems.map(function (oFilteredItem) {
							return oFilteredItem.bagid;
						}).filter(function (sBagId, iIndex, oSelf) {
							return sBagId !== "" && oSelf.indexOf(sBagId) === iIndex;
						});
					
					var aBags = aBagsId.map(function (sBagId) {
						return new BagItem(sBagId)
					});
					var aNonBagged = [];

					aItems.forEach(function(oItem) {
						if(oItem.bagid !== "") {
							var oBag = aBags.find(function (oBagItem) {
								return oBagItem.BagId === oItem.bagid;
							});
							oBag.pushItem(new TenderItem(oItem));
						} else {
							aNonBagged.push(new TenderItem(oItem));
						}
					});

					var sKey = "non-bagged";
					if(aNonBagged.length > 0) {
						this.setGlobalModelProp("/TenderVisible", sKey, "AmendModel");
					} else {
						sKey = "bagged";
						this.setGlobalModelProp("/TenderVisible", sKey, "AmendModel");
					}
					this.byId("idTendersSegmentedBtn").setSelectedKey(sKey);

					this.setGlobalModelProp("/BaggedList", aBags, "AmendModel");
					this.setGlobalModelProp("/NonBaggedList", aNonBagged, "AmendModel");
				},

				/**
				 * Debug method to jump quickly to review screen
				 * @returns {void}
				 */
				onGoToReview: function () {
					this.doNavTo("review");
				},

				/* =========================================================== */
				/* step activations                                            */
				/* =========================================================== */

				

				/**
				 * Loads the WizardStepFragment
				 * @returns {Control} Loaded fragment
				 */
				getFloatStepFragment: function () {
					return this.getFragment(
						"_stepFloat",
						"com.ssp.ocm.manage.declarations.view.amends.fragment.WizardStepFloat"
					);
				},

				onStepFloatNextPressed: function () {
					return this._wizardAdvanceStep();
				},

				/**
				 * Method to jump from the last step of the wizard to the review screen.
				 * Clears all tenders with a 0 amount and navigates away.
				 * @returns {void}
				 */
				onStepTendersNextPressed: function () {
					this.doRemoveBlankTenders();
					this.doNavTo("review");
				},

				
				/**
				 * Removes blank tenders. Keeps tenders with a 0 or greater amount.
				 * @returns {void}
				 */
				doRemoveBlankTenders: function () {
					var aBags = this.getGlobalModelProp("/BaggedList", "AmendModel") || [];
					aBags = aBags.map(function (oBag) {
						oBag.TenderList = oBag.TenderList.filter(function (oTender) {
							return (oTender.Amount !== null) && (oTender.Amount !== undefined) && (Number(oTender.Amount) >= 0);
						});
						return oBag;
					});

					var aItems = this.getGlobalModelProp("/NonBaggedList", "AmendModel") || [];
					aItems = aItems.filter(function (oTender) {
						return (oTender.Amount !== null) && (oTender.Amount !== undefined) && (Number(oTender.Amount) >= 0);
					});

					this.setGlobalModelProp("/BaggedList", aBags, "AmendModel");
					this.setGlobalModelProp("/NonBaggedList", aItems, "AmendModel");
				}, 
				

				/* =========================================================== */
				/* Float: event handlers                                      */
				/* =========================================================== */


				/**
				 * Called when the float field is changed.
				 * @param {Object} oEvent Live change event
				 * @returns {void}
				 */
				onFloatValueLiveChange: function (oEvent) {
					var oInput = oEvent.getSource();
					var sValue = oEvent.getParameter("value");
					var sCurr = this.getGlobalModelProp("/FloatCurrency", "AmendModel");
					var bValid = this._validateNonNegativeAmount(sValue, sCurr);
					this.setGlobalModelProp("/FloatValid", bValid, "AmendModel");
					oInput.setValueState(!bValid ? "Error" : "None");
				},

				/* =========================================================== */
				/* Cancel: event handlers                                      */
				/* =========================================================== */

				onCancelPressed: function () {
					// creates dialog list if not yet created
					if (!this._cancelDialog) {
						Fragment.load({
							name: "com.ssp.ocm.manage.declarations.view.amends.fragment.CancelDialog",
							controller: this
						}).then(function(oDialog){
							this._cancelDialog = oDialog;
							this.getView().addDependent(this._cancelDialog);
							// opens the dialog
							this._cancelDialog.open();
						}.bind(this));
					} else {
						this._cancelDialog.open();
					}
				},

				/**
				 * Called when the user cancels the exit process.
				 * @returns {void}
				 */
				onCancelExitPressed: function () {
					if (this._cancelDialog) {
						this._cancelDialog.close();
						this._cancelDialog.destroy();
						this._cancelDialog = null;
					}
				},

				/* =========================================================== */
				/* Tender: event handlers                                      */
				/* =========================================================== */

				/**
				 * Called when the user selects Bagged/Non Bagged tender type
				 * @param {Object} oEvent Event object
				 * @returns {void}
				 */
				onTenderTypeSelectionChange: function () {
					var sTenderType = this.getGlobalModelProp("/TenderVisible", "AmendModel");
					if (sTenderType === "non-bagged") {
						sTenderType = "bagged";
					} else {
						sTenderType = "non-bagged";
					}
					this.setGlobalModelProp("/TenderVisible", sTenderType, "AmendModel");
				},

				/**
				 * Called when the user presses the add button on the Non Bagged tenders tbl.
				 * @param {Object} oEvent Event object
				 * @returns {void}
				 */
				onNonBaggedTendersAddPressed: function () {
					var that = this;
					var fDone = function () {
						that.refreshReviewDeclarationVisibility();
					};
					var fTransformer = function (oVal) {
						// Function is called when the item is pushed into /items
						return oVal;
					};
					this.openTenderSelectionDialog("/NonBaggedList", fTransformer, fDone);
				},

				/**
				 * Updates visibility of the Review declaration button,
				 * based on the amounts in the tenders and the tenders themselves.
				 * @return {void}
				 */
				refreshReviewDeclarationVisibility: function () {
					setTimeout(
						function () {
							this.byId("idBtnReviewDeclaration")
								.getBinding("visible")
								.refresh(true);
						}.bind(this),
						10
					);
				},

				/**
				 * Called when the user wants to remove a tender from the non bagged tenders
				 * @param {Event} oEvent Press Event
				 * @return {void}
				 */
				onNonBaggedTendersDeletePressed: function (oEvent) {
					var iIndex = this.indexFromPath(
						oEvent
						.getParameter("listItem")
						.getBindingContextPath()
					);
					var aItems = this.getGlobalModelProp("/NonBaggedList", "AmendModel");
					aItems.splice(iIndex, 1);
					this.setGlobalModelProp("/NonBaggedList", aItems, "AmendModel");
					this.refreshReviewDeclarationVisibility();
				},

				indexFromPath: function (sPath) {
					var iIndex = -1;
					var sIndex = sPath.match(/\/(\d+)/);
					sIndex = sIndex ? sIndex[1] : false;
					if (sIndex) {
						iIndex = parseInt(sIndex, 10);
					}
					return iIndex;
				},


				/**
				 * Called when the amount on a non bagged tender line changes.
				 * Updates the visibility of the Review declaration button.
				 * @param {Event} oEvent Change event for the input field
				 * @returns {void}
				 */
				// TODO: DELETE ME
				onItemAmountChangeRef: function (oEvent) {
					var oSource = oEvent.getSource(),
						sVal = oSource.getValue().trim(' ');
					if(sVal === "") {
						oSource.setValue('0');
					} else {
						oSource.setValue(sVal);
					}
					this.refreshReviewDeclarationVisibility();
				},

				/**
				 * Called when the amount on a non bagged tender line changes.
				 * Updates the visibility of the Review declaration button.
				 * @param {Event} oEvent Change event for the input field
				 * @returns {void}
				 */
				onItemAmountChange: function(oEvent) {
					var oSource = oEvent.getSource(),
						sVal = oSource.getValue().trim(' ');
					if(sVal === "") {
						oSource.setValue('0');
					} else {
						oSource.setValue(sVal);
					}
          this.validateTenderAmount(oEvent);
          this.refreshReviewDeclarationVisibility();
        },


				/**
         * Called on tender amount input value change.
         * @param {Event} oEvent Event object
         * @returns {void}
         */
				validateTenderAmount: function(oEvent) {
					const oInput = oEvent.getSource();
					oInput.setValueState("None");

					var id = oEvent.getSource().getId();
					const oBind = oEvent.getSource().getBindingContext("AmendModel");
					var sValue = oEvent.getParameter("newValue");
					if (sValue === "") {
						// clearing the field is ok. https://tracking.keytree.cloud/browse/SSPFI-17579
						return true;
					}
					var sCurr = oBind.getProperty(`${oBind.getPath()}/currency`);
					var bValid = this._validateNonNegativeAmount(sValue, sCurr);

					oInput.setValueState(bValid ? "None" : "Error");
					oInput.setValueStateText(
						bValid ? "" : this.getText("ERR_INVALID_TENDER")
					);
					return bValid;
				},


				/**
         * 
         * @param {String} sAmount 
         * @param {String} sCurr 
         * @returns Boolean true when valid
         */
				_validateNonNegativeAmount(sAmount, sCurr) {
					var oCurrencyFormatter = sap.ui.core.format.NumberFormat.getCurrencyInstance(
						{ currencyCode: sCurr }
					);
					var oParsed = oCurrencyFormatter.parse(sAmount);
					var bValid = oParsed !== null && Array.isArray(oParsed) && (typeof oParsed[0]) === "number" && oParsed[0] >= 0;
					return bValid;
				},


				/**
				 * Called when the user presses the add button on the Bagged tenders tbl.
				 * @param {Object} oEvent Event object
				 * @returns {void}
				 */
				onBaggedTendersAddPressed: function (oEvent) {
					var that = this;
					var sPath = oEvent
						.getSource()
						.getBindingContext("AmendModel")
						.getPath();
					var iIndex = this.bagIndexFromPath(sPath);
					if (iIndex > -1) {
						this.openTenderSelectionDialog(
							"/BaggedList/" + iIndex,
							// Pass a function that processes the item before putting in the model
							function (oItem) {
								oItem.Bagged = true;
								return oItem;
							},
							// Pass a function that will be called after the items is put in the model.
							function () {
								that.byId("idBaggedTendersVerticalLayout").invalidate(true); // force refresh of screen
								that.refreshReviewDeclarationVisibility();
							}
						);
					}
				},

				/**
				 * Called when the user wants to remove a tender from the bagged tenders
				 * @param {Event} oEvent Press Event
				 * @return {void}
				 */
				onBaggedTendersDeletePressed: function (oEvent) {
					var sPath = oEvent
						.getParameter("listItem")
						.getBindingContextPath();
					// eslint-disable-next-line no-shadow
					var parsePath = function (sPath) {
						//var iIndex = -1;
						var sMatches = sPath.match(/\/BaggedList\/(\d+)\/TenderList\/(\d+)/); // e.g. "/bags/0/items/1"
						return {
							bag: parseInt(sMatches[1], 10),
							item: parseInt(sMatches[2], 10)
						};
					};
					var pathInfo = parsePath(sPath);
					var oBag = this.getGlobalModelProp("/BaggedList/" + pathInfo.bag, "AmendModel");
					oBag.removeItem(pathInfo.item);
					this.setGlobalModelProp("/BaggedList/" + pathInfo.bag, oBag, "AmendModel");
					this.refreshReviewDeclarationVisibility();
				},

				/**
				 * Opens a the standard barcode scanner sap.ndc.BarcodeScanner
				 * @param {Function} fOnInput Function to run on successfull and validated input
				 * @returns {void}
				 */
				openBarcodeScanner: function (fOnInput) {
					var that = this;
					// add the codes of the other bags on this declaration
					that.setGlobalModelProp("/currentBag", this.newEmptyBag());
					jQuery.sap.require("sap.ndc.BarcodeScanner");
					sap.ndc.BarcodeScanner.scan(
						fOnInput,
						function () {
							 // FIXME: Do we need a handler ?
						},
						function () {
							// This function is called on change. FIXME: Do we need a handler ?
						}
					);
				},

				/**
				 * Called when the user presses the bag title.
				 * @param {*} oEvent Press event
				 * @returns {void}
				 */
				onBagTitlePressed: function (oEvent) {
					var oSource = oEvent.getSource();
					this.handleBagTitlePressed(
						oSource.getModel(),
						oSource.getBindingContext("AmendModel").getPath()
					);
				},

				handleBagTitlePressed: function (oModel, sBindingPath) {
					var that = this;
					var oBag = this.getGlobalModelProp(sBindingPath, "AmendModel");
					
					this.openBarcodeScanner(
						
						this.barcodeScanResultHandler(
							// restart function:
							function () {
								that.handleBagTitlePressed(oModel, sBindingPath);
							},
							// confirm function:
							function (sBarcode) {
								oBag.BagId = sBarcode;
								this.setGlobalModelProp(sBindingPath, oBag, "AmendModel");
							}
						)
					);
				},

				/**
				 * Called when the user searches for a value on the Unit Selection
				 * @param {Object} oEvent Value Help Event object
				 * @returns {void}
				 */
				onTenderSelectionSearch: function (oEvent) {
					// Search filtering down using field description
					this.onSelectDialogSearch(oEvent, ["TenderTypeDescription"]);
				},

				/**
				 * Called when the user selects a tender type on the Tender Selection dialog.
				 * It pushes a new item to an array in the view model, which is specified by
				 * a target path in a local model called `tenderSelection`.
				 * @param {Event} oEvent Selection event
				 * @returns {void}
				 */
				onTenderSelectionClosed: function (oEvent) {
					var aSelectedItem = oEvent.getParameter("selectedItems");
					if (Array.isArray(aSelectedItem) && aSelectedItem.length > 0) {
						var tsModel = oEvent.getSource().getModel("TenderSelectionModel"),
							sTarget = tsModel.getProperty("/target"),
							fnItemTransformer = tsModel.getProperty("/itemTransformer"),
							oTarget = this.getGlobalModelProp(sTarget, "AmendModel") || [];
						
						aSelectedItem.forEach(function (oSelection) {
							var sPath = oSelection.getBindingContextPath(),
								oTender = this.getGlobalModelProp(sPath, "AmendModel");
							
								if (fnItemTransformer) {
									oTender = fnItemTransformer.call(this, oTender);
								}

								var bExist;
								if(oTender.Bagged === true) {
									bExist = this._isTTadded(oTender, oTarget.getItems());
									if(!bExist) {
										oTarget.pushItem(oTender.clone());
									}
									
								} else {
									bExist = this._isTTadded(oTender, oTarget);
									if(!bExist) {
										oTarget.push(oTender.clone());
									}
								}
						}.bind(this));

						this.setGlobalModelProp(sTarget, oTarget, "AmendModel");
					}
				},

				_isTTadded: function (oToFind, aAlreadyBagged) {
					var bExist = false;
					if(aAlreadyBagged.length > 0) {
						bExist = Boolean(aAlreadyBagged.find(
							function (oItem) {
								return oItem.TenderType === oToFind.TenderType;
							}
						), this);
					}

					return bExist;
				},

				/**
				 * Cancels the Enter barcode dialog
				 * @param {Event} oEvent Button Event
				 * @returns {void}
				 */
				onCancelEnterBarcodePressed: function (oEvent) {
					oEvent
						.getSource()
						.getParent()
						.close();
				},

				// FIXME
				codeAlreadySubmitted: function (sCode) {
					var aSubmittedCodes = this.getGlobalModelProp("/UsedBags", "AmendModel"); // codes used in previously submitted declarations
					var bAlreadySubmitted = aSubmittedCodes.find(function (c) {
						return c === sCode;
					});
					return bAlreadySubmitted;
				},

				// FIXME
				codeAlreadyUsed: function (sCode) {
					var aBagCodes = this.getGlobalModelProp("/BaggedList", "AmendModel").map(function (oBag) {
						return oBag.BagId;
					});
					return aBagCodes.find(function (c) {
						return c === sCode;
					});
				},

				barcodeScanResultHandler: function (fnRestart, fnConfirm) {
					var that = this;
					return function (oResult) {
						var sTryAgain = that.getText("BTN_TRY_AGAIN");
						var sInvalidBarcode = that.getText(
							"BARCODE_DIALOG_CODE_ALREADY_USED"
						);

						if (!oResult.cancelled) {
							var bAlreadySubmitted = that.codeAlreadySubmitted(oResult.text);
							var bAlreadyUsed = that.codeAlreadyUsed(oResult.text);

							// Validate the entered code (oResult.text) and display that on a dialog if any error/warning
							if (!that.validBarcode(oResult.text)) {
								MessageBox.error(that.getText("ERR_INVALID_BARCODE"), {
									actions: [sTryAgain, MessageBox.Action.CANCEL],
									onClose: function (sAction) {
										if (sAction === sTryAgain) {
											fnRestart.apply(that);
										}
									}
								});
							} else {
								// The barcode is correct but may be repeated.
								if (
									bAlreadySubmitted /* in previous declarations -> warning */
								) {
									MessageBox.warning(sInvalidBarcode, {
										actions: [sTryAgain, MessageBox.Action.OK],
										onClose: function (sAction) {
											if (sAction === sTryAgain) {
												fnRestart.apply(that);
											} else if (sAction === MessageBox.Action.OK) {
												fnConfirm.apply(that, [oResult.text]);
											}
										}
									});
								} else if (bAlreadyUsed /* in this declaration -> error */ ) {
									MessageBox.error(sInvalidBarcode, {
										actions: [sTryAgain, MessageBox.Action.OK],
										onClose: function (sAction) {
											if (sAction === sTryAgain) {
												fnRestart.apply(that);
											}
										}
									});
								} else {
									// all good. Do it.
									fnConfirm.apply(that, [oResult.text]);
								}
							}
						}
					};
				},

				/**
				 * Called when the user presses "Add Bag" to scan a new barcode and subsequently add it as a bag
				 * // fixme: hardcoded messages
				 * @returns {void}
				 */
				onAddNewBagBtnPressed: function () {
					var that = this;
					this.openBarcodeScanner(
						that.barcodeScanResultHandler(
							// restart function:
							function () {
								that.onAddNewBagBtnPressed();
							},
							// confirm function:
							function (sBarcode) {
								that.addBagToDeclaration(sBarcode);
							}
						)
					);
				},

				/**
				 *
				 * @param {String} sBarcode Validates barcode against a regex in unitBagCodeFormat
				 * @return {Boolean} True when the barcode matches the regex
				 */
				validBarcode: function (sBarcode) {
					var regex = new RegExp(this.getGlobalModelProp("/BagFormat", "AmendModel"));
					var match = sBarcode.match(regex);
					return match !== null;
				},


				addBagToDeclaration: function (sBagId) {
					var aAllBags = this.getGlobalModelProp("/BaggedList", "AmendModel") || [];
					aAllBags.push(new BagItem(sBagId));
					
					this.refreshAddBagButtonVisibility();
					this.getGlobalModel("AmendModel").refresh(true);
				},

				/**
				 * @returns {void}
				 */
				refreshAddBagButtonVisibility: function () {
					setTimeout(
						function () {
							this.byId("idAddBagBtn")
								.getBinding("visible")
								.refresh(true);
						}.bind(this),
						10
					);
				},

				/**
				 * Removes a bag from /bags
				 * @param {Event} oEvent Press event
				 * @returns {void}
				 */
				onRemoveBagPressed: function (oEvent) {
					var sPath = oEvent
						.getSource()
						.getParent()
						.getBindingContext("AmendModel")
						.getPath(); // sPath is for example "/bags/3"
					// grab the index after /bags/ into an integer
					var iIndex = this.bagIndexFromPath(sPath);
					if (iIndex > -1) {
						var aBags = this.getGlobalModelProp("/BaggedList", "AmendModel");
						aBags.splice(iIndex, 1);
						this.setGlobalModelProp("/BaggedList", aBags, "AmendModel");
					}
					this.refreshAddBagButtonVisibility();
				},

				/**
				 * Returns the index of a bag given the bag path in the model.
				 * @param {String} sPath Path string to a specific bag. Example "/bags/2"
				 * @returns {Integer} The index of the bag. e.g. 2
				 */
				bagIndexFromPath: function (sPath) {
					// Fixme: can i use indexFromPath ?
					var iIndex = -1;
					var sIndex = sPath.match(/\/BaggedList\/(\d+)/);
					sIndex = sIndex ? sIndex[1] : false;
					if (sIndex) {
						iIndex = parseInt(sIndex, 10);
					}
					return iIndex;
				},

				/* =========================================================== */
				/* begin: internal methods                                     */
				/* =========================================================== */

				newEmptyBag: function () {
					return new Bag();
				},

				/**
				 * Opens the tender selection dialog and sets it up so it knows where to put the new item
				 * after selection.
				 * @param {String} sTargetProperty Target property (.e.g "/items") where to put the new tender on close
				 * @param {Function} fTransformer Function to call the item on before putting in model
				 * @param {Function} fDone to run when items are set in sTargetProperty
				 * @returns {void}
				 */
				openTenderSelectionDialog: function (
					sTargetProperty,
					fTransformer,
					fDone
				) {
					var that = this;
					var oDialog = this.openDialogFragment(
							"_tenderSelectionDialog",
							"com.ssp.ocm.manage.declarations.view.amends.fragment.TenderSelectionDialog"
						),
						oBinding = oDialog.getBinding("items");
					
						oDialog._oList.getInfoToolbar().setVisible = function () {}; // Make sure infotoolbar is never visible.
						//oBinding.filter([]); // Clear the filter
						
						oDialog.setModel(
							models.createJSONModel({
								target: sTargetProperty,
								itemTransformer: function (oItem) {
									if (fTransformer) {
										return fTransformer.call(that, oItem);
									}
									return oItem;
								},
								done: function () {
									if (fDone) {
										fDone.call(that);
									}
								}
							}),
							"TenderSelectionModel"
						);

						this.setDialogFilters(oBinding, sTargetProperty);
				},

				setDialogFilters: function (oBinding, sTarget) {
					//Clear the binding
					oBinding.filter([]);
					
					var oTarget = this.getGlobalModelProp(sTarget, "AmendModel"), //Get the target property so we can distinguish between NonBagged and Bagged
						aFilters; //this is for later

					if (oTarget instanceof BagItem) { //If its a bag
						var aAlreadyBagged = oTarget.getItems();
						aFilters = aAlreadyBagged.map(
							function (oTender) {
								return new Filter("TenderType", FilterOperator.NE, oTender.TenderType); //create a filter for each one of its tender
							}
						)
						aFilters.push(
							new Filter("TenderGroup", FilterOperator.EQ, this.TENDERGRP_CASH)
						);
					} else {
						aFilters = oTarget.map(
							function (oTender) {
								return new Filter("TenderType", FilterOperator.NE, oTender.TenderType); //create a filter for each one
							}
						)
					}

					oBinding.filter([
						new Filter({
							filters: aFilters, //set the filters and the AND operator as TRUE
							and: true
						})
					]);
				},

				/**
				 * Method to move the wizard to the next step.
				 * @returns {void}
				 */
				_wizardAdvanceStep: function () {
					var oWizard = this.byId("StepsWizard");
					if (oWizard) {
						oWizard.nextStep();
						if(oWizard.getProgress() === 4) {
							this.setGlobalModelProp("/CurrentStep", "idStepTenders", "AmendModel");
							this.setGlobalModelProp("/FloatValid", true, "AmendModel");
						} else if (oWizard.getProgress() === 3) {
							this.setGlobalModelProp("/CurrentStep", "idStepFloat", "AmendModel");
							this.setGlobalModelProp("/FloatValid", true, "AmendModel");
						}
					}
				},

				/**
				 * Loads fragments ahead of time so it's faster to open them
				 * @returns {void}
				 */
				_loadFragmentsAhead: function () {
					var that = this;
					var aFragsToLoad = [{
							field: "_tenderSelectionDialog",
							name: "TenderSelectionDialog"
						},
						{
							field: "_unitSelectionDialog",
							name: "UnitSelectionDialog"
						},
						{
							field: "_cancelDialog",
							name: "CancelDialog"
						} //,
						// {
						//   field: "_baggedTenderEnterDialog",
						//   name: "BaggedTenderEnterDialog"
						// }
					];
					aFragsToLoad.forEach(function (f) {
						that.getFragment(
							f.field,
							"com.ssp.ocm.manage.declarations.view.amends.fragment." + f.name
						);
					});
				},

				/**
				 * Helper function for retrieving fragments and opening them
				 * @public
				 * @param  {string} sProperty     The property in which the control will be stored and retrieved
				 * @param  {string} sFragmentName The fragment name (optional after the first call)
				 * @return {sap.ui.core.Control}  The control insided the fragment
				 */
				openDialogFragment: function (sProperty, sFragmentName) {
					var oDialog = this.getFragment(sProperty, sFragmentName);

					this.getView().addDependent(oDialog);
					oDialog.open();
					return oDialog;
				},

				/**
				 * Fetches the last N months of declarations and from that, builds
				 * a list of unique bag Ids. Sets this information under /usedBagIds
				 * @return {Promise} Promise to array of String (bag ids)
				 */
				loadUniqueBagIds: function () {
					var that = this;
					var oApi = ApiFacade.getInstance();
					return oApi
						.getUsedBagIds()
						.then(function (aBags) {
							that.setGlobalModelProp("/UsedBags", aBags, "AmendModel");
							BusyIndicator.hide();
						})
						.catch(function (oErr) {
							that.addMessage(oErr);
							that.setGlobalModelProp("/UsedBags", [], "AmendModel");
							BusyIndicator.hide();
						});
				},

				loadBagFormats: function () {
					// var that = this;
					var oApi = ApiFacade.getInstance();
					return oApi
						.getBagFormatForSite(this.getGlobalModelProp("/Unit", "AmendModel"))
						// .then(function (sBagFormat) {
						// 	that.setGlobalModelProp("/BagFormat", sBagFormat, "AmendModel");
						// 	BusyIndicator.hide();
						// })
						// .catch(function (oErr) {
						// 	that.setGlobalModelProp("/BagFormat", "", "AmendModel");
						// 	that.addMessage(oErr);
						// 	BusyIndicator.hide();
						// });
				},

				/* =========================================================== */
				/* Formatters                                                  */
				/* =========================================================== */

				/**
				 * Checks the items in the declaration. If there is at least one item and all have amounts
				 * then the declaration is valid.
				 * https://tracking.keytree.cloud/browse/SSPFI-6601
				 * @param {Array} aBags Bags of items
				 * @param {Array} aItems Array of unbagged items
				 * @return {Boolean} True if the items (bagged or not) are valid
				 */
				reviewDeclarationVisible: function (aBags, aItems, bFloatValid) {
					// zeros are allowed as amounts - https://tracking.keytree.cloud/browse/SSPFI-19512
					var amountOk = function(s) {
						return (
							(typeof s === "string" &&
								s.length > 0 &&
								parseFloat(s) >= 0 &&
								!isNaN(parseFloat(s))) ||
							(typeof s === "number" && s >= 0) ||
							(typeof s === "object" && s !== null && amountOk(s[0])) // We may get a currency which is an array of amount/curr
						);
					};
					// Function that checks validity of an array of items.
					var fItemsValid = function (itemsArray) {
						var sizeOk = itemsArray && itemsArray.length > 0;
						var contentOk =
							itemsArray &&
							itemsArray.reduce(function (acc, item) {
								return acc && amountOk(item.Amount);
							}, true);
						return sizeOk && contentOk;
					};
					// Function that checks validity of bags.
					var bagsOk =
						(Array.isArray(aBags) && aBags.length === 0) ||
						(aBags &&
						aBags.reduce(function (acc, oBag) {
							return acc && fItemsValid(oBag.TenderList);
						}, true));

					// check unbagged items but ignore empty amounts
					const aItemsWithAmounts = aItems.filter(a=>a.Amount);
					var unbaggedItemsOk = aItemsWithAmounts.length === 0 || fItemsValid(aItemsWithAmounts);

					console.log(
						"reviewDeclarationVisible: Unbagged Items OK = " + unbaggedItemsOk
					);
					console.log("reviewDeclarationVisible: Bags OK = " + bagsOk);

					return bagsOk && unbaggedItemsOk && bFloatValid;
				},

				/**
				 * Returns width of Unit field for desktop and mobile.
				 * @returns {String} e.g. "10%"
				 */
				unitWidth: function () {
					var isPhone = this.getDeviceModel().getProperty("/system/phone");
					return isPhone ? "50%" : "10em";
				},

				/**
				 * Returns width of Date field for desktop and mobile.
				 * @returns {String} e.g. "10%"
				 */
				declarationDateWidth: function () {
					var isPhone = this.getDeviceModel().getProperty("/system/phone");
					return isPhone ? "100%" : "14em";
				},

				/**
				 * Returns width of Float field for desktop and mobile.
				 * @returns {String} e.g. "10%"
				 */
				floatWidth: function () {
					var isPhone = this.getDeviceModel().getProperty("/system/phone");
					return isPhone ? "60%" : "14em";
				},

				fixme: function () {
					// eslint-disable-next-line no-alert
					alert("Not implemented");
				}

				// FIXME: DELETE ME
				// fixmeCreateDummyBags: function() {
				//   this.setGlobalModelProp("/bags", [
				//     new Bag("123").setItems([
				//       {
				//         bag_number: "123",
				//         dmbtr: 10,
				//         local_curr: "EUR",
				//         tendertype: "Item 1"
				//       },
				//       {
				//         bag_number: "123",
				//         dmbtr: 20,
				//         local_curr: "EUR",
				//         tendertype: "Item 2"
				//       }
				//     ]),
				//     new Bag("321").setItems([
				//       {
				//         bag_number: "321",
				//         dmbtr: 20,
				//         local_curr: "EUR",
				//         tendertype: "Item 2"
				//       }
				//     ])
				//   ]);
				// }
			}
		);
	}
);