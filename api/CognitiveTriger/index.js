const line = require('@line/bot-sdk');
const fs = require('fs');
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
            const event = req.body.events[0]
            // 送信された画像を取得する処理
            const downloadPath = 'Image/qr.png';
            let savedPath = await downloadContent(event.message.id, downloadPath);
            // await sample(event.message.id, downloadPath)
            // 取得した画像をCognitiveに投げて、検知結果を貰う処理

            // 検知結果をリプライする処理

            var message = {
                type: 'text',
                text: `${savedPath}として保存しました。`
            }
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

function downloadContent(messageId, downloadPath) {
    return client.getMessageContent(messageId)
      .then((stream) => new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(downloadPath);
        stream.pipe(writable);
        stream.on('end', () => {
            const url = fs.readFileSync(downloadPath, { encoding: "base64" });
            resolve(url)
        });
        stream.on('error', reject);
    }));
}

function sample(messageId, downloadPath) {
    client.getMessageContent(messageId)
    .then((stream) => {
        const dest = fs.createWriteStream(downloadPath);
        stream.on('data', (chunk) => {
          dest.write(chunk)
        });
        stream.on('error', (err) => {
        });
        stream.on('end', () => {
            const url = fs.readFileSync(downloadPath, { encoding: "base64" });
            return url
        });
      });
}
