const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { createCanvas } = require("canvas");
var ffmpeg = require("fluent-ffmpeg");
var image = require("./image.js");

var video = ffmpeg("input.mp4");
let filters = [];
let lastOutput = "[0:v]";

let finishVideo = () => {
  // console.log(filters);
  // console.log(lastOutput);
  video
    .addOption("-vf", "scale=1080:-1")
    .complexFilter(filters, lastOutput)
    .output("output.mp4")
    .on("error", function (er) {
      console.log("Error occured: " + er.message);
    })
    .on("end", function () {
      console.log("Video Complete");
    })
    .on("start", function (commandLine) {
      console.log("Spawned ffmpeg with command: \n" + commandLine);
    })
    .run();
};

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), robots);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  // eslint-disable-next-line camelcase
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        return console.error("Error while trying to retrieve access token", err);
      }
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function robots(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1I4fh0EJlY4bCEMFtLoO8ruyUqywA9lTAXqw9UjUdnLY",
      range: "Titles!A2:F"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        rows.map((row, i) => {
          console.log(`${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}`);

          const styles = image.getStyles();
          image.generateImage(`${row[0]}`, `${row[5]}`, styles);

          const startTime = row[2];
          const endTime = row[3];
          const output = `o${i}`;
          video.input(`./Images/${row[0]}.png`);
          filters.push({
            filter: "scale",
            options: { width: "iw", height: "ih" },
            inputs: [`[${i + 1}:v]`],
            outputs: `rescaled${i + 1}`
          });

          filters.push({
            filter: "overlay",
            options: {
              x: 0,
              y: 0,
              enable: `between(t,${startTime},${endTime})`
            },
            inputs: [lastOutput, `rescaled${i + 1}`],
            outputs: output
          });

          lastOutput = output;
        });
        finishVideo();
      } else {
        console.log("No data found.");
      }
    }
  );
}
