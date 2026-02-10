import ApiService from "./AdminApiService";

let Controller = {
    async ApiController(data, api, methodType, params) {
        try {
            let res = await ApiService.callAPI(api, data, methodType, params);
            if (params && params.responseType && params.responseType.toLowerCase() === 'arraybuffer') {
                return res;
            } else {
                let res_data = JSON.parse(res);
                if (res_data.status === "SUCCESS") {
                    return { success: true, data: res_data.data};
                }
                 else if (res_data.status === "FAILED") {
                    return { success: false, data: res_data.data || res_data.error.message || "Request Error" };
                } 
                 else if (res_data.status === "UNAUTHORIZED") {
                    return { success: false, data: res_data.data || res_data.error.message || "Request Error" };
                } 
                else {
                    return { success: false, data: res_data.error || "Unknown Error" };
                }
            }
        } catch (error) {
            console.log(error)
            return { success: false, data: error.message || "Request Error" };
        }
    },
};

export default Controller;
