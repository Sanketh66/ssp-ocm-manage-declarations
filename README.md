## Building and deploying this app

To do a build: 

```
npm run gulp-package
```

This will generate a `dist` folder at the top level.

To deploy, pass the following command with the valid user/password:

```sh
npm run deploy -- --user $ssp_user --password $ssp_pass --package ZOPERATIONS --bspcontainer ZOC_MANDEC --bspcontainertext "MANAGE_DEC" --packtransportno SF1K900417 --host "http://10.80.18.11:8101"
```

(adjust as necessary)

Then you need to clear some caches on the backend. Do this:

Login to SF1.
On se38, execute `/UI2/INVALIDATE_CLIENT_CACHES`.
On se38, execute `/UI2/DELETE_CACHE_AFTER_IMP`.
On se38, execute `/UI5/APP_INDEX_CALCULATE` then select Single sapui5 repo, then enter the name of the app (ZOC_MANDEC) and execute.
On SMICM, Goto > Http plugin > Server cache > Invalidate globally