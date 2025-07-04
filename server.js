const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

const cities = JSON.parse(fs.readFileSync('./cities.json','utf-8'));
const countries = JSON.parse(fs.readFileSync('./countries.json','utf-8'));

const app = express();
app.use(cors());                     //allows users from any server/ ip to access our server
app.use(express.json());


const parts = ["KhOoLKTVC4r","Q4kj1c0U5","OYWQrGj06o","USZWzEfmwi"];   // to prevent bot from scraping API key
const antibot = parts.join("");

function getSentimentValue(text) {
  const result = sentiment.analyze(text);
  const score = result.score;

  if (score > 2) return 1;
  if (score < -2) return -1;
  return 0;
}

function findLocation(article, cities, countries) {

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
    console.log(text);
    
    const senti = getSentimentValue(text);

    for (let i = 0; i < cities.length; i++) {
        const cityName = cities[i].city;
        if (cityName.length < 5) continue;
        if (text.includes(cityName)) {
            return {
                match: cities[i].city,
                type: 'city',
                lat: cities[i].latitude,
                lon: cities[i].longitude,
                senti: senti
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
            senti: senti
            };
        }
    }


    return {
        match: null,
        type: 'none',
        lat: 0,
        lon: -160,
        senti: senti
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

        const resarray = [];
        for(let i=0;i<rawresarray.length;i++){
            const location_data = findLocation(rawresarray[i],cities,countries);
            const offset = (Math.random() - 0.5) * 0.1;
            resarray.push({
                title : rawresarray[i].title,
                description : rawresarray[i].description,
                keywords : rawresarray[i].keywords,
                url: rawresarray[i].url,
                image_url : rawresarray[i].image_url,
                language : rawresarray[i].language,
                source : rawresarray[i].source,
                categories : rawresarray[i].categories,
                location: location_data.match,
                location_type: location_data.type,
                lat: location_data.lat + offset,
                lon : location_data.lon + offset,
                senti : location_data.senti
            })
        }
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
