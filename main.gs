var AIMAKER_MODEL_ID = 6088;
var AIMAKER_API_KEY = "c28f3694803e7631c5feb0831f29be777d9744ac4b52f0ea86f53a477544bb79c2df9091f01beaeed219622c49719473";
var LINE_ACCESS_TOKEN = "";
var GOOGLE_DOCS_ID = "";
var doc = DocumentApp.openById(GOOGLE_DOCS_ID);

function doPost(e){
  //Logger.log("Post request.");
  try {
    var json = JSON.parse(e.postData.contents);
    
    if(json.events[0].message.type === null) return;
    
    var token= json.events[0].replyToken;
      if(json.events[0].message.type != "image"){
  sendLineMessage("画像を送信してください",token);
  }
    var url = 'https://api-data.line.me/v2/bot/message/'+ json.events[0].message.id +'/content/';
    var image = getImage(url);
    var base64 = Utilities.base64Encode(image.getContent());
    var labels = getResult(base64);
    if (labels == '') {
      sendLineMessage("識別できませんでした",token);
    }
    sendLineContents(labels, token);
  } catch (e) {
    //Logger.log("ERROR: %s", e)
    sendLineMessage("処理に失敗しました", token);
    //doc.getBody().appendParagraph(Logger.getLog());
  }
  //doc.getBody().appendParagraph(Logger.getLog());
}

function getImage(url){
  return UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'GET'
  });
}

function getResult(base64){
  var result = '';
  var url = 'https://aimaker.io/image/classification/api';
  var payload = {
    "id": AIMAKER_MODEL_ID,
    "apikey": AIMAKER_API_KEY,
    "base64": base64
  };
  var response = UrlFetchApp.fetch(url, {   
    method: 'POST', 
    payload: payload, 
    muteHttpExceptions: true
  });
  response = response.getContentText();
  //Logger.log(response); 
  var json = JSON.parse(response);
  var labels = sortLabel(json.labels);
  return labels;
}

function sortLabel(labels){
  labels.sort(function(a,b){
    if (a.score > b.score) return -1;
    if (a.score < b.score) return 1;
    return 0;
  });
  return labels;
}

function sendLineContents(labels, token){
  var url = "https://api.line.me/v2/bot/message/reply";
  return UrlFetchApp.fetch(url, {
    'headers': { 
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'POST',
    'payload': JSON.stringify({ 
      'replyToken': token,
      'messages': [
        { 
          "type": "flex",
          "altText":  labels[0].label+"　" + Math.round(labels[0].score * 10000) / 100 + "％",
          "contents" : {
  "type": "bubble",
  "size": "kilo",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "baseline",
        "contents": [
          {
            "type": "text",
            "text": labels[0].label+"　" + Math.round(labels[0].score * 10000) / 100 + "％",
            "weight": "bold",
            "size": "35px",
            "align": "center"
          }
        ]
      }
    ]
  }
}
        } 
      ], 
    })
  });
}

function sendLineMessage(message,token){
  var url = "https://api.line.me/v2/bot/message/reply";
  return UrlFetchApp.fetch(url, {
    'headers': { 
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'POST',
    'payload': JSON.stringify({ 
      'replyToken': token,
      'messages': [
        { 
          "type": "text",
          "text": message
        } 
      ], 
    })
  });
}