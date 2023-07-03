const cron = require('node-cron');

const scheduleReminder =  (post, scheduledTime) => {
    const scheduleDateTime = new Date(scheduledTime);

    console.log(scheduleDateTime);

    // Calculate the cron pattern for the scheduled time
    const cronPattern = `${scheduleDateTime.getSeconds()} ${scheduleDateTime.getMinutes()} ${scheduleDateTime.getHours()} ${scheduleDateTime.getDate()} ${scheduleDateTime.getMonth() + 1} *`;

    cron.schedule (cronPattern, async () => {
        const currentDateTime = new Date();

        if (scheduleDateTime <= currentDateTime) {
            // Send reminder/notification logic goes here
            post.published = true
            post.scheduleDate = undefined
            post.publishedDate = Date.now()
            await post.save({ validateBeforeSave: false })
            console.log(`Reminder for task: ${post.slug}`);
        }
    });
};

module.exports = scheduleReminder;
