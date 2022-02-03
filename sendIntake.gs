/**
 * Google Apps Script for integrating Well Intake form with AB App
 * Should be installed as script bound to the responses spreadsheet
 */
// Configuration
const RESPONSE_SHEET = "Form Responses 1";
const KEYS_SHEET = "Keys";
const LOG_SHEET = "Log";
const RENAME_SHEET = "Rename";
const AB_AUTH_TOKEN = "";
const BASE_URL = "";
const ss = SpreadsheetApp.getActiveSpreadsheet();
const USER = {
  tenant: '',
  email: '',
  password: '',
};
/**
 * Run once to install the trigger so that the new responses will be processed.
 * @function installtrigger
 */
function intallTrigger() {
  ScriptApp.newTrigger("onIntakeReceived")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  logResults("Trigger Installed");
}

/**
 * Tests the onIntakeRecieved function with the first respose
 * @function test_onIntakeRecieved
 */
function test_onIntakeRecieved() {
  const response = ss
    .getSheetByName(RESPONSE_SHEET)
    .getDataRange()
    .getValues()[1]; // datatestinput
  onIntakeReceived({ values: response });
}

/**
 * Processes the new response and sends request to the db
 * @function onIntakeReceived
 */
function onIntakeReceived({ values }) {
  try {
    logResults("Response received", values);
    // Load and prepare data for processing
    const keyData = ss
      .getSheetByName(KEYS_SHEET)
      .getRange(2, 2, values.length, 1)
      .getValues();
    const keys = transpose(keyData)[0];

    const rename = {};
    const renameData = ss
      .getSheetByName(RENAME_SHEET)
      .getDataRange()
      .getValues();
    renameData.shift();
    renameData.forEach((row) => {
      if (!rename.hasOwnProperty([row[0]])) {
        rename[row[0]] = {};
      }
      rename[row[0]][row[1]] = row[2];
    });

    // Process Intake
    let intake = parseResponse(values, keys);
    intake = processClients(intake);
    intake = renameResponses(intake, rename);
    AppbuilderAPIPostRequest(intake);
  } catch (error) {
    logResults("Error", error.message);
  }
}

/**
 * Take the form response and maps the response to an intake object based on the Key
 * @function parseResponse
 * @param {String[]} response - form response data as array matching the response spreadsheet column order
 * @param {String[]} keys - an array of keys that will be used to map the response data in the intake object
 * @return {Object} intake object
 */
function parseResponse(response, keys) {
  let intake = {};
  response.forEach((column, i) => {
    if (column === "") return;
    const key = keys[i];
    intake[key] = intake.hasOwnProperty(key) ? intake[key] : column;
  });

  // If missing emergency contact combine name and relationship (for Individual - Someone Else)
  if (!intake.hasOwnProperty("emergencyContact")) {
    intake.emergencyContact = `${intake.emergencyFirstName} ${intake.emergencyLastName} (${intake.emergencyRelation})`;
  }

  return intake;
}

/**
 * Adds a clients array to the intake object with each client found in the intake
 * @function processClients
 * @param {object} intake
 * @returns {object} intake with intake.clients array
 */
function processClients(intake) {
  const clients = [
    {
      firstName: intake.firstName,
      lastName: intake.lastName,
      dob: intake.dob,
      gender: intake.gender,
      email: intake.email,
    },
  ];
  for (let i = 2; i <= 8; i++) {
    if (
      intake.hasOwnProperty(`${i}_dob`) ||
      intake.hasOwnProperty(`${i}_firstName`)
    ) {
      const client = {
        firstName: intake[`${i}_firstName`] ?? "",
        lastName: intake[`${i}_lastName`] ?? intake.lastName,
        dob: intake[`${i}_dob`] ?? "",
        gender: intake[`${i}_gender`] ?? "",
        email: intake[`${i}_email`] ?? intake.email,
      };
      clients.push(client);
    }
  }
  intake.clients = clients;
  return intake;
}

/**
 * Renames values within the intake based on the rename object passed in. The rename object should have keys corresponding to the intake object fields.
 * Witin each key a set of key value pairs should have the existing values and the new values.
 * Example: { location: { "Online via video conference" : "online" }}
 * @param {object} intake
 * @rename {object} rename specifies which field and values to replace in intake (see example)
 * @returns {object} intake
 */
function renameResponses(intake, rename) {
  for (const field in rename) {
    const value = intake[field];
    for (const key in rename[field]) {
      if (value === key) {
        intake[field] = rename[field][key];
        break;
      }
    }
  }
  return intake;
}

/**
 * Log a message to the LOG_SHEET in the spreadsheet.
 * @function logResults
 * @param {string} message message to log
 * @data {*} data to log, will be stringified
 */
function logResults(message, data) {
  ss.getSheetByName(LOG_SHEET)
    .getRange(2, 1, 1, 3)
    .insertCells(SpreadsheetApp.Dimension.ROWS)
    .setValues([[new Date(), message, JSON.stringify(data)]]);
}

/**
 * Helper function to transpose a 2d array
 * @function transpose
 * @param {Array[]} matrix matrix to transpose
 * @returns {Array[]} transposed matrix
 */
function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

/**
 * Send intake data to AppBuilder
 * @function AppBuilderApiPostRequest
 * @param {Object} intake the intake data
 * @param {Object[]} intake.clients array of clients
 */
const AppbuilderAPIPostRequest = ({ clients, ...intake }) => {
  const data = {
    Clients: [],
    Intake: {
      Timestamp: intake.timestamp,
      "Provider Request": intake.provider,
      "Additional Services": intake.services,
      Feedback: intake.feedback,
      Clients__relation: [],
      Service: intake.service,
      Location: intake.location,
    },
  };

  // set Request api of AppBuilder V2
  const cookie = (() => {
    const res = UrlFetchApp.fetch(`${BASE_URL}/auth/login`, {
      "method": "post",
      "contentType": "application/x-www-form-urlencoded; charset=UTF-8",
      "payload": {
        tenant: USER.tenant,
        email: USER.email,
        password: USER.password
      }
    });
    return res.getHeaders()["Set-Cookie"];
  })();

  const api = {
    get: {
      "method": "get",
      "headers": {
        "Cookie": cookie
      }
    },
    post: {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "Cookie": cookie
      },
    },
    put: {
      "method": "put",
      "contentType": "application/x-www-form-urlencoded; charset=UTF-8",
      "headers": {
        "Cookie": cookie
      },
    },
    delete: {
      "method": "delete",
      "headers": {
        "Cookie": cookie
      },
    }
  }

  const application = {
    id: "05cde3ed-fd38-4e4c-b9a6-dfba9c979bdf",
    objects: {
      "Clients": "86fee2de-2ea4-463d-8d13-f27f13fc17dc",
      "Intake": "ee4a5b53-e05b-4a8e-ad95-f18327c0590b",
      "Group": "83eea47f-01c2-426f-b03a-81f918190c10"
    }
  };

  // Data Processor
  const uuid = {
    "Clients": []
  };
  // Clients Processor
  // Get exisiting Clients and Groups from server
  const abDataObject = {
    "Clients": (() => {
    try {
      const res = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Clients}`, api.get))

      logResults("Success: [GET] Clients", res);

      return res.data;
    } catch(err) {
      logResults("Error: [GET] Clients", err.message);

      return err;
    }
  })(),
    "Group": (() => {
      try {
        const res = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Group}`, api.get))

        logResults("Success: [GET] Group", res);

        return res.data;
      } catch(err) {
        logResults("Error: [GET] Group", err.message);

        return err;
      }
    })()
  };
  clients.forEach(client => {
    const clientIndex = abDataObject["Clients"]["data"].findIndex(e => (client.firstName + client.lastName).toLowerCase() === (e["First Name"] + e["Last Name"]).toLowerCase());
    const groupIndex = abDataObject["Group"]["data"].findIndex(e => e["Name"] === intake.org);

    if(clientIndex === -1)
      data.Clients.push({
        "Date Birth": client.dob,
        "Email": client.email,
        "Gender": client.gender,
        "Phone": intake.phone,
        "Thai Phone": intake.phoneThai,
        "Primary Language": intake.primLang,
        "Passport Country": intake.passport,
        "Service Country": intake.serviveCountry,
        "Occupation": intake.occupation,
        "Cross Cultural Service Years": intake.crossCulturalWork,
        "Referral": intake.refferal,
        "Newsletter": intake.newsletter,
        "Emergency Contact": intake.emergencyContact,
        "Emergency Email": intake.emergencyEmail,
        "Emergency Phone": intake.emergencyPhone,
        "Last Name": client.lastName,
        "First Name": client.firstName,
        "Group": abDataObject["Group"]["data"][groupIndex]?.uuid,
        "Org Report": intake.orgReq,
        "Org Contact": intake.orgContact,
        "Org Email": intake.orgEmail,
        "Availability": intake.availability,
        "Flexible Dates": intake.flexible,
        "First Time": intake.first,
        "Well First": intake.firstWell,
        "Topics": intake.topics,
        "Topics More Info": intake.topicsMore,
        "Medical Issues": intake.medical,
        "Prescription Medication": intake.perscription,
        "Concerns meeting together": intake.concern,
        "Concern Details": intake.concernDetail,
        "Cross Cultural Relationship": intake.crossCultural,
      });
    else {
      uuid["Clients"].push(abDataObject["Clients"]["data"][clientIndex].uuid);
    }
  });

  // Intake Processor
  // Set the Bill To field
  switch(intake["billTo"]) {
    case "First Partner":
      data["Intake"]["Bill to"] = `${intake["firstName"]} ${intake["lastName"]}`;
      break;
    
    case "Second Partner":
      data["Intake"]["Bill to"] = `${intake["2_firstName"]} ${intake["2_lastName"]}`;
      break;
    
    case "Parent/Guardian 1":
      data["Intake"]["Bill to"] = `${intake["firstName"]} ${intake["lastName"]}`;
      break;

    case "Parent/Guardian 2":
      data["Intake"]["Bill to"] = `${intake["2_firstName"]} ${intake["2_lastName"]}`;
      break;

    default:
      data["Intake"]["Bill to"] = intake["billTo"];
  }

  Logger.log(`Start to insert "Clients"`);
 
  // case "Clients":
  if(data.Clients.length) {
    data.Clients.forEach(e => {
      api.post.payload = JSON.stringify(e);
      const res = (() => {
        try {
          const res = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Clients}`, api.post));

          logResults("Success: [POST] Clients", res);

          return res;
        } catch(err) {
          logResults("Error: [POST] Clients", err.message);

          return err;
        }
      })();
      delete api.post.payload;
      uuid.Clients.push(res.data["uuid"]);
      Logger.log(res);
    });
  } else {
    Logger.log("All Clients exist!!");
    logResults("Success: [POST] Clients", {message: "All Clients exist"});
  }

  // case "Intake":
  api.post.payload = JSON.stringify(data.Intake);
  let res = (() => {
    try {
      const res = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Intake}`, api.post));

      logResults("Success: [POST] Intake", res);

      return res;
    } catch(err) {
      logResults("Error: [POST] Intake", err.message);

      return err;
    }
  })();
  delete api.post.payload;
  uuid.Intake = res.data["uuid"];
  Logger.log(res);
  

  // Intake => Clients
  Logger.log(`Start to connect object "Intake"`);
  api.put.payload = {};
  uuid["Clients"].forEach((e, i) => {
    api.put.payload[`Clients[${i}][uuid]`] = e;
  });

  // API PUT Request
   res = (() => {
    try {
      const res = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Intake}/${uuid.Intake}`, api.put));

      logResults("Success: [PUT] Intake", res);

      return res;
    } catch(err) {
      try {
        const resDel = JSON.parse(UrlFetchApp.fetch(`${BASE_URL}/app_builder/model/${application.objects.Intake}/${uuid.Intake}`, api.delete));

        logResults("Success: [DELETE] Intake", resDel);
      } catch(errDel) {
        logResults("Error: [DELETE] Intake", errDel.message);
      }
      
      logResults("Error: [PUT] Intake", err.message);

      return err;
    }
  })();
  delete api.put.payload;
  Logger.log(res);
  Logger.log("DONE!!");
};
