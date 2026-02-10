import Response from "./Response";

export let ApiService = {
  jsonToQueryString(json) {
    return (
      "?" +
      Object.keys(json)
        .map(function (key) {
          return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
        })
        .join("&")
    );
  },

  invalidAuth() {
    alert("Navigate");
  },
  async callAPI(apiResource, reqPayload, methodType,reqParams) {
    let result = await Response(apiResource, reqPayload, methodType,reqParams);
    return result;
  },
};

export default ApiService;
