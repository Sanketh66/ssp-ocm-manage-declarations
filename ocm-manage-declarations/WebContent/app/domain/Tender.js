sap.ui.define(["sap/ui/base/Object"], function(Object) {
  "use strict";

  return Object.extend("com.ssp.ocm.manage.declarations.domain.Tender", {
    constructor: function(oBETender) {
      // oBETender is an object like the following:
      // Currency: "EUR"
      // Declared: "0004"
      // ProfileType: "FI10"
      // Site: ""
      // TenderGroup: "1"
      // TenderSubGroup: "0001"
      // TenderType: "1"
      this.description = oBETender.Description || "loading";
      this.amount = null;
      this.currencyCode = oBETender.Currency;
      this.declared = oBETender.Declared;
      this.profileType = oBETender.ProfileType;
      this.site = oBETender.Site;
      this.tenderGroup = oBETender.TenderGroup;
      this.tenderSubGroup = oBETender.TenderSubGroup;
      this.tenderType = oBETender.TenderType;
      this.bagged = false;
      this.bagNumber = null;
    },

    /**
     * Given two arrays of "Tender" like objects, one of them without valid descriptions,
     * copies the descriptions from the objects in aDescriptions to aTenders.
     * Returns aTenders
     *
     * BackendTender is an object like below:
     *  Language: "EN"
     *  ProfileType: "FI10"
     *  Site: ""
     *  TenderType: "1"
     *  TenderTypeDescription: "TenderType1" <- the field we are copying
     * @param {Array} aDescriptions Array of objects of type "BackendTender" (see above)
     * @param {Array} aTenders Array of Tender instances
     * @returns {Array} aTenders
     */
    mergeDescriptions: function(aDescriptions, aTenders) {
      var key = function(site, tenderType, profileType) {
        return site + tenderType + profileType;
      };
      // Build a map of (site,tendertype,profiletype) => description
      var oDescriptionsMap = aDescriptions.reduce(function(acc, val) {
        acc[key(val.Site, val.TenderType, val.ProfileType)] =
          val.TenderTypeDescription;
        return acc;
      }, {});
      // Fill descriptions for all tenders, indexing the previous map
      aTenders.forEach(function(o) {
        o.description =
          oDescriptionsMap[key(o.site, o.tenderType, o.profileType)];
        return o;
      });
      return aTenders;
    }
  });
});
