const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");


const API_KEY = "2be2ed81723064314d8b56d597dbef79";

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${Math.round(weatherItem.main.temp - 273.15)}°C</h6>
                    <h6>Wind: ${Math.round(weatherItem.wind.speed)} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${Math.round(weatherItem.main.temp - 273.15)}°C</h6>
                    <h6>Wind: ${Math.round(weatherItem.wind.speed)} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
};



const fetchCityImage = (cityName) => {
    const API_KEY_PEXELS = 'Hbk4IalcR6hJjEnmlImU9yxeypcPoACR3hgOD0KaSh8mfjMzKah03Afb';
    const endpoint = `https://api.pexels.com/v1/search?query=${cityName}`;

    return fetch(endpoint, {
        headers: {
            'Authorization': API_KEY_PEXELS
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.photos && data.photos.length > 0) {
                return data.photos[0].src.large2x;
            }
            return null;
        })
        .catch(error => {
            console.error("Error fetching city image:", error);
            return null;
        });
};

const getWeatherDetails = async (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    try {
        const response = await fetch(WEATHER_API_URL);
        const data = await response.json();

        const forecastDays = [];
        const forecastCards = [];

       
        let cardCount = 0;

        data.list.forEach((weatherItem) => {
            const forecastDate = new Date(weatherItem.dt_txt).getDate();
            if (!forecastDays.includes(forecastDate) && cardCount < 5) {
                forecastDays.push(forecastDate);
                const html = createWeatherCard(cityName, weatherItem, cardCount);
                forecastCards.push(html);
                cardCount++;
            }
        });

        const imageUrl = await fetchCityImage(cityName);
        if (imageUrl) {
            document.body.style.backgroundImage = `url(${imageUrl})`;
        } else {
            console.log("No image found for the city.");
        }

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        forecastCards.forEach((html, index) => {
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });

        
        document.getElementById('city-suggestions').innerHTML = "";
    } catch (error) {
        alert("An error occurred while fetching the weather forecast!");
        console.error(error);
    }
};

const spinner = document.getElementById('spinner');

const getCityCoordinates = () => {
    spinner.classList.remove('hidden');
    const cityName = cityInput.value.trim();
    document.getElementById('city-suggestions').innerHTML = "";
    if (cityName === "") {
        setTimeout(() => {
            spinner.classList.add('hidden');
        }, 1000);
        return;
    }

    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    
    return fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                spinner.classList.add('hidden');
                return Promise.reject(`No coordinates found for ${cityName}`);
            }

            const { lat, lon, name } = data[0];

            if (!favoriteCities.some(city => city.name === name)) {
                favoriteCities.push({ name, lat, lon });
                saveFavoritesToLocalStorage();
            }

           
            return getWeatherDetails(name, lat, lon);
        })
        .then(() => {
            spinner.classList.add('hidden');
        })
        .catch(error => {
            spinner.classList.add('hidden');
            alert(`An error occurred: ${error}`);
            throw error; 
        });
};


const getUserCoordinates = () => {
    spinner.classList.remove('hidden');
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            spinner.classList.add('hidden');
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL)
                .then(response => response.json())
                .then(data => {
                    spinner.setAttribute('hidden', '');
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    spinner.classList.add('hidden');
                    alert("An error occurred while fetching the city name!");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
};

const autocompleteCity = (inputElement, suggestionsElement) => {
    inputElement.addEventListener('input', function () {
        const cityName = this.value.trim();
        if (cityName === "") {
            suggestionsElement.innerHTML = "";
            return;
        }
        const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=5&appid=${API_KEY}`;

        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                const suggestions = data.map(city => `<li class="suggestion" data-latitude="${city.lat}" data-longitude="${city.lon}">${city.name}</li>`).join('');
                suggestionsElement.innerHTML = suggestions;
            })
            .catch(error => {
                console.error("Error fetching city suggestions:", error);
            });
    });

    suggestionsElement.addEventListener('click', function (e) {
        if (e.target.classList.contains('suggestion')) {
            const cityName = e.target.textContent;
            const latitude = e.target.getAttribute('data-latitude');
            const longitude = e.target.getAttribute('data-longitude');

            getWeatherDetails(cityName, latitude, longitude);

            suggestionsElement.innerHTML = '';
            inputElement.value = '';
        }
    });
};

const favoriteButton = document.getElementById('favoriteButton');
const favoritesContainer = document.getElementById('favoritesContainer');
const favoriteCities = [];


const saveFavoritesToLocalStorage = () => {
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities));
}


const displayFavoriteCities = () => {
    favoritesContainer.innerHTML = "";
    favoriteCities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.textContent = city.name;
        cityElement.classList.add('favorite-city');
        cityElement.addEventListener('click', () => {
            getWeatherDetails(city.name, city.lat, city.lon);
        });
        favoritesContainer.appendChild(cityElement);
    });
}


favoriteButton.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    if (cityName !== "") {
        addToFavorites(cityName);
    }
});


const addToFavorites = (cityName) => {
    const existingCity = favoriteCities.find(city => city.name === cityName);
    if (existingCity) {
        alert(`"${cityName}" is already in the favorites.`);
        return;
    }

    getCityCoordinatesForFavorites(cityName)
        .then((coordinates) => {
            favoriteCities.push(coordinates);
            saveFavoritesToLocalStorage();
            displayFavoriteCities();
        })
        .catch(error => {
            alert(`An error occurred while adding "${cityName}" to favorites: ${error}`);
        });
};

const getCityCoordinatesForFavorites = (cityName) => {
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    return fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            if (!data.length) {
                return Promise.reject(`No coordinates found for ${cityName}`);
            }
            const { lat, lon, name } = data[0];

            if (favoriteCities.length >= 5) {
                favoriteCities.shift();  
            }

            return { name, lat, lon };
        })
        .catch(() => {
            return Promise.reject("An error occurred while fetching the coordinates!");
        });
};
window.onload = () => {
    const savedFavorites = localStorage.getItem('favoriteCities');
    if (savedFavorites) {
        favoriteCities.push(...JSON.parse(savedFavorites));
        displayFavoriteCities();
    }
}

autocompleteCity(cityInput, document.getElementById('city-suggestions'));

locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());