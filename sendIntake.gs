/**
 * Google Apps Script for integrating Well Intake form with AB App
 * Should be installed as script bound to the responses spreadsheet
 */

//Configuration
const RESPONSE_SHEET = "";
const KEYS_SHEET = "";
const LOG_SHEET = "";
const RENAME_SHEET = "";
const AB_AUTH_TOKEN = "";
const BASE_URL = "";
const ss = SpreadsheetApp.getActiveSpreadsheet();
const MM_TOKEN = ""; // Server Status Bot
const TEAM_URL = "";
const channel_id = ""; // Server Status

const USER = {
   tenant: "",
   email: "",
   password: ""
};

const applicationDefinition = {
   id: "05cde3ed-fd38-4e4c-b9a6-dfba9c979bdf",
   objects: {
      Clients: "86fee2de-2ea4-463d-8d13-f27f13fc17dc",
      Intake: "ee4a5b53-e05b-4a8e-ad95-f18327c0590b",
      Group: "83eea47f-01c2-426f-b03a-81f918190c10",
      BillingAccount: "7ecd7257-1023-4917-bc3f-88061293cf30"
   },
   fields: {
     PassportCountry: "6f9905ad-5071-4a0f-b7cf-53a6aa480afd",
   }
};

/**
 * Run once to install the trigger so that the new responses will be processed.
 * @function installtrigger
 */
// function intallTrigger() {
//   const triggers = ScriptApp.getProjectTriggers();
//   Logger.log(triggers);
//   if (triggers.length > 0) {
//     logResults('Trigger already installed');
//   } else {
//     ScriptApp.newTrigger('onIntakeReceived')
//         .forSpreadsheet(ss)
//         .onFormSubmit()
//         .create();
//     logResults('Trigger Installed');
//   }
// }

/**
 * Tests the onIntakeRecieved function with the first respose
 * @function test_onIntakeRecieved
 */
function test_onIntakeRecieved() {
   // for (let i = 11; i < 21; i++){
   //   const response = ss.getSheetByName(RESPONSE_SHEET).getDataRange().getValues()[i]; // datatestinput
   //   onIntakeReceived({values: response});
   // }
   const response = ss
      .getSheetByName(RESPONSE_SHEET)
      .getDataRange()
      .getValues()[20]; // datatestinput
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
         email: intake.email
      }
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
            email: intake[`${i}_email`] ?? intake.email
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
   if (message.includes("Error")) {
      sendMattermostMessage(message, data);
   }
}

/**
 * Helper function to transpose a 2d array
 * @function transpose
 * @param {Array[]} matrix matrix to transpose
 * @returns {Array[]} transposed matrix
 */
function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map(row => row[i]));
}

function abRequestCookie() {
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
}

function abRequestGetDefinitionByID(cookie, id) {
  return JSON.parse(
    UrlFetchApp.fetch(
      `${BASE_URL}/definition/myapps`,
      {
        "method": "get",
        headers: {
          "Cookie": cookie,
        }
      }
    )
      .toString()
      .replace("window.definitions=", "")
  )
    .filter((e) => e.id === id)[0];
}

function abRequestUpdateDefinitionByID(cookie, id, payload) {
  let result = null;

  try {
    const res = JSON.parse(
      UrlFetchApp.fetch(
        `${BASE_URL}/definition/${id}`,
        {
          method: "put",
          contentType: "application/x-www-form-urlencoded; charset=UTF-8",
          headers: {
            Cookie: cookie,
          },
          payload,
        }
      )
    );

    logResults(`Success: [${method.toUpperCase()}] ${objectName}`, res);

    result = res.data;
  } catch (err) {
    logResults(`Error: [${method.toUpperCase()}] ${objectName}`, err.message);

    result = err;
  }

  return result;
}

function abRequestObject(pathParameters, method, cookie, payload) {
   const headers = { Cookie: cookie };
   const api = {
      get: {
         method: "get",
         headers
      },
      post: {
         method: "post",
         contentType: "application/x-www-form-urlencoded; charset=UTF-8",
         headers
      },
      put: {
         method: "put",
         contentType: "application/x-www-form-urlencoded; charset=UTF-8",
         headers
      },
      delete: {
         method: "delete",
         headers
      }
   };

   // Lookup object name based path parameter (for logs)
   let objectName = "";
   const objectId = pathParameters.split("/")[0];

   for (const key in applicationDefinition.objects) {
      if (applicationDefinition.objects[key] === objectId) {
         objectName = key;
      }
   }

   // perpare params
   const params = api[method];
   if (payload) {
      params.payload = payload;
   }

   // make request
   let result = null;

   try {
      const res = JSON.parse(
        UrlFetchApp.fetch(
          `${BASE_URL}/app_builder/model/${pathParameters}`,
          params
        )
      );

      logResults(`Success: [${method.toUpperCase()}] ${objectName}`, res);

      result = res.data;
   } catch (err) {
      logResults(`Error: [${method.toUpperCase()}] ${objectName}`, err.message);

      result = err;
   }

   return result;
}

function test_getExisitingData() {
  const cookie = abRequestCookie();
  const data = getExisitingData(cookie);
  Logger.log(data);
}

function getExisitingData(cookie, objectUUID, where) {
  const queryParameters = Object.keys(where).map((e) => `where[${e}]=${encodeURIComponent(where[e])}`);
  return abRequestObject(`${objectUUID}/?${queryParameters.join("&")}`, "get", cookie) ?? [];
}
/**
 * Send intake data to AppBuilder
 * @function AppBuilderApiPostRequest
 * @param {Object} intake the intake data
 * @param {Object[]} intake.clients array of clients
 */

const AppbuilderAPIPostRequest = ({clients, ...intake}) => {
  // Prepare data to update in AB
  const data = {
    "Clients": [],
    "Intake": {
      "Timestamp": intake.timestamp,
      "Provider Request": intake.provider,
      "Additional Services": intake.services,
      "Feedback": intake.feedback,
      "Clients__relation": [],
      "Service": intake.service,
      "Location": intake.location,
      "Type": intake.type,
    },
    "BillingAccount": {},
    "Group": {
      "Name": intake.org,
    }
  };
  
  // set Request api of AppBuilder V2
  const cookie = abRequestCookie();
  const clientIds = [];
  const existingGroup = getExisitingData(cookie, applicationDefinition.objects["Group"], { "Name": data["Group"]["Name"]?.toLowerCase() })["data"];
  const group = existingGroup.length ? existingGroup[0]: abRequestObject(applicationDefinition.objects["Group"], "post", cookie, data["Group"]);

  // Prepare Clients
  //  - Commented out logic to check for duplicate clients. If we need to check for duplicates need to decide on what provides enough uniqueness.
  clients.forEach(client => {
    // Check if client exists
    const existingClients = getExisitingData(cookie, applicationDefinition.objects["Clients"], {
      "Gender": client.gender?.toLowerCase(),
      "First Name": client.firstName?.toLowerCase(),
      "Last Name": client.lastName?.toLowerCase(),
      "Email": client.email?.toLowerCase(),
    })["data"];
  
    if (existingClients.length) {
      clientIds.push(existingClients[0].uuid);

      return;
    }

    const definitionPassportCountry = abRequestGetDefinitionByID(cookie, applicationDefinition.fields.PassportCountry);
    
    if (
      definitionPassportCountry.json.settings.options.findIndex(
          (e) => e.id === intake.passport
      ) === -1
    ) {
      const templateCountry = {
        id: intake.passport,
        text: intake.passport,
        hex: "#F44336",
        translations: [
          {
            language_code: "en",
            text: intake.passport,
          },
        ]
      };

      definitionPassportCountry.json.settings.options.push(templateCountry)
      abRequestUpdateDefinitionByID(cookie, applicationDefinition.fields.PassportCountry, { json: JSON.stringify(definitionPassportCountry.json) });
    }

    // If not prepare the data to add them
    data.Clients.push({
      "Date Birth": client.dob,
      "Email": client.email,
      "Gender": client.gender,
      "Phone": intake.phone,
      "Thai Phone": intake.phoneThai,
      "Primary Language": intake.primLang,
      "Passport Country": intake.passport,
      "Service Country": intake.serviceCountry,
      "Occupation": intake.occupation,
      "Cross Cultural Service Years": intake.crossCulturalWork,
      "Referral": intake.refferal,
      "Newsletter": intake.newsletter,
      "Emergency Contact": intake.emergencyContact,
      "Emergency Email": intake.emergencyEmail,
      "Emergency Phone": intake.emergencyPhone,
      "Last Name": client.lastName,
      "First Name": client.firstName,
      "Group": group.uuid,
      "Org Report": intake.orgReq,
      "Org Contact": intake.orgContact,
      "Org Email": intake.orgEmail,
      "Availability_lt": intake.availability,
      "Flexible Dates": intake.flexible,
      "First Time": intake.first,
      "Well First": intake.firstWell,
      "Topics_lt": intake.topics,
      "Topics More Info_lt": intake.topicsMore,
      "Medical Issues": intake.medical,
      "Prescription Medication": intake.perscription,
      "Concerns meeting together": intake.concern,
      "Concern Details_lt": intake.concernDetail,
      "Cross Cultural Relationship": intake.crossCultural,
    });
  });


  // Prepare Billing Account
  data.BillingAccount.Type = "Client";
  data.BillingAccount.Organization = group.uuid;
  data.BillingAccount["Emergency Email"] = intake.emergencyEmail;
  switch(intake["billTo"]) {
    case "First Partner":
    case "Parent/Guardian 1":
      data.BillingAccount.Name = `${intake["firstName"]} ${intake["lastName"]}`;
      data.BillingAccount.Email = intake.email;
      break;
    
    case "Second Partner":
    case "Parent/Guardian 2":
      data.BillingAccount.Name = `${intake["2_firstName"]} ${intake["2_lastName"]}`;
      data.BillingAccount.Email = intake["2_email"];
      break;

    case undefined:
    case "":
      data.BillingAccount.Name = `${intake["firstName"]} ${intake["lastName"]}`;
      data.BillingAccount.Email = intake.email;
      break;

    default:
      data.BillingAccount.Name = `${intake["firstName"]} ${intake["lastName"]}`;
      data.BillingAccount.Email = intake.email;
      data.BillingAccount.Note = intake.billTo;
      data.BillingAccount.Type = "1652753709068"; // Unknown option
  }
  Logger.log(data.BillingAccount);
  // Start Inserting Data
  Logger.log(`Start to insert "Clients"`);

  // 1. Post Clients
  if(data.Clients.length) {
    data.Clients.forEach(client => {
      const res = abRequestObject(applicationDefinition.objects.Clients, "post", cookie, client);
      Logger.log(res);
      clientIds.push(res.uuid);
    });

  } else {
    Logger.log("All Clients exist!!");
    logResults("Success: [POST] Clients", {message: "All Clients exist"});
  }

  // 2. Post Billing Account
  const billingAccountRes = abRequestObject(applicationDefinition.objects.BillingAccount, "post", cookie, data.BillingAccount);
  data.Intake["Intakes"] = billingAccountRes.uuid;

  // Fix: Replace emojis with char code so our db doesn't complain
  data.Intake["Feedback"] = data.Intake["Feedback"] ? data.Intake["Feedback"].replace(/[\u0800-\uFFFF]/g, c => `&#${c.charCodeAt(0)};`): data.Intake["Feedback"];
  
  // 3. Post Intake
  const intakeRes = abRequestObject(applicationDefinition.objects.Intake, "post", cookie, data.Intake);
  const intakeId = intakeRes.uuid;
  Logger.log(intakeRes);
  

  // 4. Put Link Clients to Intake
  Logger.log(`Start to connect object "Intake"`);
  const payload = {};
  clientIds.forEach((id, i) => {
    payload[`Clients[${i}][uuid]`] = id;
  });

  abRequestObject(`${applicationDefinition.objects.Intake}/${intakeId}`,"put", cookie, payload);
  Logger.log("DONE!!");
}

function sendMattermostMessage(message, data) {
  const headers = {
    "authorization": `Bearer ${MM_TOKEN}`,
  };
  const attachment = {
    title: "Well Intake Script",
    text: message,
    color: "#FC4C46",
    fields: [
      {
        "title":"Details",
        "value": data,
      },
    ]
  };

  const body = {
    channel_id,
    "message": "",
    "props": {"attachments": [attachment]}
  }

  UrlFetchApp.fetch(`${TEAM_URL}/posts`, {
    method: 'post',
    contentType: "application/json",
    headers,
    payload: JSON.stringify(body),
  });
}
