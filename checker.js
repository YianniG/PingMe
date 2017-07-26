let store = chrome.storage.sync;
let notifications = chrome.notifications;
let alarms = chrome.alarms;
let browserAction = chrome.browserAction;

const urlStoreLocation = "pingme_urls";
let urlStatusPending = 0;
let pingUrls = [];

let supportivePhrases = ["Right up my sleeve", "The sky's your oyster", 
    "I dont't want you to put your back out of joint", 
    "What ever floats your fancy", "Rest assured, I got your back", 
    "Right away!"];

function storeUrls () {
  store.set({"pingme_urls": pingUrls});
}

function loadUrls(callback) {
  store.get({"pingme_urls": []}, function (storage) {
    console.log(storage);
    let urls = storage[urlStoreLocation];
    callback(urls);
  });
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function sendIsOnlineNotification(url) {
  let createNotification = notifications.create(
      url, {
      "type": "basic",
      "title": "Ping!",
      "message": `${url} is back online!`,
      "iconUrl":"icons/pingme.png"
      });
}

function sendWillPingNotification(url) {
  let createNotification = notifications.create(
      url, {
      "type": "basic",
      "title": supportivePhrases[Math.floor(Math.random() * 
          supportivePhrases.length)],
      "message": "I'll let you know when " + url + " is online",
      "iconUrl":"icons/pingme.png"
      });
}

function isUp(url) {
  for (let i = 0; i < pingUrls.length; i+=1) {
    if (url === pingUrls[i]) {
      pingUrls[i] = undefined;
    }
  }
}

function checkIfUp() {
  pingUrls.forEach(function (url) {
    if (url !== undefined) {
      let check = new XMLHttpRequest();

      check.onreadystatechange = function () {
        if (check.readyState === XMLHttpRequest.DONE) {
          console.log(`${url} is up`);
          sendIsOnlineNotification(url);
          isUp(url);
          urlStatusPending -= 1;
        }
      }

      try {
        check.open("GET", url, true);
      } catch (err) {
        onError(err);
      }

      check.send();
      urlStatusPending += 1;
    }
  });
}

function addUrl(url) {
  pingUrls.push(url);
  storeUrls();
  sendWillPingNotification(url);
}

function handleToolbarClick(tab) {
  let url = tab.url;
  pingUrls.push(url);
  addUrl(url);
}

alarms.create("pingUrls", {"periodInMinutes": 1});
alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "pingUrls") {
    checkIfUp();
  }

  if (urlStatusPending === 0) {
    pingUrls = pingUrls.filter(function (url) {
      return url !== undefined;
    });
    storeUrls();
  }
});

browserAction.onClicked.addListener(handleToolbarClick);
loadUrls(function (urls) {
  urls.forEach(function (url) {
    pingUrls.push(url);
  });

  checkIfUp();
});
