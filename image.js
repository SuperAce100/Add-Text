const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { createCanvas } = require("canvas");
var styles = {};
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token1.json";

fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), getStyles);
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
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

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
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
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

function fromPercent(valNum) {
  var decimalValue = Math.round((valNum * 255) / 100);
  if (valNum < 7) {
    var hexValue = "0" + decimalValue.toString(16).toUpperCase();
  } else {
    var hexValue = decimalValue.toString(16).toUpperCase();
  }
  return hexValue;
}

function getStyles(auth) {
  // Load client secrets from a local file.

  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1I4fh0EJlY4bCEMFtLoO8ruyUqywA9lTAXqw9UjUdnLY",
      range: "Styles!A2:L"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        rows.map((row, i) => {
          // console.log(`${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}`);
          styles[`${row[0]}`] = {
            parent: `${row[1]}`,
            fontSize: `${row[2]}`,
            fontColor: `${row[3]}`,
            backgroundColor: `${row[4]}`,
            fontWeight: `${row[5]}`,
            fontFamily: `${row[6]}`,
            position: `${row[7]}`,
            textMargin: row[8],
            fullscreen: `${row[9]}`,
            margin: row[10],
            opacity: row[11]
          };
        });
      } else {
        console.log("No data found.");
      }
    }
  );
  return styles;
}

function generateImage(text, selectedStyle) {
  if (!styles[selectedStyle]) {
    console.log(`The style: ${style} does not exist.`);
    return 1;
  }
  const style = styles[selectedStyle];
  // console.log({ style });
  const width = 3840;
  const height = 2160;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  const lines = text.split(/\r\n|\r|\n/).length;

  var textMargin = Number(style.textMargin);
  const margin = Number(style.margin);
  const textSize = style.fontSize;

  context.font = `${style.fontWeight} ${textSize}pt ${style.fontFamily}`;
  context.textAlign = "left";
  context.textBaseline = "top";

  const fontColor = style.fontColor;
  const backgroundColor = style.backgroundColor + fromPercent(style.opacity);

  const xPos = (style.position + " Center").split(" ")[1];
  const yPos = (style.position && style.position.split(" ")[0]) || "Bottom";

  // context.textAlign = xPos.toLowerCase();
  // context.textBaseline = yPos.toLowerCase();

  const textWidth = context.measureText(text).width;

  const textHeight =
    textSize * lines + 2 * textMargin + (lines - 1) * 2 * textMargin;

  if (style.fullscreen == "TRUE") {
    context.fillStyle = `${backgroundColor}`;

    context.fillRect(0, 0, width, height);

    context.fillStyle = `${fontColor}`;
    context.fillText(
      text,
      width / 2 - textWidth / 2,
      height / 2 - textHeight / 2
    );
  } else {
    switch (xPos) {
      case "Left":
        switch (yPos) {
          case "Top":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              margin,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(text, margin + textMargin, margin + textMargin/2);
            break;
          case "Center":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height / 2 - textHeight / 2,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              margin + textMargin,
              height / 2 - textHeight / 2
            );
            console.log(`${margin + textMargin}`);
            console.log(`${height / 2 - textHeight / 2}`);
            break;
          case "Bottom":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              margin + textMargin,
              height - textHeight - margin + textMargin/2
            );
            break;
          default:
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(text, margin + textMargin, height - textHeight);
            break;
        }
        break;
      case "Center":
        switch (yPos) {
          case "Top":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width / 2 - textWidth / 2 - textMargin,
              margin,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(text, width / 2 - textWidth / 2, margin);
            break;
          case "Center":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width / 2 - textWidth / 2 - textMargin,
              height / 2 - textHeight / 2,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width / 2 - textWidth / 2,
              height / 2 - textHeight / 2
            );
            break;
          case "Bottom":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width / 2 - textWidth / 2 - textMargin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width / 2 - textWidth / 2,
              height - textHeight - margin
            );
            break;
          default:
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width / 2 - textWidth / 2 - textMargin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width / 2 - textWidth / 2,
              height - textHeight - margin
            );
            break;
        }
        break;
      case "Right":
        switch (yPos) {
          case "Top":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width - textWidth - 2 * textMargin - margin,
              margin,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width - textWidth - textMargin - margin,
              margin
            );
            break;
          case "Center":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width - textWidth - 2 * textMargin - margin,
              height / 2 - textHeight / 2,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width - textWidth - textMargin - margin,
              height / 2 - textHeight / 2 + textMargin/2
            );
            break;
          case "Bottom":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width - textWidth - 2 * textMargin - margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width - textWidth - textMargin - margin,
              height - textHeight - margin
            );
            break;
          default:
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              width - textWidth - 2 * textMargin - margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              width - textWidth - textMargin - margin,
              height - textHeight - margin
            );
            break;
        }
        break;
      default:
        switch (yPos) {
          case "Top":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              margin,
              textWidth + 2 * margin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(text, margin + textMargin, margin + textMargin);
            break;
          case "Center":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height / 2 - textHeight / 2,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              margin + textMargin,
              height / 2 - textHeight / 2
            );
            break;
          case "Bottom":
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              margin + textMargin,
              height - textHeight - margin
            );
            break;
          default:
            context.fillStyle = `${backgroundColor}`;
            context.fillRect(
              margin,
              height - margin - textHeight,
              textWidth + 2 * textMargin,
              textHeight
            );

            context.fillStyle = `${fontColor}`;
            context.fillText(
              text,
              margin + textMargin,
              height - textHeight - margin
            );
            break;
        }
    }
  }

  console.log(`textWidth: ${textWidth}, xPos: ${xPos}, yPos: ${yPos}, `);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(`./Images/${text}.png`, buffer);
  return 0;
}

module.exports = { generateImage, getStyles };
