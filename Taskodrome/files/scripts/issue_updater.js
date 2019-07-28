function IssueData() {
  this.m_issue_id = 0;
  this.m_owner_id = 0;
  this.m_version = "";
  this.m_status = 0;

  this.Init = function(issue_id, owner_id, version) {
    this.m_issue_id = issue_id;
    this.m_owner_id = owner_id;
    this.m_version = version;
  };

  this.InitWStatus = function(issue_id, owner_id, version, status) {
    this.Init(issue_id, owner_id, version);
    this.m_status = status;
  };
};

function IssueUpdater() {
  var HTTP_REQUEST_TIMEOUT = 4000;

  this.send = function(/** @type {IssueData} */issue_data) {
    requestViewPage(issue_data);
  };

  function requestViewPage(/** @type {IssueData} */issue_data) {
    var request = new XMLHttpRequest();
    var address = getPathToMantisFile(window, "view.php");
    address = address + "?id=" + issue_data.m_issue_id;
    request.open("GET", address, true);
    request.timeout = HTTP_REQUEST_TIMEOUT;

    function onReadyStateChange() {
      if (request.readyState == 4 && request.status == 200) {
        console.log("requestViewPage OK");
        requesBugUpdatePage(request, issue_data);
      } else if (request.readyState == 0 || request.status == 404) {
        request.onreadystatechange = null;
        request.abort();

        console.error("requestViewPage ERROR: readyState=" + request.readyState
                  + " status=" + request.status);
      } else {
        console.log("requestViewPage UNKNOWN: readyState=" + request.readyState
                  + " status=" + request.status);
      }
    };

    request.onreadystatechange = onReadyStateChange;
    request.send(null);
  };

  function requesBugUpdatePage(requestPrev, /** @type {IssueData} */issue_data) {
    var page_text = requestPrev.responseText;
    var security_token = getValueByName(page_text, "bug_update_page_token");

    var request = new XMLHttpRequest();
    var address = getPathToMantisFile(window, "bug_update_page.php");
    request.open("POST", address, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.timeout = HTTP_REQUEST_TIMEOUT;

    function onReadyStateChange() {
      if (request.readyState == 4 && request.status == 200) {
        console.log("requesBugUpdatePage OK");
        requestBugUpdate(request, issue_data);
      } else if (request.readyState == 0 || request.status == 404) {
        request.onreadystatechange = null;
        request.abort();

        console.error("requesBugUpdatePage ERROR: readyState=" + request.readyState
                  + " status=" + request.status);
      } else {
        console.log("requesBugUpdatePage UNKNOWN: readyState=" + request.readyState
                  + " status=" + request.status);
      }
    };

    request.onreadystatechange = onReadyStateChange;
    var parameters = "bug_update_page_token=" + security_token
                     + "&bug_id=" + issue_data.m_issue_id;
    request.send(parameters);
  };

  function requestBugUpdate(requestPrev, /** @type {IssueData} */issue_data) {
    var page_text = requestPrev.responseText;
    var security_token = getValueByName(page_text, "bug_update_token");
    var last_updated = getValueByName(page_text, "last_updated");

    var request = new XMLHttpRequest();
    var address = getPathToMantisFile(window, "bug_update.php");
    request.open("POST", address, true);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.timeout = HTTP_REQUEST_TIMEOUT;

    function onReadyStateChange() {
      if (request.readyState == 4 && request.status == 200) {
        console.log("requestBugUpdate OK");
      } else if (request.readyState == 0 || request.status == 404) {
        request.onreadystatechange = null;
        request.abort();

        console.error("requestBugUpdate ERROR: readyState=" + request.readyState
                  + " status=" + request.status);
      } else {
        console.log("requestBugUpdate UNKNOWN: readyState=" + request.readyState
                  + " status=" + request.status);
      }
    };

    request.onreadystatechange = onReadyStateChange;
    var parameters = "bug_update_token=" + security_token
                     + "&bug_id=" + issue_data.m_issue_id
                     + "&handler_id=" + issue_data.m_owner_id
                     + "&target_version=" + issue_data.m_version
                     + "&last_updated=" + last_updated;
    if (issue_data.m_status) {
      parameters += "&status=" + issue_data.m_status;
    }
    request.send(parameters);
  };

  function getValueByName(page_text, name) {
    var prefix = "name=\"" + name + "\" value=\"";
    var src_string = page_text.match(new RegExp(".*" + prefix + ".*"))[0];
    var start_index = src_string.indexOf(prefix) + prefix.length;
    var res = src_string.substr(start_index, src_string.indexOf("\"", start_index + 1) - start_index);
    return res;
  };
};