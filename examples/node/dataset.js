const { timer } = require("rxjs");

const { Notion } = require("../..");

const notion = new Notion({
  deviceId: process.env.NEUROSITY_DEVICE_ID,
  timesync: true
});

(async () => {
  await notion
    .login({
      email: process.env.NEUROSITY_EMAIL,
      password: process.env.NEUROSITY_PASSWORD
    })
    .catch((error) => {
      console.log(error);
    });

  console.log("attempting to init");

  const dataset = await notion.dataset();
  console.log("attempting to start");

  const metadata = {
    name: `test-${Date.now()}`,
    label: "test",
    maxDuration: 20000,
    experimentId: `exp-${Date.now()}`
  };

  const datasetStart = await dataset.start(metadata);
  console.log("started dataset recording", datasetStart);

  await timer(5000).toPromise();

  console.log("completing dataset recording");

  const completeMetadata = {
    ...metadata,
    sessionId: `sesh-${Date.now()}`
  };

  const datasetStop = await dataset.complete(completeMetadata);

  console.log("completed", datasetStop);
})();
