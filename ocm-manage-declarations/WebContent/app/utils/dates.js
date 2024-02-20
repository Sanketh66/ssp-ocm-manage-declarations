sap.ui.define([
  "sap/ui/core/format/DateFormat"
], function(DateFormat) {
  "use strict";

  /**
   * Module for dealing with date calculations
   * @exports com/ssp/ocm/manage/declarations/app/utils/dates
   */
  return {
    today: function() {
      return new Date();
    },

    /**
     * Returns a date N days in the past, with respect to today
     * @param {Number} iDays - Number of days in the past.
     * @returns {Date} Date instance n days in the past.
     */
    nDaysAgo: function(iDays) {
      var oDate = new Date();
      oDate.setDate(oDate.getDate() - (iDays || 0));
      return oDate;
    },

    /**
     * Converts a given date to a string in EDM Format
     * @param {Date} oDate Given Date
     * @returns {String} EDM Formatted date
     */
    toEdm: function(oDate) {
      return sap.ui.model.odata.ODataUtils.formatValue(oDate, "Edm.DateTime");
    },

    /**
     * Returns a string in the format 2019-12-09T00:00:00
     * @param {Date} oDate date to convert
     * @returns {String} date formatted
     */
    toYYYYMMDDT000000: function(oDate) {
      return oDate.toISOString().slice(0, 10) + "T00:00:00";
    },

    /**
     * Returns a string in the format 2019-12-09T00:00:00
     * @param {Date} oDate date to convert
     * @returns {String} date formatted
     */
    toYYYYMMDD: function(oDate) {
      return oDate.toISOString().slice(0, 10);
    },

    /**
     * Returns a string in the format 2019-12-09T00:00:00
     * @param {Date} oDate date to convert
     * @returns {String} date formatted
     */
    toDDMMYYYY: function(oDate) {
      if(oDate) {
        var oDateFormat = DateFormat.getDateInstance({pattern: "dd/MM/yyyy"}),
        sDate = oDateFormat.format(oDate);
        return sDate;
      }
      return "";
    },

    // If the computer is +2hr ahead of utc,this will return current hour + 2.
    addTZOffset: function(oDate) {
      var tz = oDate.getTimezoneOffset(); // in minutes
      var res = new Date(oDate.getTime() - tz * 60 * 1000);
      return res;
    },

    // /**
    //  * 
    //  * @returns String with the current local time formatted as "124500" for 12:45:00
    //  */
    // localtimeStr: function() {
    //   var s = (new Date()).toTimeString(); // e.g. '12:49:19 GMT+0100 (British Summer Time)'
    //   s = s.substring(0,2) + s.substring(3,5) + s.substring(6,8);
    //   debugger;
    //   return s;
    // }
  };
});
