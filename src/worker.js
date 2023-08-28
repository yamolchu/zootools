const { workerData, parentPort } = require(`worker_threads`);
const axios = require("axios");
const { random } = require("user-agents");
const ac = require("@antiadmin/anticaptchaofficial");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");

const fs = require("fs");
const {
  anticaptchaApiKey,
  referral,
  proxyType,
  formType,
} = require("./resources/constants");
const { config } = require("process");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "./result.csv",
  header: [
    { id: "address", title: "Address" },
    { id: "email", title: "Email" },
    { id: "id", title: "Id" },
    { id: "proxy", title: "Proxy" },
  ],
  append: true,
});

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

run();

async function run() {
  await delay(3000); // сон перед открытием
  if (workerData[2] == `1`) {
    await Things(workerData);
  } else {
    console.log("такого типа функции не существует");
    process.exit(6); // 6 - код выхода
  }
  await delay(1000); // сон перед закрытием потока
  parentPort.close();
}

const event_id =
  formType === "zerion" ? "aOfkJhcpwDHpJVkzO6FB" : "vnpt2ZTORnZqBEQ5KGe2";
const URL =
  formType === "zerion"
    ? `https://form.zootools.co/go/aOfkJhcpwDHpJVkzO6FB?ref=${referral}`
    : `https://form.zootools.co/go/vnpt2ZTORnZqBEQ5KGe2?ref=${referral}`;
const SITE_KEY = "0x4AAAAAAABCOgX4x6RvmA0a";

class ZooTools {
  static event_id = null;
  static referral = null;

  constructor(email, address, proxy = null) {
    this.email = email;
    this.address = address;
    this.proxy = proxy
      ? proxyType === "http"
        ? `http://${proxy}`
        : `socks5://${proxy}`
      : null;
    this.headers = {
      authority: "audience-consumer-api.zootools.co",
      accept: "*/*",
      "accept-language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
      authorization: "Bearer",
      "content-type": "application/json",
      origin: "https://form.zootools.co",
      "user-agent": random().toString(),
    };
    // const agent = new SocksProxyAgent(this.proxy);
    const agent = new HttpsProxyAgent(this.proxy);

    console.log(this.proxy);
    this.session = axios.create({
      headers: this.headers,
      httpsAgent:
        proxyType === "http"
          ? new HttpsProxyAgent(this.proxy)
          : new SocksProxyAgent(this.proxy),
    });
  }

  async enter_raffle() {
    try {
      const response = await this.session.get(
        "https://api.ipify.org?format=json"
      );
      const ip = response.data.ip;
      console.log("Your IP address:", ip);
    } catch (error) {
      console.error("Error:", error.message);
    }
    // https://audience-consumer-api.zootools.co/v3/lists/aOfkJhcpwDHpJVkzO6FB/members
    const url = `https://audience-consumer-api.zootools.co/v3/lists/${ZooTools.event_id}/members`;
    console.log("event id: " + ZooTools.event_id);
    console.log("referral id: " + ZooTools.referral);

    const captchaResp = await ZooTools.__bypass_turnstile_captcha();

    const json_data = await {
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      utmContent: "",
      pageReferrer: "",
      email: this.email,
      cryptoAddress: this.address,
      hiddenFields: {
        productId: "",
        projectId: "",
        teamId: "",
        userId: "",
      },
      captchaToken: captchaResp,
      referral: ZooTools.referral,
    };
    try {
      const response = await this.session.post(url, json_data);
      if ((response.status = 200)) {
        const resultData = [
          {
            address: this.address,
            email: response.data.member.email,
            id: response.data.member.id,
            proxy: this.proxy,
          },
        ];
        await csvWriter
          .writeRecords(resultData)
          .then(() => {
            console.log("CSV file has been saved.");
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        console.log("Все не четко");
      }
    } catch (error) {
      console.log(error);
    }
  }

  static async __bypass_turnstile_captcha() {
    await ac.setAPIKey(anticaptchaApiKey);
    const token = await ac.solveTurnstileProxyless(URL, SITE_KEY, "login");
    return token;
  }
}

const Things = async (workerData) => {
  const accountData = await workerData[1];
  const refLink = await workerData[3];
  const anticaptchaApiKey = await workerData[4];

  const mail = await accountData.mail;
  const address = await accountData.address;
  const proxy = await accountData.proxy;
  const tmp = `account ${workerData[0]}:`;

  ZooTools.event_id = event_id;
  ZooTools.referral = referral;
  const zooTools = new ZooTools(mail, address, proxy);

  await zooTools.enter_raffle();

  console.log(tmp + " все заебись");
  process.exit(0);
};
