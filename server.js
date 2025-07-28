const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const { GoogleGenAI }= require ("@google/genai");

const Sentiment = require('sentiment');
const sentiment = new Sentiment();


const cities = JSON.parse(fs.readFileSync('./cities.json','utf-8'));
const countries = JSON.parse(fs.readFileSync('./countries.json','utf-8'));

const app = express();
app.use(cors());                     //allows users from any server/ ip to access our server
app.use(express.json());


const aiparts = ["AIzaSyA","6wS2QJX","9c5yImWZn","UHTzX0V","3oq3oUt0Q"]
const aaky = aiparts.join("");
const ai = new GoogleGenAI({ apiKey: aaky });

const parts = ["KhOoLKTVC4r","Q4kj1c0U5","OYWQrGj06o","USZWzEfmwi"];   // to prevent bot from scraping API key
const antibot = parts.join("");


async function aisummarize(txt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "Summarize and give some opinion/inference from the following news under 100 words: " + txt,
  });
  return response.text;
}

function getSentimentValue(text) {
  const result = sentiment.analyze(text);
  const score = result.score;

  if (score > 2) return 1;
  if (score < -2) return -1;
  return 0;
}

async function findLocation(article, cities, countries) {

    if(article.title===''){
        article.title = 'undefined';
    }
    if(article.description===''){
        article.description = 'undefined';
    }
    if(article.keywords===''){
        article.keywords = 'undefined';
    }
    if(article.snippet===''){
        article.snippet= 'undefined';
    }
    


    const text = `${article.title} ${article.description} ${article.keywords} ${article.snippet}`;
    const airaw = `${article.title}  ${article.description}`;

    
    const senti = getSentimentValue(text);
    const airesponse = await aisummarize(airaw);


    for (let i = 0; i < cities.length; i++) {
        const cityName = cities[i].city;
        if (cityName.length < 5) continue;
        if (text.includes(cityName)) {
            return {
                match: cities[i].city,
                type: 'city',
                lat: cities[i].latitude,
                lon: cities[i].longitude,
                senti: senti,
                summary: airesponse
            };
        }
    } 


    for (let i = 0; i < countries.length; i++) {
        const countryName = countries[i].name;
        if (text.includes(countryName)) {
            return {
            match: countries[i].name,
            type: 'country',
            lat: countries[i].latitude,
            lon: countries[i].longitude,
            senti: senti,
            summary: airesponse
            };
        }
    }


    return {
        match: null,
        type: 'none',
        lat: 0,
        lon: -160,
        senti: senti,
        summary: airesponse
    };
}


app.post('/news', async (req,res)=>{

    console.log("HLOOOO")

    const query = req.body.query;
    if(!query){
        res.status(400);
        return res.json({msg: 'this field can not be empty'});
    }

    try{
        const response = await axios.get(`https://api.thenewsapi.com/v1/news/all?api_token=${antibot}&search=${encodeURIComponent(query)}&language=en&limit=3`);

        const rawresarray = response.data.data;

        const resarray = await Promise.all(
  rawresarray.map(async (article) => {
    const location_data = await findLocation(article, cities, countries);
    const offset = (Math.random() - 0.5) * 0.1;

        return {
            title: article.title,
            description: article.description,
            keywords: article.keywords,
            url: article.url,
            image_url: article.image_url,
            language: article.language,
            source: article.source,
            categories: article.categories,
            location: location_data.match,
            location_type: location_data.type,
            lat: location_data.lat + offset,
            lon: location_data.lon + offset,
            senti: location_data.senti,
            summary: location_data.summary
    };
  })
);

        console.log('resarray is: ', resarray);
        res.json(resarray);
        
        
    }
catch (err) {
  console.error("Error fetching articles:");
  console.error("Message:", err.message);

  if (err.response) {
    console.error("Axios error response:");
    console.error("Status Code:", err.response.status);
    console.error("Response Body:", err.response.data);
  } else if (err.request) {
    console.error("No response received from API.");
    console.error("Request object:", err.request);
  } else {
    console.error("Other error:", err);
  }

  res.status(500).json({
    msg: `Sorry, we couldn't fetch articles due to an internal error.`
  });
}


});
app.listen(3000, ()=>console.log('server started on port 3000'))
