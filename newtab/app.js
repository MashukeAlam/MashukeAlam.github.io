// Time display function
function updateTime() {
    const timeElem = document.getElementById('time');
    const now = new Date();
    timeElem.textContent = now.toLocaleTimeString();
  }
  
  // Weather fetch function
  function updateWeather() {
    const weatherElem = document.getElementById('weather');
    const apiKey = 'YOUR_API_KEY'; // Get your free API key from https://openweathermap.org/
    const city = 'Dhaka';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const temp = data.main.temp;
        const description = data.weather[0].description;
        weatherElem.textContent = `Dhaka: ${temp}°C, ${description}`;
      })
      .catch(() => {
        weatherElem.textContent = 'Failed to load weather.';
      });
  }
  
  // Search functionality
  function search(engine) {
    const query = document.getElementById('searchQuery').value;
    let url = '';
  
    switch(engine) {
      case 'google':
        url = `https://www.google.com/search?q=${query}`;
        break;
      case 'duckduckgo':
        url = `https://duckduckgo.com/?q=${query}`;
        break;
      case 'wikipedia':
        url = `https://en.wikipedia.org/wiki/Special:Search?search=${query}`;
        break;
      case 'startpage':
        url = `https://www.startpage.com/do/dsearch?query=${query}`;
        break;
      case 'youtube':
        url = `https://www.youtube.com/results?search_query=${query}`;
        break;
    }
  
    window.open(url, '_blank');
  }
  
  // Initialize page
  document.addEventListener('DOMContentLoaded', () => {
    updateTime();
    updateWeather();
    setInterval(updateTime, 1000); // Update time every second
  });
  
  // Dark theme toggle based on time
  const now = new Date();
  if (now.getHours() >= 18 || now.getHours() <= 6) {
    document.body.classList.add('dark-theme');
  }
  