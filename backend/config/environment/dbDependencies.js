let ENV = 'TEST'; //DEV,QA,LIVE,UAT
if (ENV == 'LOCAL') {
    module.exports.dbPort = "27017";
    module.exports.dbURL = "mongodb+srv://srinivasan:yG1DtYmc6q41KSi7@qrsclusterlearning.wtihbgw.mongodb.net/sales";
    module.exports.dbName = "sales";
    module.exports.ServerPort = 8083;
    module.exports.FrontEndUrl = "http://localhost:3000";
    module.exports.BaseFolder = "LOCAL";
    module.exports.ApplnxUrlCreation = "http://localhost:8084/apiv1/links/create_shorturl";
} else if (ENV == 'TEST') {
    module.exports.dbPort = "27017";
    module.exports.dbURL = "mongodb+srv://qrstestuser:BmRM7oG5i4F7@qrsdevmongo.wbo17ev.mongodb.net/sales";
    module.exports.dbName = "sales";
    module.exports.ServerPort = 8083;
    module.exports.FrontEndUrl = "https://dev-upkeep.securegateway.io";
    module.exports.BaseFolder = "TEST";
    module.exports.ApplnxUrlCreation = "https://dev-app-backend.datainterface.io/apiv1/links/create_shorturl";
} else if (ENV == 'UAT') {
    module.exports.dbPort = "27017";
    module.exports.dbURL = "mongodb+srv://qrsuatuser:IJcSgqMd80g7@qrsdevmongo.wbo17ev.mongodb.net/uat_sales";
    module.exports.dbName = "sales";
    module.exports.ServerPort = 8084;
    module.exports.FrontEndUrl = "https://uat.securegateway.io";
    module.exports.BaseFolder = "UAT";
    module.exports.ApplnxUrlCreation = "https://dev-app-backend.datainterface.io/apiv1/links/create_shorturl";
} else if (ENV == 'PROD') {
    module.exports.dbPort = "27017";
    module.exports.dbURL = "mongodb+srv://qrsproduser:9AwF795xDNxd@qrsprodmongo.pb7fnzp.mongodb.net/prod_sales";
    module.exports.dbName = "sales";
    module.exports.ServerPort = 8081;
    module.exports.FrontEndUrl = "https://app.securegateway.io";
    module.exports.BaseFolder = "PROD";
    module.exports.ApplnxUrlCreation = "https://applnx.io/apiv1/links/create_shorturl";
}
