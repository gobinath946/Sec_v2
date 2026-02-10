import { apiHdrDefValue, apiHttpStatus } from "./ApiConstant.js";
import { apiEndPoint } from "./ApiConstant.js";
import { BASE_URL } from "../config.js";

import axios from "axios";

const Response = async (
    apiResource,
    reqPayload,
    methodType,
    reqParams
) => {
    let resultAPI;
    var result =
        '{"status": "FAILED", "error" : "Request Process Failed", "data": []}';
    try {
        if (apiResource === "undefined" || apiResource === "") {
            apiResource = "";
        }
        if (reqParams === "undefined" || reqParams === "") {
            reqParams = {};
        }
        if (reqPayload === "undefined" || reqPayload === "") {
            reqPayload = {};
        }

        if (
            (methodType === "GET" || methodType === "DELETE") &&
            typeof reqParams !== "object"
        ) {
            reqParams = {};
        } else if (
            (methodType === "POST" || methodType === "PUT") &&
            typeof reqPayload != "object"
        ) {
            reqPayload = {};
        }

        //   --------- api call for all type of method----------

        if (methodType === "GET") {
            resultAPI = await axiosGet(apiResource, reqParams);
        } else if (methodType === "POST") {
            resultAPI = await axiosPost(apiResource, reqPayload);
        } else if (methodType === "PUT") {
            resultAPI = await axiosPut(apiResource, reqPayload);
        } else if (methodType === "DELETE") {
            resultAPI = await axiosDelete(apiResource, reqParams);
        }
        //   -------------- api call end ----------------

        if (resultAPI.status === apiHttpStatus.SC_200) {

            if (
                reqParams &&
                reqParams.responseType &&
                reqParams.responseType.toLowerCase() === "arraybuffer"
            ) {
                result = resultAPI.data;
            } else {
                result =
                    '{"status": "SUCCESS","responseType": "NORMAL", "data": ' +
                    JSON.stringify(resultAPI.data) +
                    "}";
            }
        } else {
            if (resultAPI.response.status === 401) {
                alert(resultAPI.response.data.error)
                window.location.href = "/";
                result =
                    '{"status": "UNAUTHORIZED","responseType": "NORMAL", "data": ' +
                    JSON.stringify(resultAPI.response.data.error) +
                    "}";
            } else {
                result =
                    '{"status": "FAILED","responseType": "NORMAL", "data": ' +
                    JSON.stringify(resultAPI.response.data.error || resultAPI.response.data.message) +
                    "}";
            }
        }

    } catch (err) {
        if (err.response) {
            var eStatusCode = err.response.status;
            var ePayloadTemp = JSON.stringify(err.response.data);
            var ePayload = JSON.parse(ePayloadTemp);
            if (eStatusCode === apiHttpStatus.SC_412) {
                result = '{"status": "FAILED", "error" : ' +
                    JSON.stringify(ePayload.messages) +
                    "}";
            } else if (eStatusCode === apiHttpStatus.SC_401) {
                if (ePayload.invalid_auth_token) {
                    window.location.href = "/?session_expired=true";
                    // Cookies.remove("token");
                } else {
                    result = '{"status": "FAILED", "error" : ' + JSON.stringify(ePayload) + "}";
                }
            } else if (eStatusCode >= apiHttpStatus.SC_400) {
                result =
                    '{"status": "FAILED", "error" : ' + JSON.stringify(ePayload) + "}";
            } else if (eStatusCode >= apiHttpStatus.SC_403) {
                result =
                    '{"status": "FAILED", "error" : ' + JSON.stringify(ePayload) + "}";
            } else if (eStatusCode >= apiHttpStatus.SC_424) {
                result =
                    '{"status": "FAILED", "error" : ' + JSON.stringify(ePayload) + "}";
            }
        } else if (err.request) {
            result = '{"status": "FAILED", "error" : "Network Error"}';
        } else {
            result = '{"status": "FAILED", "error" : "Request Error"}';
        }
    }
    return result;
};
const jsonToQueryString = (params) => {
    if (!params) return "";
    return "?" + Object.keys(params).map(key => key + "=" + encodeURIComponent(params[key])).join("&");
};


const axiosGet = async (apiResource, reqParams) => {
    const emailid = sessionStorage.getItem("email_id");
    const token = sessionStorage.getItem("token");

    if (!token) {
        return;
    }

    const headers = {
        token: `${token}`,
        email: emailid,
    };
    let apiFullEndPoint = BASE_URL + apiResource;
    try {
        const resultData = await axios.get(apiFullEndPoint, {
            params: reqParams,
            headers,
        });
        return resultData;
    } catch (error) {
        return error;
    }
};

const axiosPost = async (apiResource, reqPayload) => {
    let contentType;
    let apiFullEndPoint = BASE_URL + apiResource;
    const emailid = sessionStorage.getItem("email_id");
    const token = sessionStorage.getItem("token");

    const headers = {
        "content-type": contentType,
        app_name: apiHdrDefValue.REFERRED_BY,
    };


    if (apiResource !== apiEndPoint.ADMIN_LOGIN) {
        if (!token) {
            return;
        }
        headers.token = token;
        headers.email = emailid;
    }

    try {
        if (reqPayload instanceof FormData) {
            headers["content-type"] = apiHdrDefValue.FORM_DATA;
        } else {
            headers["content-type"] = apiHdrDefValue.APPLICATION_JSON;
        }

        const resultData = await axios.post(apiFullEndPoint, reqPayload, {
            headers,
        });
        return resultData;
    } catch (error) {
        return error;
    }
};



const axiosPut = async (apiResource, reqPayload) => {
    var contentType;
    const emailid = sessionStorage.getItem("email_id");
    const token = sessionStorage.getItem("token");

    if (!token) {
        return;
    }

    if (reqPayload instanceof FormData) {
        contentType = apiHdrDefValue.FORM_DATA;
    } else {
        contentType = apiHdrDefValue.APPLICATION_JSON;
    }
    let apiFullEndPoint = BASE_URL + apiResource;
    let resultData = await axios.put(apiFullEndPoint, reqPayload, {
        headers: {
            "content-type": contentType,
            app_name: apiHdrDefValue.REFERRED_BY,
            token: token,
            email: emailid,
        },
    });
    return resultData;
};


const axiosDelete = async (apiResource, reqParams) => {
    const emailid = sessionStorage.getItem("email_id");
    const token = sessionStorage.getItem("token");
    if (!token) {
        return;
    }
    var queryParams = jsonToQueryString(reqParams);
    var apiFullEndPoint = BASE_URL + apiResource + queryParams;

    try {
        let resultData = await axios.delete(apiFullEndPoint, {
            headers: {
                "content-type": apiHdrDefValue.APPLICATION_JSON,
                app_name: apiHdrDefValue.REFERRED_BY,
                email: emailid,
                token: token,
            },
        });
        return resultData;
    } catch (error) {
        throw error;
    }
};


export default Response;