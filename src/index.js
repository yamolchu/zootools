const { Worker, parentPort } = require("worker_threads");
const chalk = require("chalk");
const constants = require("./resources/constants.js");
const fs = require("fs");
("use strict");

const threadCount = constants.threadCount;
const typeOfFunc = constants.typeOfFunc;
const refLink = constants.refLink;
const anticaptchaApiKey = constants.anticaptchaApiKey;

const workerPath = "./src/worker.js";

// получаем и красим время
async function logColoredTime() {
  const currentTime = new Date().toLocaleTimeString();
  const coloredTime = chalk.yellow(currentTime);
  return coloredTime;
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Функция для чтения файла и возврата содержимого в виде массива строк
function readFileLines(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return fileContent.split("\n").filter((line) => line.trim() !== "");
}

// Функция для создания объекта JSON в требуемом формате
function createDataObject(mail, address, proxy) {
  return {
    mail: mail.trim(),
    address: address.trim(),
    proxy: proxy.trim(),
  };
}

// Чтение файлов
const proxies = readFileLines("./src/resources/proxies.txt");
const emails = readFileLines("./src/resources/emails.txt");
const addresses = readFileLines("./src/resources/addresses.txt");

// Проверка, что все файлы имеют одинаковую длину
if (proxies.length !== emails.length || proxies.length !== addresses.length) {
  console.log("Ошибка: файлы имеют разную длину");
  process.exit(1);
}

// Создание массива объектов JSON
const data = [];
for (let i = 0; i < proxies.length; i++) {
  const mail = emails[i];
  const address = addresses[i];
  const proxy = proxies[i];
  const dataObject = createDataObject(mail, address, proxy);
  data.push(dataObject);
}

const massiv = JSON.parse(JSON.stringify(data, null, 2));
run(massiv, threadCount);

async function run(massiv, threadCount) {
  let countRn = 0;
  let i = -1;
  while (i < massiv.length - 1) {
    if (countRn < threadCount) {
      i = i + 1;
      countRn = countRn + 1;
      await percussionB(i);
      await delay(100);
    } else {
      await delay(4000);
    }
  }

  function workerStart(i) {
    const worker = new Worker(workerPath, {
      workerData: [i, massiv[i], typeOfFunc, refLink, anticaptchaApiKey],
    });
    return worker;
  }

  async function percussionB(i) {
    const worker = workerStart(i);
    worker.on("message", async (msg) => {
      const timern = await logColoredTime();
      if (msg.error) {
        let log = `${timern}: acc n ${i} message: ${msg}`;
        console.log(chalk.cyanBright(log));
      } else {
        let log = `${timern}: acc n ${i} message: ${msg}`;
        console.log(chalk.cyanBright(log));
      }
    });

    worker.on("exit", async (exitmsg) => {
      const timern = await logColoredTime();
      console.log(`${timern}: acc n ${i} exit with code `, exitmsg);
      if (exitmsg == 6) {
        process.exit();
      }
      countRn = countRn - 1;
    });

    worker.on("error", async (error) => {
      const timern = await logColoredTime();
      console.log(`${timern}: acc n ${i} error: ${error}`);
    });

    worker.on("online", async () => {
      const timern = await logColoredTime();
      let log = `${timern}: acc n ${i} start`;
      console.log(chalk.blueBright(log));
    });
  }
}
