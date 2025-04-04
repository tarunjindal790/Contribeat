const express = require('express');
const cors = require('cors'); // Import cors
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();



const PORT = process.env.PORT || 3000;
var app = express();

app.use(cors());

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('index');
});

// 🔹 New route to search for users
app.get('/searchGithubUsers/:query', async (req, res) => {
  let query = req.params.query.trim(); // Trim spaces
  console.log("Received search query:", query);

  if (!query) {
      return res.status(400).json({ error: "Search query cannot be empty." });
  }

  try {
      const users = await searchGithubUsers(query);
      if (!users || users.length === 0) {
          return res.status(404).json({ error: `No users found for '${query}'.` });
      }
      res.json(users);
  } catch (error) {
      console.error("Error searching GitHub users:", error);
      res.status(500).json({ error: "Internal server error." });
  }
});

app.get('/githubData/:username',async function (req,res) {
  console.log("received username:", req.params.username);
  const userData = await loadGithubData(req.params.username);

  if (!userData) {
      return res.status(404).json({ error: "User not found or data unavailable." });
  }

  res.json(userData);
})

app.listen(PORT, function () {
  console.log('App listening on port !',PORT);
});

// 🔹 Function to search for GitHub users
async function searchGithubUsers(query) {
  const GITHUB_API_URL = `https://api.github.com/search/users?q=${encodeURIComponent(query)}`;
  const GITHUB_TOKEN = process.env.GH_ACCESS_TOKEN;

  const res = await fetch(GITHUB_API_URL, {
      method: "GET",
      headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
      }
  });

  if (!res.ok) {
      console.error(`GitHub Search API error: ${res.status}`);
      return [];
  }

  const data = await res.json();
  return data.items.map(user => ({
      login: user.login,
      avatarUrl: user.avatar_url
  }));
}


async function loadGithubData(username) {
  const GITHUB_API_URL = "https://api.github.com/graphql";
  const GITHUB_TOKEN = process.env.GH_ACCESS_TOKEN;

  const query = `
  {
    user(login: "${username}") {
    avatarUrl
    name
    bio
    location
    followers{
      totalCount
    }
    following{
    totalCount
    }
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
    }
  }`;

  const res = await fetch(GITHUB_API_URL, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log("data:", data);
  if(data && data.errors && data.errors.length){
    console.error("Error fetching data:", data.errors);
    return null;
  }
  const user = data.data.user;
    return {
        avatarUrl: user.avatarUrl,
        name: user.name || username, 
        bio: user.bio || "No bio available",
        location: user.location || "Unknown",
        followers: user.followers.totalCount,
        following: user.following.totalCount,
        contributions: user.contributionsCollection
    };
  // const avatarUrl = data.data.user.avatarUrl;
  // const contributions = data.data.user.contributionsCollection;

  // You can now use the avatarUrl to display the image and contributions as needed.
  // return { contributions,avatarUrl };
  // return data;
}


// async function loadGithubData(username){
//   const res = await fetch(`https://api.github.com/users/${username}/events/public`);
//   const data = await res.json();
//   console.log("data", data);
//   // return { events: data };
//   const $ = cheerio.load(await res.text());
//     const $days = $("svg.js-calendar-graph-svg rect.ContributionCalendar-day");
//     const imgLink = $(".avatar-user.width-full").attr('src');
//     const myCells = [];

//     $days.each((i, e) => {
//         myCells.push($(e).attr('data-level'));
//     });

//     return { myCells, imgLink };
// }

// async function loadGithubData(username){
//     const fromDate = '2020-05-17';
//     const toDate = '2021-05-22';
//     const res = await fetch(`https://github.com/${username}`, {
//       headers: {
//           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
//       }
//   });
//     const $ = cheerio.load(await res.text());
//     const $days = $("svg.js-calendar-graph-svg rect.ContributionCalendar-day");
//     const imgLink = $(".avatar-user.width-full").attr('src');
//     const myCells = [];
//     $days.each((i,e)=>{
//       myCells.push($(e).attr('data-level'));
//     });
//     return {myCells, imgLink};
// }
