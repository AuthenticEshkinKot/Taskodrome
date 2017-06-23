var HTTP_REQUEST_TIMEOUT = 4000;

function update_issue(bug_id, handler_id, version, status) {
  requestViewPage(bug_id, handler_id, version, status);
};

function requestViewPage(bug_id, handler_id, version, status) {
  var request = new XMLHttpRequest();
  var address = getPathToMantisFile(window, "view.php");
  address = address + "?id=" + bug_id;
  request.open("GET", address, true);
  request.timeout = HTTP_REQUEST_TIMEOUT;

  function onReadyStateChange() {
    if (request.readyState == 4 && request.status == 200) {
      console.log("requestViewPage OK");
      requesBugUpdatePage(request, bug_id, handler_id, version, status);
    } else if (request.readyState == 0 || request.status == 404) {
      request.onreadystatechange = null;
      request.abort();

      console.error("requestViewPage ERROR: readyState=" + request.readyState
                + " status=" + request.status);
    } else {
      console.log("requestViewPage UNKNOWN: readyState=" + request.readyState
                + " status=" + request.status);
    }
  }

  request.onreadystatechange = onReadyStateChange;
  request.send(null);
};

function requesBugUpdatePage(requestPrev, bug_id, handler_id, version, status) {
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
      requestBugUpdate(request, bug_id, handler_id, version, status);
    } else if (request.readyState == 0 || request.status == 404) {
      request.onreadystatechange = null;
      request.abort();

      console.error("requesBugUpdatePage ERROR: readyState=" + request.readyState
                + " status=" + request.status);
    } else {
      console.log("requesBugUpdatePage UNKNOWN: readyState=" + request.readyState
                + " status=" + request.status);
    }
  }

  request.onreadystatechange = onReadyStateChange;
  var parameters = "bug_update_page_token=" + security_token
                   + "&bug_id=" + bug_id;
  request.send(parameters);
};

function requestBugUpdate(requestPrev, bug_id, handler_id, version, status) {
  var page_text = requestPrev.responseText;
  var security_token = getValueByName(page_text, "bug_update_token");
//   var last_updated = getValueByName(page_text, "last_updated");

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
  }

  request.onreadystatechange = onReadyStateChange;
  var parameters = "bug_update_token=" + security_token
                   + "&bug_id=" + bug_id
                   + "&handler_id=" + handler_id
                   + "&target_version=" + version;
//                    + "&last_updated=" + last_updated;
  if (status) {
    parameters += "&status=" + status;
  }
  request.send(parameters);
};

function getValueByName(page_text, name) {
  var prefix = 'name="' + name + '" value="';
  var src_string = page_text.match(new RegExp('.*' + prefix + '.*'))[0];
  var start_index = src_string.indexOf(prefix) + prefix.length;
  var res = src_string.substr(start_index, src_string.indexOf("\"", start_index + 1) - start_index);
  return res;
};
