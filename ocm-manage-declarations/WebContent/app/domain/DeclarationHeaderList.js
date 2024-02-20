sap.ui.define(["sap/ui/base/Object", "sap/base/Log"], function(UI5Object, Log) {
  "use strict";
  return UI5Object.extend(
    "com.ssp.ocm.manage.declarations.app.domain.DeclarationHeaderList",
    {
      constructor: function(aDeclarationHeaders) {
        this.declarations = aDeclarationHeaders || [];
      },

      addDeclaration: function(oDeclaration) {
        this.declarations.push(oDeclaration);
      },

      /**
       * Goes through all the declarations and all its items, and returns the
       * set of unique DeclarationItem(s) looking at the item type
       * @return {Array} Array of DeclarationItem
       */
      uniqueDeclarationItemsByType: function() {
        var aDecls = this.declarations;
        var map = {};
        aDecls.forEach(function(d) {
          d.items.forEach(function(i) {
            if (i.tenderType !== "") {
              map[i.tenderType] = i; // Grab each tender type
            }
          });
        });
        return Object.keys(map).map(function(key) {
          return map[key];
        });
      },

      /**
       * Goes through all the declarations and all its items, and returns the
       * set of unique Bag ids for the bagged items.
       * @return {Array} Array of String
       */
      uniqueBagIds: function() {
        var aDecls = this.declarations;
        var map = {};
        aDecls.forEach(function(d) {
          d.items.forEach(function(i) {
            if (i.bagged) {
              map[i.bagNumber] = true;
            }
          });
        });
        var aUniqueBagIds = Object.keys(map);
        Log.info(
          "Set of bag ids for the last 6 months: " +
            JSON.stringify(aUniqueBagIds)
        );
        return aUniqueBagIds;
      }
    }
  );
});
