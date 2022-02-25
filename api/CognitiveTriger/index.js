const line = require('@line/bot-sdk');
const querystring = require('querystring');
require('dotenv').config()

const env = process.env
const config = {
    channelAccessToken: env.CHANNEL_ACCESS_TOKEN,
    channelSecret: env.CHANNEL_SECRET,
};

const client = new line.Client(config);

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.message || (req.body && req.body.events)) {
        if (req.body && req.body.events[0]) {
            // 送られてきた画像データを取得
            var messageId = req.body.events[0].message.id;
            var imgData = '';
            context.log.warn('ID---', messageId);
            client.getMessageContent(messageId)
                .then((stream) => {
                    stream.on('data', (chunk) => {
                        context.log.warn('ed--', messageId);
                        imgData += chunk;
                        context.log.warn('BufferオブジェクトのchunkをimgDataに格納：', imgData);
                    });
                    stream.on('error', (err) => {
                        // error handling
                        context.log.warn('error------',err);
                    });
                });
            var imgJson = querystring.parse(imgData);
            context.log.warn('Bufferオブジェクトのイメージデータ',imgData);
            context.log.warn('stringオブジェクトにしたデータ',imgJson);
            var message = {
                type: "image",
                contentType: req.body.events[0].message.contentProvider.type,
                id: req.body.events[0].message.id,
                originalContentUrl: req.body.events[0].message.contentProvider.originalContentUrl,
                previewImageUrl: req.body.events[0].message.contentProvider.previewImageUrl
            }
            context.log.warn(JSON.stringify(message));
            if (req.body.events[0].replyToken) {
                client.replyMessage(req.body.events[0].replyToken, message);
            }
        }
        else {
            context.res = {
                status: 200,
                body: req.query.message
            };
        }
    }
    else {
        context.res = {
            status: 200,
            body: "Please check the query string in the request body"
        };
    };
};