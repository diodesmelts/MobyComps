/**
 * Simple production server for Render deployment
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Log environment info
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync('.'));

// Simple standalone HTML that will definitely show up
const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moby Comps</title>
  <style>
    body { 
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      text-align: center;
    }
    .container {
      background-color: white;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      max-width: 800px;
    }
    h1 {
      color: #002147;
      margin-top: 0;
    }
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      color: #002147;
      margin-bottom: 20px;
    }
    .button {
      background-color: #002147;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 20px;
      text-decoration: none;
      display: inline-block;
    }
    .button:hover {
      background-color: #003366;
    }
    .competition-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      background-color: white;
      text-align: left;
    }
    .competition-title {
      font-size: 1.2rem;
      margin-top: 0;
      color: #002147;
    }
    .price {
      color: #002147;
      font-weight: bold;
      font-size: 1.1rem;
    }
    .progress-bar {
      height: 10px;
      background-color: #e0e0e0;
      border-radius: 5px;
      margin: 10px 0;
    }
    .progress-indicator {
      height: 100%;
      background-color: #C3DC6F;
      border-radius: 5px;
      width: 75%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Moby Comps</div>
    <h1>Online Prize Competitions</h1>
    <p>Welcome to Moby Comps, the premier destination for online prize competitions.</p>
    
    <div class="competition-card">
      <h3 class="competition-title">Win a Tesla Model 3</h3>
      <p>Get a chance to win this amazing electric vehicle!</p>
      <div class="price">£12 per ticket</div>
      <div class="progress-bar">
        <div class="progress-indicator"></div>
      </div>
      <p>75% of tickets sold</p>
      <a href="#" class="button">Enter Now</a>
    </div>
    
    <div class="competition-card">
      <h3 class="competition-title">LEGO® Harry Potter™ Collection</h3>
      <p>Win the complete collection of Harry Potter LEGO sets!</p>
      <div class="price">£5 per ticket</div>
      <div class="progress-bar">
        <div class="progress-indicator" style="width: 30%"></div>
      </div>
      <p>30% of tickets sold</p>
      <a href="#" class="button">Enter Now</a>
    </div>
    
    <p>This is a temporary static version of the Moby Comps website.</p>
    <p>Our full React application will be available soon!</p>
  </div>
</body>
</html>`;

// Serve the simple static HTML for all routes
app.get('*', (req, res) => {
  res.send(indexHtml);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});