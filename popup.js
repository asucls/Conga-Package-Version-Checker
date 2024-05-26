var conn = null;
var sessionId = null;
var instanceUrl = null;
let text =
  "<table> <tr> <th>Package Name</th> <th>NameSpace Prefix</th>   <th>Version Number</th> </tr>";

try {
  console.log("Inside Popup JS");
  getcookie();
} catch (error) {}

let excluderegex =
  /(login|help|developer|success|appexchange|partners|test).salesforce.com/;
function getcookie() {
  if(window.location.pathname == '/popup.html' && window.location.search.includes('host')) {
    let host = new URLSearchParams(window.location.search).get('host');
    instanceUrl = host;
  }
  chrome.tabs.query({ currentWindow: true, active: true }, (resp) => {
    let tab = resp[0];

    if (tab.url && tab.url.includes(".vf.force.com")) {
      let div = document.getElementById("txt");
      div.innerText = "Please move to a Record page or Home page";
    }

    if (
      tab.url &&
      (tab.url.includes(".lightning.force.com") ||
        tab.url.includes(".salesforce.com")) || 
        instanceUrl
    ) {
      if (!instanceUrl) {
        let url = tab.url.replace("https://", "").split("/")[0];
        url = url.replace(".lightning.force.com", ".my.salesforce.com");
        instanceUrl = "https://" + url;
      }
      console.log(instanceUrl);
      let port = chrome.runtime.connect({ name: "Get Session" });
      port.postMessage(instanceUrl.replace("https://", ""));
      port.onMessage.addListener(function (sessionId) {
        console.log(sessionId);
        conn = new jsforce.Connection({
          serverUrl: instanceUrl,
          instanceUrl: instanceUrl,
          sessionId: sessionId,
          version: "50.0",
        }); //jsforce

        console.log("successfully connected to JSForce" + conn);
        //window.close();

        console.log("Removing content inside 'txt' id element");
        let div = document.getElementById("txt");
        if (div) {
          div.parentNode.removeChild(div);
        }
        // Unhide the View Packages Button on Popup HTML
        let btn = document.getElementById("btn");
        btn.setAttribute("style", "visibility: visible");

        let viewTriggersButton = document.getElementById("ViewTriggersBtn");
        viewTriggersButton.setAttribute("style", "visibility: visible");

        fetchPackageFromOrg();
        fetchTriggersOnAgreementObjectFromOrg();
    })
    }
});
}
/*
      if(tab.url.includes(".sandbox.")){

        if(tab.url.includes(".force.com")){
          instanceUrl = tab.url.split('.')[0] + "." + tab.url.split('.')[1] + '.lightning.force.com';
        }
        else{
          instanceUrl = tab.url.split('.')[0] + "." + tab.url.split('.')[1] + '.my.salesforce.com';
        }
      }
      else if (tab.url.includes(".force.com")){
        instanceUrl = tab.url.split('.')[0] + '.lightning.force.com';
      }
      else{
        instanceUrl = tab.url.split('.')[0] + '.my.salesforce.com';
      }

      console.log(instanceUrl);
      if (
        (tab.url.includes(".force.com") ||
        tab.url.includes(".salesforce.com") && !tab.url.match(excluderegex))
      )
      
        chrome.cookies.get({ url: tab.url, name: "sid" }, (resp) => {
          if (resp) {
            console.log(resp);

            // Lightning - "00D8c000005Jno9!ARQAQOB5_2kBITWmKZukjbaI1USFQylUjb429Bgt8gkf2dURS7QcDLYvgPop.8PEK0lxeIXrtYmPqB2a5jdcLCFpC4jfGJh3"
            // Classic - "00D8c000005Jno9!ARQAQGlWTaHsR9ROjwlMUQ9PpDorGAqJSU4i5YAtGly1E_13N8t40tbNsQKsEvoubCNxVvp.Kz83r3.gQfEWMU60A10SiHjI"
            //"00D530000004df5!AR4AQNGFxRls15VTsjD5GBf9tRmIfy7AVw9HWz3qv5_u.GCaU3Umivt5FSYazeaNYSmUnrrY6soAWdqm1oO1H_558BriOX23"
            chrome.runtime.sendMessage({ cookie: resp }, () => {
              sessionId = resp.value;
              // Remove the text from Popup HTML which asks to be in a logged in SFDC Tab
              //sessionId = "00D8c000005Jno9!ARQAQGlWTaHsR9ROjwlMUQ9PpDorGAqJSU4i5YAtGly1E_13N8t40tbNsQKsEvoubCNxVvp.Kz83r3.gQfEWMU60A10SiHjI";
              console.log("Removing content inside 'txt' id element");
              let div = document.getElementById('txt');
              if (div) {
                div.parentNode.removeChild(div);
              }
              // Unhide the View Packages Button on Popup HTML
              let btn = document.getElementById('btn');
              btn.setAttribute("style", "visibility: visible");

              conn = new jsforce.Connection({
                serverUrl: instanceUrl,
                instanceUrl: instanceUrl,
                sessionId: sessionId,
                version: '50.0',

            });
            console.log(conn);
              //window.close();
            fetchPackageFromOrg();
            });
          }
        });
    });
  }
*/
function fetchPackageFromOrg() {
  console.log("Inside Fetch Package Funtion");
  conn.tooling.query(
    "select id, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name, SubscriberPackageVersion.Name, SubscriberPackageVersion.MajorVersion, SubscriberPackageVersion.MinorVersion, SubscriberPackageVersion.PatchVersion from InstalledSubscriberPackage",
    function (err, result) {
      if (err) {
        return console.error(err);
      }
      console.log(result);
      for (var i = 0; i < result.records.length; i++) {
        var PackageRow =
          result.records[i].SubscriberPackage.Name +
          "\t" +
          result.records[i].SubscriberPackage.NamespacePrefix +
          "\t" +
          result.records[i].SubscriberPackageVersion.Name;
        console.log(PackageRow);

        if (result.records[i].SubscriberPackageVersion.PatchVersion != "0") {
          var versionnumber =
            result.records[i].SubscriberPackageVersion.MajorVersion +
            "." +
            result.records[i].SubscriberPackageVersion.MinorVersion +
            "." +
            result.records[i].SubscriberPackageVersion.PatchVersion;
        } else {
          var versionnumber =
            result.records[i].SubscriberPackageVersion.MajorVersion +
            "." +
            result.records[i].SubscriberPackageVersion.MinorVersion;
        }

        let check = result.records[i].SubscriberPackage.NamespacePrefix;
        if (check != null) {
          // var check1 = check.includes('Apttus');
          // var check2 = check.includes("Conga");
          //  var check3 = check.includes("APTX")

          if (
            check.includes("Apttus") ||
            check.includes("cnga") ||
            check.includes("Conga") ||
            check.includes("APTX") ||
            check.includes("CRMC_PP") ||
            check.includes("APXT") ||
            check.includes("FSTR")
          ) {
            //console.log(toolingAPIResponse.records[i].SubscriberPackage.Name);
            text +=
              "<tr><td>" +
              result.records[i].SubscriberPackage.Name +
              "</td><td>" +
              result.records[i].SubscriberPackage.NamespacePrefix +
              "</td><td>" +
              versionnumber +
              "</td></tr>";
          }
        }
      }
      text += "</table>";
      console.log(text);
      sendTableToBackground();
      var tableContainer = document.getElementById("message1");
      console.log(tableContainer);
      if (tableContainer) {
        tableContainer.innerHTML = text;
      }
    }
  );  
}

function fetchTriggersOnAgreementObjectFromOrg() {
  // console.log("Ayush Edit starts");
  conn.tooling.query(
    `SELECT Id, Name, TableEnumOrId, ApiVersion, Status
    FROM ApexTrigger
    WHERE TableEnumOrId IN (
      'Apttus__APTS_Agreement__c',
      'Apttus__AgreementLineItem__c',
      'Apttus__DocumentVersion__c',
      'Apttus__DocumentVersionDetail__c',
      'Apttus__APTS_Template__c',
      'Apttus__CycleTimeGroupData__c'
    )
    AND NamespacePrefix = null`,
    function (err, result) {
      if (err) console.log("error in Ayush Edit: " + err);
      // console.log("Success in Ayush Edit: " + result);
      console.log(result);
      renderTriggersTable(result.records);
    }
  );
}

function renderTriggersTable(data) {
  console.log('Inside Render Triggers Table function');
  const objects = {
    Apttus__APTS_Agreement__c: "Agreement",
    Apttus__AgreementLineItem__c: "Agreement Line Item",
    Apttus__DocumentVersion__c: "Document Version",
    Apttus__DocumentVersionDetail__c: "Document Version Detail",
    Apttus__APTS_Template__c: "Template",
    Apttus__CycleTimeGroupData__c: "Cycle Time Group Data"
  };
  const keys = ['Name', 'TableEnumOrId', 'ApiVersion', 'Status']; // Selected keys
  let table = document.getElementById('triggersTable');
  let header = table.createTHead().insertRow();
  header.insertCell().outerHTML = '<th>Name</th>';
  header.insertCell().outerHTML = '<th>Object</th>';
  header.insertCell().outerHTML = '<th>API Version</th>';
  header.insertCell().outerHTML = '<th>Status</th>';
  let body = table.createTBody();
  data.forEach(function(obj) {
      let row = body.insertRow();
      keys.forEach(function(key) {
        let cell = row.insertCell();
        if(key == 'Name') {
          let triggerLinkElement = document.createElement('a');
          triggerLinkElement.href = instanceUrl + '/lightning/setup/ApexTriggers/page?address=%2F' + obj['Id'];
          triggerLinkElement.target = 'blank';
          triggerLinkElement.text = obj[key];
          cell.appendChild(triggerLinkElement);
        }  else if (key == 'TableEnumOrId') {
            cell.innerHTML = objects[obj[key]];
        } else {
            cell.innerHTML = obj[key];
          }
      });
  });
}

function sendTableToBackground() {
  document.getElementById("btn").addEventListener("click", function () {
    let packagesContainer = document.getElementById("packagesContainer");
    if(packagesContainer.style.display !== "none") {
      packagesContainer.style.display = "none";
    } else {
      packagesContainer.style.display = "block";
    }
    document.getElementById("triggersContainer").style.display = "none";
    // let searchBar = document.getElementById("myInput");
    // searchBar.setAttribute("style", "visibility: visible");

    // var tableContainer = document.getElementById("message1");
    // console.log(tableContainer);
    // if (tableContainer) {
    //   tableContainer.innerHTML = text;
    // }

    /*
    window.open(
      "packages.html", "_blank");
    chrome.runtime.sendMessage({ tableData: text });

    chrome.tabs.create({ url: chrome.runtime.getURL("package.html") });
    
    var port = chrome.runtime.connect({ name: "popupToGetPackages" });
    var dataToSend = {
        variable1: text,
      };
      console.log(dataToSend);
      port.postMessage(dataToSend); 
    });
    */
  });

  //View Triggers
  document.getElementById("ViewTriggersBtn").addEventListener("click", ToggleTriggerContainer);
}

function ToggleTriggerContainer() {
  if(window.location.search == "") {
    let urlString = chrome.runtime.getURL('popup.html') + '?host=' + encodeURIComponent(instanceUrl);
    chrome.tabs.create({url: urlString});
  }
  // console.log('inside toggle trigger table function');
  let display = document.getElementById("triggersContainer");
  if(display.style.display !== "none") {
    display.style.display = "none";
  } else {
    display.style.display = "block";
  }
  document.getElementById("packagesContainer").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  var searchInput = document.getElementById("myInput");
  var searchTriggerInput = document.getElementById("searchTrigger");
  var triggerFilterObject = document.getElementById("Object");

  if (searchInput) {
    searchInput.addEventListener("keyup", myFunction);
  }

  if(searchTriggerInput) {
    searchTriggerInput.addEventListener("keyup", searchTriggers);
  }

  if(triggerFilterObject) {
    triggerFilterObject.addEventListener("input", filterTriggers);
  }

  function myFunction() {
    // Declare variables
    console.log("in search function");
    var input, filter, table, tr, td, td1, i, txtValue1, txtValue2;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    table = document.getElementById("message1");
    tr = table.getElementsByTagName("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      console.log("Started");
      td = tr[i].getElementsByTagName("td")[0];
      td1 = tr[i].getElementsByTagName("td")[1];
      if (td || td1) {
        txtValue1 = td.textContent || td.innerText;
        txtValue2 = td1.textContent || td1.innerText;
        if (
          txtValue1.toUpperCase().indexOf(filter) > -1 ||
          txtValue2.toUpperCase().indexOf(filter) > -1
        ) {
          tr[i].style.display = "";
        } else {
          tr[i].style.display = "none";
        }
      }
    }
  }
});

function searchTriggers() {
  let input, table, tr, td, td1, td2, td3, i, txtValue1, txtValue2, txtValue3;
  input = document.getElementById("searchTrigger");
  searchString = input.value.toUpperCase();
  table = document.getElementById("triggersTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (i = 0; i < tr.length; i++) {
    console.log("Started");
    td = tr[i].getElementsByTagName("td")[0]; // Trigger Name 
    td2 = tr[i].getElementsByTagName("td")[2]; // Trigger API Version
    td3 = tr[i].getElementsByTagName("td")[3]; // Trigger Status
    if (td || td1 || td2 || td3) {
      txtValue1 = td.textContent || td.innerText;
      txtValue2 = td2.textContent || td2.innerText;
      txtValue3 = td3.textContent || td3.innerText;
      if (
        txtValue1.toUpperCase().indexOf(searchString) > -1 ||
        txtValue2.toUpperCase().indexOf(searchString) > -1 ||
        txtValue3.toUpperCase().indexOf(searchString) > -1 
      ) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

function filterTriggers() {
  let input, table, tr, td, txtValue1;
  input = document.getElementById("Object");
  searchString = input.value.toUpperCase();
  table = document.getElementById("triggersTable");
  tr = table.getElementsByTagName("tr");

  // Loop through all table rows, and hide those who don't match the search query
  for (let i = 0; i < tr.length; i++) {
    console.log("Started");
    td = tr[i].getElementsByTagName("td")[1];
    if (td) {
      txtValue1 = td.textContent || td.innerText;
      if (searchString == "" || txtValue1.toUpperCase() === searchString) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }
  }
}

/*
document.addEventListener("DOMContentLoaded", function () {

  document.getElementById("btn").addEventListener("click", function() {
    window.open(
      "packages.html", "_blank");
    });

  openNewTabButton.addEventListener("click", function () {
      // Define your table data
      var table = "<table><tr><td>Row 1, Column 1</td><td>Row 1, Column 2</td></tr></table>";

      // Send the table data to the background.js
      chrome.runtime.sendMessage({ tableData: table });

      // Open a new tab with package.html
      chrome.tabs.create({ url: chrome.runtime.getURL("package.html") });
  });
});

*/