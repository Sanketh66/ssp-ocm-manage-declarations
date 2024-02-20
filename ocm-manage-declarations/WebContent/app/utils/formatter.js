sap.ui.define(["sap/ui/core/format/DateFormat"], function (DateFormat) {
	"use strict";

	/**
	 * Module for formatting the data from the models to the UI
	 * @exports com/ssp/ocm/manage/declarations/app/utils/formatter
	 */
	return {
		/**
		 * Get number state by amount
		 * @param  {int} iDays number of days worked
		 * @return {string} color status
		 */
		formatDays: function (iDays) {
			var sState = "None";
			if (iDays > 200 && iDays < 301) {
				sState = "Warning";
			} else if (iDays > 300) {
				sState = "Error";
			}
			return sState;
		},

		/**
		 * Get status text by code
		 * @param  {integer} iStatus Status ID
		 * @return {string} the status text
		 */
		formatStatus: function (iStatus) {
			return this.getStatusText(iStatus);
		},

		formatFilteredBy: function (sFilteredSite, sFilteredStatus, sFilteredVariance, dFilteredDateStart, dFilteredDateEnd, sFilteredCashier) {
			var iCount = 0,
				oBundle = this.getResourceBundle(),
				sResultingText = "",
				sFilteredText = oBundle.getText("FILTERED_BY_LBL");

			if (Array.isArray(sFilteredSite)) {
				iCount++;
				// Old way, getting all the site description
				// sFilteredSite.forEach(function (sSite) {
				// 	sResultingText = sResultingText !== "" ? 
				// 			sResultingText + ', ' + this.getSiteDesc(sSite) 
				// 			: 
				// 			this.getSiteDesc(sSite);
				// }.bind(this));

				if (sFilteredSite.length > 1) {
					var sSites = oBundle.getText("MULTI_SITE_LBL").replace('{0}', sFilteredSite.length);
					sResultingText += sSites;
				} else {
					sFilteredSite.forEach(function (sSite) {
						sResultingText = sResultingText !== "" ?
							sResultingText + ', ' + this.getSiteDesc(sSite)
							:
							this.getSiteDesc(sSite);
					}.bind(this));
				}

			} else if (sFilteredSite && sFilteredSite !== oBundle.getText("SHOW_ALL_FILTER")) {
				iCount++;
				sResultingText += this.getSiteDesc(sFilteredSite);
			}

			if (sFilteredCashier && sFilteredCashier !== "All") {
				iCount++;
				var sCashier = oBundle.getText("CASHIER_FILTER");
				sResultingText = sResultingText !== "" ? sResultingText + ', ' + sCashier : sCashier;
			}

			if (sFilteredStatus && sFilteredStatus !== "All") {
				iCount++;
				var sStatus = this.getStatusText(parseInt(sFilteredStatus, 10));
				sResultingText = sResultingText !== "" ? sResultingText + ', ' + sStatus : sStatus;
			}

			if (sFilteredVariance === "Variances") {
				iCount++;
				var sVariances = oBundle.getText("VARIANCES_ONLY_FILTER");
				sResultingText = sResultingText !== "" ? sResultingText + ', ' + sVariances : sVariances;
			}

			if (dFilteredDateStart) {
				iCount++;
				var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" }),
					sDateStart = oDateFormat.format(dFilteredDateStart);
				if (dFilteredDateEnd) {
					var sDateEnd = oDateFormat.format(dFilteredDateEnd),
						sFromToDate = oBundle.getText("FROM_TO_TEXT")
							.replace('{0}', sDateStart)
							.replace('{1}', sDateEnd);
					sResultingText = sResultingText !== "" ? sResultingText + ', ' + sFromToDate : sFromToDate;
				} else {
					sResultingText = sResultingText !== "" ? sResultingText + ', ' + sDateStart : sDateStart;
				}
			}

			if (iCount === 0) {
				return oBundle.getText("NOT_FILTERED_LBL");
			}
			return sFilteredText.replace('{0}', iCount.toString()).replace('{1}', sResultingText);
		},

		formatTenderDescription: function (iTenderType, bGroup, bDeclared, bLocalCurr, bExchange_rate, bLocal_Currency) {
			if (bGroup) {
				return this.getTenderGroupText(iTenderType);
			}
			return this.getTenderTypeText(iTenderType, bDeclared, bLocalCurr, bExchange_rate, bLocal_Currency);
		},
		formatDeclared: function (pDeclared_Total, pConv_Declared, pDeclared, pExchangeRate, PisTenderGroup) {
			var DeclaredValue;
			if (pExchangeRate !== '0.0000' && PisTenderGroup == false) {
				DeclaredValue = pConv_Declared;
			}
			else if (PisTenderGroup == true) {
				DeclaredValue = pDeclared_Total;
			}
			else {
				DeclaredValue = pDeclared;
			}
			return DeclaredValue;
		},

		formatIconVisibility: function (sFlag) {
			return sFlag === 'X' ? true : false;
		},

		formatNumbers: function (sNumber) {
			return Number(sNumber).toFixed(2);
		},


		getSiteToolbar: function (sSite) {
			return this.getSiteDesc(sSite) + ' (' + sSite + ')';
		},

		getSiteDescription: function (sSite) {
			return sSite + ' - ' + this.getSiteDesc(sSite);
		},

		formatSiteNameDropdown: function (siteDesc, site) {
			if (site === "All") {
				return siteDesc;
			}
			// const sCandidate = `${siteDesc} (${site})`;
			// if (sCandidate.length >= 30) {
			// 	return `${siteDesc.substr(0,11)}...${siteDesc.substr(siteDesc.length-9)} (${site})`
			// }
			// return sCandidate;
			return `${siteDesc} (${site})`;
		},
		
		formattedVariance: function (Conv_Declared, Sales) {
        //debugger;
			return (parseFloat(Conv_Declared) - parseFloat(Sales)).toFixed(3);

		}

		// formatVARIANCE_VALUE_1: function(iVarianc) {
		// 	if(iVarianc<0){
		// 		return iVarianc*(-1);
		// 	}
		// 	else {
		// 		return iVarianc*(-1);
		// 	}
		// }

	};
});