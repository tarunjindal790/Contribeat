const express = require('express');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const path = require('path');


const PORT = process.env.PORT || 3000;
var app = express();


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/githubData/:username',async function (req,res) {
    const r = await loadGithubData(req.params.username);
    res.json(r);
})

app.listen(PORT, function () {
  console.log('App listening on port !',PORT);
});

async function loadGithubData(username){
    const fromDate = '2020-05-17';
    const toDate = '2021-05-22';
    const res = await fetch(`https://www.github.com/${username}`);
    const $ = cheerio.load(await res.text());
    const $days = $("svg.js-calendar-graph-svg rect.ContributionCalendar-day");
    const imgLink = $(".avatar-user.width-full").attr('src');
    const myCells = [];
    $days.each((i,e)=>{
      myCells.push($(e).attr('data-level'));
    });
    return {myCells, imgLink};
}
