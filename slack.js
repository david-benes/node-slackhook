var request = require('request');

function Slack(options) {
  this.domain = null;
  this.token = null;
  this.defaultChannel = '#general';
  if( options && options instanceof Object ){
    this.domain = options.domain;
    this.token = options.token;
    if( options.defaultChannel ) this.defaultChannel = options.defaultChannel;
  }
  this.disabled = false;
}

Slack.prototype.send = function(message,cb) {
  if (this.disabled) {
    console.log(new Date(), 'Slack integration temporarily disabled. Message not sent: ' + message);
    return cb(); // do not send error to prevent cycling
  }

  if( !( message && message instanceof Object && message.text ) ) {
    if( cb && cb instanceof Function ) return cb(new Error('No message'));
    return 'No message';
  }

  var url = 'https://' + this.domain + '.slack.com/services/hooks/incoming-webhook?token=' + this.token;
  var channel = message.channel || this.defaultChannel;
  var options = {
    channel: channel,
    text: message.text,
    username: message.username,
  };

  if( message.icon_emoji ) options.icon_emoji = message.icon_emoji;
  if( message.icon_url ) options.icon_url = message.icon_url;
  if( message.attachments ) options.attachments = message.attachments;

  var requestParams = {
    url: url,
    body: JSON.stringify(options)
  };

  var self = this;
  request.post(requestParams, function(err,res,body) {
    //Too many requests

    if (res.statusCode == 429) {
      console.log(new Date(), 'Disabling Slack integration, too many messages. Integration will be enabled in one minute.');
      self.disabled = true;
      // Wait one minute to enable again
      setTimeout(function () {
        self.disabled = false;
      }, 60 * 1000);
    }

    if(err || body != 'ok') {
      if( cb && cb instanceof Function ) return cb(err || body);
    }

    if (cb && cb instanceof Function) cb(err,body);

  });
};


Slack.prototype.respond = function(query,cb) {
  var obj = {};

  obj.token = query.token;
  obj.team_id = query.team_id;
  obj.channel_id = query.channel_id;
  obj.channel_name = query.channel_name;
  obj.timestamp = new Date(query.timestamp);
  obj.user_id = query.user_id;
  obj.user_name = query.user_name;
  obj.text = query.text;
  return obj;
}

module.exports = Slack;
