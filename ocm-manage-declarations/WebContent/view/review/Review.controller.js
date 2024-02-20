/* eslint-disable no-extra-parens */
/*global location */
sap.ui.define(
	[
		"com/ssp/ocm/manage/declarations/app/base/BaseController",
		"com/ssp/ocm/manage/declarations/app/services/ApiFacade",
		"com/ssp/ocm/manage/declarations/app/model/models",
		"com/ssp/ocm/manage/declarations/app/utils/formatter",
		"sap/ui/core/Fragment",
		"sap/ui/core/BusyIndicator"
	],
	function (
		BaseController,
		ApiFacade,
		models,
		formatter,
		Fragment,
		BusyIndicator
	) {
		"use strict";

		/**
		 * Controller for the Review view
		 * @exports com/ssp/ocm/manage/declarations/view/review/Review
		 */
		return BaseController.extend(
			"com.ssp.ocm.manage.declarations.view.review.Main", {
				/* =========================================================== */
				/* lifecycle methods                                           */
				/* =========================================================== */

				formatTenderDescription: formatter.formatTenderDescription,
				getSiteDescription: formatter.getSiteDescription,

				onInit: function () {
					BaseController.prototype.onInit.apply(this);
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter
						.getRoute("review")
						.attachPatternMatched(this._onRouteMatched, this);
				},

				_onRouteMatched: function () {
					//this.forceLockedViewIfneeded();
					this.resetMessageModel();
					// this.createMessagePopover();
					this.prepareModel();
					//this.toAmendSrv();
				},

				prepareModel: function () {
					var oAmendModel = this.getGlobalModel("AmendModel"),
						oAmend = oAmendModel.getProperty.bind(oAmendModel),
						oReviewJSON = {
							Site: oAmend("/Unit"),
							Cashier: oAmend("/Cashier"),
							Date: oAmend("/Date"),
							Amount: oAmend("/Float"),
							Currency: oAmend("/FloatCurrency"),
							TenderList: this.getAllTenders(),
							DecId: oAmend("/DecId")
						};

					this.setGlobalModel(models.createJSONModel(oReviewJSON), "ReviewModel");
				},

				getAllTenders: function () {
					var aAllTenders = [],
						aBaggedList = this.getGlobalModelProp("/BaggedList", "AmendModel"),
						aNonBaggedList = this.getGlobalModelProp("/NonBaggedList", "AmendModel");

					aBaggedList.forEach(function (oBag) {
						aAllTenders = aAllTenders.concat(oBag.TenderList);
					})
					aAllTenders = aAllTenders.concat(aNonBaggedList);

					return aAllTenders.length > 0 ? aAllTenders : [];
				},

				onMessagePopoverBtnPress: function (oEvent) {
					this._oErrorPopover.toggle(oEvent.getSource());
				},

				onEditPressed: function (oEvent, sStep) {
					this.setGlobalModelProp("/CurrentStep", sStep, "AmendModel");
					this.doNavTo("amends", {}, {}, true);
				},

				onConfirmPressed: function () {
					// Don't allow declarations without items - SSPFI-19512
					var oReviewModel = this.getGlobalModel("ReviewModel"),
							oReview = oReviewModel.getProperty.bind(oReviewModel),
							aAmendTenders = oReview("/TenderList");
					if (!this._hasItems(aAmendTenders)) {
						return this.displayMessageMandatoryItems();
					}

					BusyIndicator.show(0);
					ApiFacade.getInstance()
						.amendDeclaration(
							this.getFormattedValuesForBackend()
						).then(
							function () {
								this.setGlobalModel(null, "AmendModel");
								this.doNavTo("cashier", {}, {}, true);
							}.bind(this),
							function (oErr) {
								this.addMessage(oErr);
								BusyIndicator.hide();
							}.bind(this)
						);
				},

				onCancelPressed: function () {
					// creates dialog list if not yet created
					if (!this._cancelDialogReview) {
						Fragment.load({
							name: "com.ssp.ocm.manage.declarations.view.review.fragment.CancelDialog",
							controller: this
						}).then(function(oDialog){
							this._cancelDialogReview = oDialog;
							this.getView().addDependent(this._cancelDialogReview);
							// opens the dialog
							this._cancelDialogReview.open();
						}.bind(this));
					} else {
						this._cancelDialogReview.open();
					}
				},
				

				onCancelChangesPressed: function () {
					var oReviewModel = this.getGlobalModel("ReviewModel");
					this.doNavTo(
						"declarations",
						{
							decid: oReviewModel.getProperty("/DecId")
						}
					);
					if (this._cancelDialogReview) {
						this._cancelDialogReview.close();
						this._cancelDialogReview.destroy();
						this._cancelDialogReview = null;
					}
				},

				/**
				 * Called when the user cancels the exit process.
				 * @returns {void}
				 */
				onCancelExitPressed: function () {
					if (this._cancelDialogReview) {
						this._cancelDialogReview.close();
						this._cancelDialogReview.destroy();
						this._cancelDialogReview = null;
					}
				},

				getFormattedValuesForBackend: function () {
					var oReviewModel = this.getGlobalModel("ReviewModel"),
						oReview = oReviewModel.getProperty.bind(oReviewModel),
						aAmendTenders = oReview("/TenderList")
								.map(function (oTender) {
									return {
										"tendertype": this._formatTenderTypesForBackend(Number(oTender.TenderType)),
										"dmbtr": Number(oTender.Amount).toFixed(2),
										"local_curr": oTender.Currency,
										"bagged": oTender.Bagged,
										"bag_number": oTender.BagId
									}
								}, this);

					return {
						"site": oReview("/Site"),
						"cashier": oReview("/Cashier"),
						"datum": this._changeDatesFromGMT(oReview("/Date")),
						"dmbtr": oReview("/Amount").toFixed(2),
						"localtime": this._changeDatesFromGMT(new Date()),
						"local_curr": oReview("/Currency"),
						"ZC_DECIT_AMENDSet": aAmendTenders,
						"decid": oReview("/DecId")
					}
				},

				_formatTenderTypesForBackend: function (iTenderType) {
					var sTenderType = String(iTenderType);
					while(sTenderType.length < 4) {
						sTenderType = '0'+sTenderType;
					}
					return sTenderType;
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
         * @returns true when the given thing is an array with items
         */
				_hasItems: function(aItems) {
					return Array.isArray(aItems) && aItems.length > 0;
				},

				/**
         * Opens a dialog telling the user that declarations need to have at least one item.
         */
				displayMessageMandatoryItems: function() {
					this.alert("MSG_MANDATORY_ITEMS", "A");
				}
			}
		);
	}
);