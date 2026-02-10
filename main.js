const API_URL = "https://lipanj850.onrender.com"; 

fetch(`${API_URL}/users`)
  .then(res => res.json())
  .then(data => console.log(data));