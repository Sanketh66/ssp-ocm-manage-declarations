sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/m/MessageBox",
    "com/ssp/ocm/manage/declarations/app/utils/formatter",
    "com/ssp/ocm/manage/declarations/app/services/ConfigHelper",
    "com/ssp/ocm/manage/declarations/app/services/ApiFacade",
    "com/ssp/ocm/manage/declarations/app/services/AjaxCaller",
    "com/ssp/ocm/manage/declarations/app/model/models"
  ],
  function(
    UIComponent,
    Device,
    MessageBox,
    formatter,
    ConfigHelper,
    ApiFacade,
    AjaxCaller,
    models
  ) {
    "use strict";

    /**
     * Application component
     * @exports com/ssp/ocm/manage/declarations/Component
     */
    return UIComponent.extend("com.ssp.ocm.manage.declarations.Component", {
      metadata: {
        manifest: "json"
      },

      /**
       * Shared app formatter
       * @type {com.ssp.ocm.manage.declarations.app.utils.formatter}
       */
      formatter: formatter,

      /**
       * Constructor for dependency injection. Only should be called directly by unit tests
       * @public
       * @constructor
       * @param {object} oFormatter Formatter mock. Use only in unit tests
       * @param {object} oConfigHelper ConfigHelper mock. Use only in unit tests
       * @param {object} oApiFacade ApiFacade mock. Use only in unit tests
       * @param {object} oAjaxCaller AjaxCaller mock. Use only in unit tests
       * @param {object} oModels Models mock. Use only in unit tests.
       * @return {com.ssp.ocm.manage.declarations.Component} The app component
       */
      constructor: function(
        oFormatter,
        oConfigHelper,
        oApiFacade,
        oAjaxCaller,
        oModels
      ) {
        if (oFormatter) {
          formatter = oFormatter;
        }

        if (oConfigHelper) {
          ConfigHelper = oConfigHelper;
        }

        if (oApiFacade) {
          ApiFacade = oApiFacade;
        }

        if (oAjaxCaller) {
          AjaxCaller = oAjaxCaller;
        }

        if (oModels) {
          models = oModels;
        }

        UIComponent.prototype.constructor.call(this, {});
      },

      /* =========================================================== */
      /* lifecycle methods                                           */
      /* =========================================================== */

      /**
       * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
       * In this method, the FLP and device models are set and the router is initialized.
       * @public
       * @override
       */
      init: function() {
        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // initialize all utilities class to have access to owner component
        this._initializeBaseObjectSingletonClasses();

        // call the base component's init function and create the App view
        UIComponent.prototype.init.apply(this, arguments);

        // create the views based on the url/hash
        this.getRouter().initialize();

        // send a message in case SCP tells us to refresh
        sap.ui
          .getCore()
          .getEventBus()
          .subscribe("xpr:ajaxCaller", "sessionTimeout", function() {
            MessageBox.warning(
              this.getModel("i18n")
                .getResourceBundle()
                .getText("refreshPrompt")
            );
          });

          this._initializeStartupParamsModel();

          // It is un clear why but oComponentData is undefined and this causes some ushell functions 
          // to throw an error, in particular cross app navigation. It is ok to initialise it with 
          // an empty object as they are expecting that scenario.
          if (!this.oComponentData) {
            this.oComponentData = {};
          }
      },


      /**
       * _initializeStartupParamsModel: Read url parameters and set
       * them in the startupParams model.
       */
       _initializeStartupParamsModel: function() {
        var startupParameters = this.getComponentData()?.startupParameters;
        if (!startupParameters && window.location.hash.includes("?")) {
          const sQuery = window.location.hash.split("?")[1];
          const urlParams = new URLSearchParams(sQuery); // Launchpad/shell puts params as part of the hash :)
          const oParams = this.readStartupParameters(urlParams);
          startupParameters = oParams;
        }
        this.setModel(
          models.createJSONModel(startupParameters),
          "startupParams"
        );
      },
      
      /**
       * 
       */
      readStartupParameters: function(urlParams) { 
        const sSite = urlParams.get("site");
        const sDecId = urlParams.get("decid");
        return { 
          Site: sSite,
          DecId: sDecId
        };
      },


      /**
       * The component is destroyed by UI5 automatically.
       * In this method, the ListSelector and ErrorHandler are destroyed.
       * @public
       * @override
       */
      destroy: function() {
        // call the base component's destroy function
        UIComponent.prototype.destroy.apply(this, arguments);
      },

      
      /**
       * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
       * design mode class should be set, which influences the size appearance of some controls.
       * @public
       * @returns {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
       */
      getContentDensityClass: function() {
        if (!this._sContentDensityClass) {
          // check whether FLP has already set the content density class; do nothing in this case
          if (
            jQuery(document.body).hasClass("sapUiSizeCozy") ||
            jQuery(document.body).hasClass("sapUiSizeCompact")
          ) {
            this._sContentDensityClass = "";
          } else if (!Device.support.touch) {
            // apply "compact" mode if touch is not supported
            this._sContentDensityClass = "sapUiSizeCompact";
          } else {
            // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
            this._sContentDensityClass = "sapUiSizeCozy";
          }
        }
        return this._sContentDensityClass;
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /* =========================================================== */
      /* Slider Navigation                                           */
      /* =========================================================== */

      /**
       * Retrieve current language on client app for logged-in user.
       * E.g. "en", "de", etc
       * @return {string} Logged-in user language e.g. "en", "de"
       */
      getCurrentLanguageOnClient: function() {
        return sap.ui
          .getCore()
          .getConfiguration()
          .getLocale()
          .getLanguage();
      },

      /**
       * Set new language passed as input parameter as new language
       * E.g. "en", "de", etc
       * @param {string} sLanguage New language of the application  e.g. "en", "de"
       * @return {undefined}
       */
      setCurrentLanguageOnClient: function(sLanguage) {
        sap.ui
          .getCore()
          .getConfiguration()
          .setLanguage(sLanguage);
      },

      /* =========================================================== */
      /* begin: internal methods                                     */
      /* =========================================================== */

      /**
       * Initialize owner component when necessary
       * @private
       * @return {undefined}
       */
      _initializeBaseObjectSingletonClasses: function() {
        ConfigHelper.getInstance().setOwnerComponent(this);
        ApiFacade.getInstance().setOwnerComponent(this);
        AjaxCaller.getInstance().setOwnerComponent(this);
      }
    });
  }
);
