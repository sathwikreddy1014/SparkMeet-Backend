const cron = require("node-cron");
const { subDays, startOfDay, endOfDay } = require("date-fns");
const sendEmail = require("./sendemail");
const ConnectionRequest = require("../models/connectionRequest");

// This job will run at 8 AM in the morning everyday
cron.schedule("40 14 * * *", async () => {
  // Send emails to all people who got requests the previous day
  try {
    const yesterday = subDays(new Date(), 0);

    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);

    const pendingRequests = await ConnectionRequest.find({
      status: "like",
      createdAt: {
        $gte: yesterdayStart,
        $lt: yesterdayEnd,
      },
    }).populate("fromuserId touserId");

    const listOfEmails = [
      ...new Set(pendingRequests.map((req) => req.touserId.emailId)),
    ];

    console.log(listOfEmails);

    for (const email of listOfEmails) {
      // Send Emails
      try {
        const res = await sendEmail.run(
          "New Friend Requests pending for " + email,
          "Ther eare so many frined reuests pending, please login to sparkmeet.work.gd and accept or reject the reqyests."
        );
        console.log(res);
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.error(err);
  }
});