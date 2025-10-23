const { SESClient } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: "ap-south-1", // or your actual AWS region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = { sesClient };
