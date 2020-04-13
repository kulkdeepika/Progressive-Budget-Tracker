//let db be the global variable that holds the indexed database
let db;

// request to open the local database
const request = window.indexedDB.open("offlineTranscationsDB", 1);

// This is executed only when there is a new db or version changed
request.onupgradeneeded = event => {
    db = event.target.result;

    const offlineStore = db.createObjectStore("offlineTranscationsList", {keyPath: "date"});
}

// on success event
request.onsuccess = () => {
    db = event.target.result;

    //here we check to see if the user is online, and push data (if any) from indexdb to remote db
    if(navigator.onLine){
        sendDataToRemoteDB();
    }
}

// handle any errors related to database
request.onerror = function(event) {
    console.log("Error!! " + event.target.errorCode);
};

// This function is called when the client tried to post data to server and failed
// We instead store the data in index db

function saveRecord(record) {
    const transaction = db.transaction(["offlineTranscationsList"], "readwrite");
  
    const offlineStore = transaction.objectStore("offlineTranscationsList");
  
    offlineStore.add(record);
}

// This function is called when the user's connectivity changes to online, and also if there is data
// as soon as the db is opened
function sendDataToRemoteDB() {

  const transaction = db.transaction(["offlineTranscationsList"], "readwrite");

  const offlineStore = transaction.objectStore("offlineTranscationsList");

  // get all the records from the local db 
  const getAll = offlineStore.getAll();
  
  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        
        const transaction = db.transaction(["offlineTranscationsList"], "readwrite");
  
        const offlineStore = transaction.objectStore("offlineTranscationsList");
  
        offlineStore.clear();

        // reload the page with new data from server
        location.href = "/";
      });
    }
  };
}

window.addEventListener("online", sendDataToRemoteDB);