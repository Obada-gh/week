'use strict';
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const pg = require ('pg');
const superagent = require('superagent');
const server = express();
server.use(cors());
const PORT = process.env.PORT || 4000;
const client = new pg.Client(process.env.DATABASE);
client.connect().then(()=>{
  server.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
  });

});




server.get('/location',locationHand);
server.get('/yelp',yelpHand);

function locationHand(req,res){
  let cityName = req.query.city;
  let sql = 'SELECT * FROM locations WHERE search_query=$1';
  let val = [cityName];
  client.query(sql,val).then(info => {
    // console.log(info);
    if (info.rows.length !==0){
      res.send(info.rows[0]);
    }else{

      let key = process.env.LOCATION_KEY;
      let url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
      superagent.get(url).then(data=>{
        let locationData = new LocatonCons(cityName,data);
        // console.log(locationData);
        addloc(locationData);
        res.send(locationData);
      });

    }
  });


}

function yelpHand(req,res){
  let cityName =req.query.city;
  let key = process.env.YELP_KEY;
  let numPages = 5;
  let firstPage = ((page - 1))
  let url = `https://api.yelp.com/v3/businesses/search?location=${cityName}`;
  superagent.get(url).set(`Authorization`,`Bearer ${key}`)
    .then(data=>{
      let all=data.body.businesses;
      let yelpData = new YelpCons(all);
      console.log(yelpData);
    });
}

function LocatonCons(cityName,data){
  this.search_query = cityName;
  this.formatted_query = data.body[0].display_name;
  this.latitude = data.body[0].lat;
  this.longitude=data.body[0].lon;
}

function YelpCons(data){
  this.name = data[0].name;
  this.price = data[0].price;
  this.rating = data[0].rating;
  this.url=data[0].url;
  this.image_url=data[0].image_url;
}

function addloc(loc){
  let search_query = loc.search_query;
  let formatted_query= loc.formatted_query;
  let lat = loc.latitude;
  let lon = loc.longitude;
  let sql = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *`;
  let values = [search_query,formatted_query,lat,lon];
  client.query(sql,values);
}





