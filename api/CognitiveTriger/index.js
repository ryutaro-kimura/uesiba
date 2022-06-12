const line = require('@line/bot-sdk');
const fs = require('fs');
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");
const msRest = require("@azure/ms-rest-js");
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
            // 取得した画像をCognitiveに投げて、検知結果を貰う処理
            const phrase = await getPredictionsPhrase(downloadPath)
            // 検知結果をリプライする処理

            var message = {
                type: 'text',
                text: phrase
            }
            if (event.replyToken) {
                client.replyMessage(event.replyToken, message);
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

async function getPredictionsPhrase(downloadPath) {
    const predictor_credentials = new msRest.ApiKeyCredentials({ inHeader: { "Prediction-key": env.PREDICTION_KEY } });
    const predictionEndpoint = env.PREDICTION_ENDPOINT
    const predictor = new PredictionApi.PredictionAPIClient(predictor_credentials, predictionEndpoint);

    const testFile = fs.readFileSync(downloadPath);
    let resultText = '';
    try {
        const results = await predictor.classifyImage(env.ITERATION_ID, 'Iteration1', testFile);

        // Show results
        console.log("Results:");
        results.predictions.forEach(predictedResult => {
            console.log(`\t ${predictedResult.tagName}: ${(predictedResult.probability * 100.0).toFixed(2)}%`);
            resultText += `\n ${predictedResult.tagName}: ${(predictedResult.probability * 100.0).toFixed(2)}%`
        });
        console.log(resultText);
        resultText = "わしが思うに..." + resultText + "\nじゃな。"
        return resultText;
    } catch (err) {
        console.error('hogehoge',err.message)
        resultText = "なんじゃろ...最近目が悪くてのぉ...別の画像で試してくれぃ"
        return resultText;
    }
}
