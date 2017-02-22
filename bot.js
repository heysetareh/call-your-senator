var fs = require('fs');
var senatorsFileData = fs.readFileSync("senators.json");
var senatorsData = JSON.parse(senatorsFileData);
var senatorsData = JSON.parse(fs.readFileSync("senators.json"));
var senators = senatorsData["senators"];

// convert senators into a thing that looks like
// { "state_name": {...}, "state_name": {...}, etc} containing the senator data
var states = {};
for (i = 0; i<senators.length; i++) {
  var sen_data=senators[i];
  states[sen_data['state'].toLowerCase()] = sen_data;
}

var twitterAPI = require('node-twitter-api');

var consumerKey = process.argv[2];
var consumerSecret = process.argv[3];
var accessToken = process.argv[4];
var tokenSecret = process.argv[5];
var myScreenName = process.argv[6];

var twitter = new twitterAPI({
    consumerKey: consumerKey,
    consumerSecret: consumerSecret});

twitter.getStream("user", {}, accessToken, tokenSecret, onData);

function onData(error, streamEvent) {

    // a few different cases.
    // case 1: if the object is empty, simply return
    if (Object.keys(streamEvent).length === 0) {
        return;
    }

   

    // otherwise, this was probably an incoming tweet. we'll check to see if
    // it starts with the handle of the bot and then send a response.
    else if (streamEvent.hasOwnProperty('text')) {
        if (streamEvent['text'].startsWith("@"+myScreenName+" ")) {
          var tweet = streamEvent['text'];

          var the_state = null;
          for (var state_name in states) {
            // look for `state_name` inside the tweet text (streamEvent['text'])
            if (tweet.toLowerCase().includes(state_name)) {
              the_state = state_name;
            }
          }

          var reply = "";
          if (the_state != null) {
            // we got a state, here is the senator data from senators.json
            var senator_data = states[the_state];
            reply = senator_data['senator'] + "\n" + senator_data['address'] + "\n" + senator_data['number'] + "\n" + senator_data['city'];
          } else {
            // we didn't get a state, tweet back something else
            reply = "hey, tweet with a state name";
          }


            var tweetId = streamEvent['id_str'];
            var tweeterHandle = streamEvent['user']['screen_name'];
            twitter.statuses(
                "update",
               {"status": "@" + tweeterHandle + " " + reply,
                "in_reply_to_status_id": tweetId},
               accessToken,
               tokenSecret,
               function (err, data, resp) { console.log(err); }
            );
        }
    }

    // if none of the previous checks have succeeded, just log the event
    else {
        console.log(streamEvent);
    }
}
