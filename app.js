//Import Modules required to run our code
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const app = express();
const sharp = require('sharp');
const port = process.env.PORT || 8080;
//Setup our middlware/express ap
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
//landing page for our API
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
//Our First POST Method to allow users to use an online image URL
app.post('/analyze-url', async (req, res) => {
    const imageUrl = req.query.imageUrl;

    if (!imageUrl) {
        return res.status(400).json({ error: 'imageUrl parameter is required.' });
    }

    try {
        const response = await axios.post(
            'https://api-project.cognitiveservices.azure.com/vision/v3.2/analyze',
            {
                url: imageUrl
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': 'YOUR API KEY FROM AZURE HERE',
                },
                params: {
                    visualFeatures: 'Description'
                }
            }
        );
        const tags = response.data.description.tags;
        const caption = response.data.description.captions[0].text;
        const formattedResponse = {
            tags,
            caption
        };
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error calling Cognitive Services API:', error.message);

        if (error.response && error.response.data) {
            console.error('Complete Error Response from Cognitive Services API:', error.response.data);
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
});
function isImage(mimeType) {
    return mimeType.startsWith('image/');
}
//Our second POST Method that allows file upload as well as file validation
app.post('/analyze-upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file || !isImage(req.file.mimetype)) {
            return res.status(400).json({ error: 'File type not supported. Please upload a valid image file to continue!' });
        }
        const imageInfo = await sharp(req.file.buffer).metadata();
        if (imageInfo.width < 500 || imageInfo.height < 500) {
            return res.status(400).json({ error: 'Image size not supported. Please upload an image with a minimum size of 500px by 500px.' });
        }
        const response = await axios.post(
            'https://api-project.cognitiveservices.azure.com/vision/v3.2/analyze',
            req.file.buffer,
            {
                headers: {
                    'Content-Type': req.file.mimetype,
                    'Ocp-Apim-Subscription-Key': 'YOUR API KEY FROM AZURE HERE',
                },
                params: {
                    visualFeatures: 'Description'
                }
            }
        );
        const tags = response.data.description.tags;
        const caption = response.data.description.captions[0].text;
        const formattedResponse = {
            tags,
            caption
        };
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error calling Cognitive Services API:', error.message);

        if (error.response && error.response.data) {
            console.error('Complete Error Response from Cognitive Services API:', error.response.data);
        }

        res.status(500).json({ error: 'Internal Server Error' });
    }
});
//Run the app on the  set  port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});