sap.ui.define(["sap/ui/base/Object"], function(Object) {
  "use strict";

  return Object.extend("com.ssp.ocm.manage.declarations.domain.UserTender", {
    // Stores the same as ZOC_USERSMD_SRV/ZC_OCUSER_TT
    constructor: function(oUserTender) {
      this.currencyCode = oUserTender.Currency;
      this.declared = oUserTender.Declared;
      this.language = oUserTender.Language;
      this.profileType = oUserTender.ProfileType;
      this.site = oUserTender.Site;
      this.tenderGroup = oUserTender.TenderGroup;
      this.tenderSubGroup = oUserTender.TenderSubGroup;
      this.tenderType = oUserTender.TenderType;
      this.tenderTypeDescription = oUserTender.TenderTypeDescription;
      this.userId = oUserTender.UserID;
      this.userProfileType = oUserTender.UserProfileType;
      this.userSite = oUserTender.UserSite;
      // Example of what we get:
      // "Currency: "EUR"
      // Declared: "0003"
      // Language: "EN"
      // ProfileType: "FI10"
      // Site: "A011"
      // TenderGroup: "1"
      // TenderSubGroup: "0001"
      // TenderType: "1"
      // TenderTypeDescription: "Tender Type A011 1"
      // UserID: "JMARTIN"
      // UserProfileType: "FI10"
      // UserSite: "A011"";
    }
  });
});
