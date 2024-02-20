// eslint
sap.ui.define([
	"sap/ui/base/Object",
	"com/ssp/ocm/manage/declarations/app/domain/DeclarationItem"
], function (Object, DeclarationItem) {
	"use strict";
	return Object.extend(
		"com.ssp.ocm.manage.declarations.app.domain.DeclarationItem", {
			constructor: function (data) {
				if (data) {
					this.bagNumber = data.bagNumber;
					this.bagged = data.bagged;
					this.declarationId = data.declarationId;
					this.amount = data.amount;
					this.itemId = data.itemId;
					this.currency = data.currency;
					this.tenderType = data.tenderType;
					this.description = data.description;
				} else {
					this.bagged = false;
					this.amount = 0;
				}
			},

			fromBackend: function (data) {
				this.bagNumber = data.bag_number;
				this.bagged = data.bagged;
				this.declarationId = data.decid;
				this.amount = data.dmbtr;
				this.itemId = data.itemid;
				this.currency = data.local_curr;
				this.tenderType = data.tendertype;
				this.description = data.tendertype;
				return this;
			},

			/**
			 * Returns an object with the same data but different field names
			 * @returns {Object} Backend representation.
			 */
			toBackend: function () {
				return {
					tendertype: this.tenderType,
					dmbtr: this.amount.length ?
						String(this.amount[0]) :
						String(this.amount),
					local_curr: this.currency,
					bagged: this.bagged,
					bag_number: this.bagNumber
				};
			},

			/**
			 * Returns a new DeclarationItem (some fields are copied, others are reset)
			 *
			 * Field copied:
			 * - currencyCode
			 * - tenderType
			 *
			 * Fields reset:
			 * - itemId
			 * - bagged
			 * - bagNumber
			 * - declarationId
			 * @returns {DeclarationItem} new declaration item.
			 */
			clone: function () {
				var oCloned = new DeclarationItem();
				oCloned.currency = this.currency;
				oCloned.tenderType = this.tenderType;
				oCloned.description = this.description;
				oCloned.bagged = this.bagged;
				return oCloned;
			},

			setBagged: function (b) {
				this.bagged = b;
				return this;
			},

			/**
			 * Returns true if the item as a non zero and non black amount
			 * @returns {Boolean} True for non zero items
			 */
			isNonZero: function () {
				return (
					this.amount !== 0 &&
					this.amount !== null &&
					this.amount !== "" &&
					!isNaN(this.amount)
				);
			},

			/**
       * Returns true if the item has a non blank amount
       * @returns {Boolean} True for blank/invalid items
       */
			isBlank: function() {
				return (
					this.amount === undefined ||
					this.amount === null ||
					this.amount === "" ||
					isNaN(this.amount)
				);
			},

			isNonBlank: function() {
				return !this.isBlank();
			}

		}
	);
});