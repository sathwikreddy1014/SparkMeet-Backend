// ses_sendemail.js
const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("./sesclient");

const createSendEmailCommand = (toAddress, fromAddress, subject, textBody, htmlBody) => {
  return new SendEmailCommand({
    Source: fromAddress, // verified sender
    Destination: { ToAddresses: [toAddress] }, // verified recipient
    Message: {
      Subject: { Charset: "UTF-8", Data: subject },
      Body: {
        Text: { Charset: "UTF-8", Data: textBody },
        Html: { Charset: "UTF-8", Data: htmlBody },
      },
    },
    ReplyToAddresses: [fromAddress],
  });
};

const run = async (toAddress, fromAddress) => {
  const subject = "SparkMeet Sandbox Test Email";
  const textBody = "Hello! This is a plain text test email from SparkMeet using SES sandbox.";
  const htmlBody = "<h1>Hello!</h1><p>This is an HTML test email from SparkMeet using SES sandbox.</p>";

  const sendEmailCommand = createSendEmailCommand(toAddress, fromAddress, subject, textBody, htmlBody);

  try {
    const response = await sesClient.send(sendEmailCommand);
    console.log("Email sent successfully! MessageId:", response.MessageId);
    return response;
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
};

module.exports = { run };
