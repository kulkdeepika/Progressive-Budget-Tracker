let db;

const request = window.indexedDB.open("offlineTranscationsDB", 1);

request.onupgradeneeded = event => {
    db = event.target.result;

    const offlineStore = db.createObjectStore("offlineTranscationsList", {keyPath: "date"});
}

request.onsuccess = () => {
    db = event.target.result;

    if(navigator.onLine){
        checkDatabase();
    }
}

request.onerror = function(event) {
    console.log("Error!! " + event.target.errorCode);
};

function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["offlineTranscationsList"], "readwrite");
  
    // access your pending object store
    const offlineStore = transaction.objectStore("offlineTranscationsList");
  
    // add record to your store with add method.
    offlineStore.add(record);
}

function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["offlineTranscationsList"], "readwrite");
    // access your pending object store
    const offlineStore = transaction.objectStore("offlineTranscationsList");
    // get all records from store and set to a variable
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
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["offlineTranscationsList"], "readwrite");
  
          // access your pending object store
          const offlineStore = transaction.objectStore("offlineTranscationsList");
  
          // clear all items in your store
          offlineStore.clear();

          location.href = "/";
        });
      }
    };
  }

  window.addEventListener("online", checkDatabase);