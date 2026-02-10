const Log = require("../models/model").Logs;
const requestIp = require("request-ip");
const axios = require("axios");
const status_code = require("../Libs/constants");

async function getIp(req) {
  return requestIp.getClientIp(req);
}

async function getLocation(ip) {
  // Original implementation for other IPs
  const transformIpGeolocationResponse = (data) => {
    return {
      ip: data.ip,
      network: `${data.ip}/25`,
      version: "IPv4",
      city: data.city,
      region: data.state_prov,
      region_code: data.state_code,
      country: data.country_code2,
      country_name: data.country_name,
      country_code: data.country_code2,
      country_code_iso3: data.country_code3,
      country_capital: data.country_capital,
      country_tld: data.country_tld,
      continent_code: data.continent_code,
      in_eu: data.is_eu,
      postal: data.zipcode,
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      timezone: data.time_zone.name,
      utc_offset:
        data.time_zone.offset_with_dst >= 0
          ? `+${data.time_zone.offset_with_dst}00`
          : `${data.time_zone.offset_with_dst}00`,
      country_calling_code: data.calling_code,
      currency: data.currency.code,
      currency_name: data.currency.name,
      languages: data.languages,
      country_area: null,
      country_population: null,
      asn: null,
      org: data.organization || data.isp,
    };
  };

  try {
    const response1 = await axios.get(`https://ipapi.co/${ip}/json/`);
    return response1.data;
  } catch (error1) {
    try {
      const response2 = await axios.get(
        `https://api.ipgeolocation.io/ipgeo?apiKey=${status_code.GEO_LOCATION_API_1}&ip=${ip}`
      );
      return transformIpGeolocationResponse(response2.data);
    } catch (error2) {
      try {
        const response3 = await axios.get(
          `https://api.ipgeolocation.io/ipgeo?apiKey=${status_code.GEO_LOCATION_API_2}&ip=${ip}`
        );
        return transformIpGeolocationResponse(response3.data);
      } catch (error3) {
        try {
          const response4 = await axios.get(
            `https://api.ipgeolocation.io/ipgeo?apiKey=${status_code.GEO_LOCATION_API_3}&ip=${ip}`
          );
          return transformIpGeolocationResponse(response4.data);
        } catch (error4) {
          try {
            const response5 = await axios.get(
              `https://api.ipgeolocation.io/ipgeo?apiKey=${status_code.GEO_LOCATION_API_4}&ip=${ip}`
            );
            return transformIpGeolocationResponse(response5.data);
          } catch (error5) {
            return { error: "Unknown location" };
          }
        }
      }
    }
  }
}

// Helper function to parse User-Agent and extract device details
function parseUserAgent(userAgent) {
  if (!userAgent)
    return {
      browser_name: "Unknown",
      device_type: "Unknown",
      device_details: "Unknown",
    };

  // Browser detection
  let browser_name = "Unknown";
  if (userAgent.includes("Chrome")) browser_name = "Chrome";
  else if (userAgent.includes("Firefox")) browser_name = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser_name = "Safari";
  else if (userAgent.includes("Edge")) browser_name = "Edge";
  else if (userAgent.includes("Opera")) browser_name = "Opera";
  else if (userAgent.includes("Internet Explorer"))
    browser_name = "Internet Explorer";

  // Device type detection
  let device_type = "Desktop";
  if (userAgent.includes("Mobile")) device_type = "Mobile";
  else if (userAgent.includes("Tablet")) device_type = "Tablet";
  else if (userAgent.includes("Android")) device_type = "Mobile";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    device_type = userAgent.includes("iPad") ? "Tablet" : "Mobile";
  }

  return {
    browser_name,
    device_type,
    device_details: userAgent,
  };
}

// Core function that creates a log entry - can be used independently
const createLog = async (logData, requestInfo = null) => {
  try {
    let ip_address, location, deviceInfo, device_details;

    // If requestInfo is provided (from HTTP request), extract data from request
    if (requestInfo && requestInfo.req) {
      const { req } = requestInfo;
      
      // Extract IP address from request
      ip_address = await getIp(req);
      
      // Get location based on IP
      location = await getLocation(ip_address);
      
      // Extract device details from User-Agent header
      const userAgent = req.headers["user-agent"] || "";
      deviceInfo = parseUserAgent(userAgent);
      
      // Extract additional request details
      device_details = {
        userAgent: userAgent,
        acceptLanguage: req.headers["accept-language"] || "",
        acceptEncoding: req.headers["accept-encoding"] || "",
        connection: req.headers.connection || "",
        host: req.headers.host || "",
        referer: req.headers.referer || "",
        origin: req.headers.origin || "",
        platform: req.headers["sec-ch-ua-platform"] || "Unknown",
        mobile: req.headers["sec-ch-ua-mobile"] || "Unknown",
      };
    } else {
      // Use provided data or defaults
      ip_address = logData.ip_address || "Unknown";
      location = logData.location || { error: "Unknown location" };
      deviceInfo = {
        browser_name: logData.browser_name || "Unknown",
        device_type: logData.device_type || "Unknown",
      };
      device_details = logData.device_details || {};
    }

    const newLog = new Log({
      trigger_event: logData.trigger_event,
      message_id: logData.message_id,
      email: logData.email,
      creation_time: logData.creation_time || new Date(),
      device_details: JSON.stringify(device_details),
      ip_address,
      location: JSON.stringify(location),
      browser_name: deviceInfo.browser_name,
      device_type: deviceInfo.device_type,
    });

    await newLog.save();
    return { success: true, log: newLog, message: "Log entry created successfully" };
  } catch (error) {
    console.error("Error creating log entry:", error);
    return { success: false, error: error.message };
  }
};

// Route handler - wraps the core function
const createLogEntry = async (req, res) => {
  const { message_id, email, creation_time, trigger_event } = req.body;
  
  try {
    const result = await createLog(
      { message_id, email, creation_time, trigger_event },
      { req }
    );

    if (result.success) {
      res.status(200).json({ message: "Terms And Conditions Accepted" });
    } else {
      res.status(500).json({ 
        message: "Error creating log entry", 
        error: result.error 
      });
    }
  } catch (error) {
    console.error("Error in createLogEntry route:", error);
    res.status(500).json({ 
      message: "Error creating log entry", 
      error: error.message 
    });
  }
};

module.exports = { 
  createLogEntry,  // For route usage
  createLog,       // For function usage
  getIp,           // Helper functions in case you need them
  getLocation,
  parseUserAgent
};