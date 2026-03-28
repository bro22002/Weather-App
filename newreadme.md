# Weather Data Processor

A terminal-based Node.js application built with TypeScript that fetches live weather from [Open-Meteo](https://open-meteo.com/en/docs), organizes the information using object-oriented principles, and performs data analysis using recursive algorithms.

## Features

- **Object-Oriented Design:** Data is encapsulated within a robust `WeatherStation` class.
- **Live weather data:** Uses `async`/`await` and `fetch` to load current conditions from the Open-Meteo forecast API (requires an internet connection when you run the app).
- **Recursive Algorithms:** Implements recursive traversal techniques to calculate average wind speeds and precipitation totals from an array of station objects.
- **Terminal Output:** Formatted console output detailing individual station readings and aggregated analytical insights, including situational alerts.
- **Unit Testing:** Comprehensive test coverage utilizing the Jest framework to ensure the accuracy of the recursive logic and data models.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository and navigate into the project directory:

   ```bash
   git clone https://github.com/bro22002/Weather-App.git
   cd Weather-App
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Execution

**Network required:** `npm start` calls the public Open-Meteo API. Your machine must be online; without connectivity the app cannot load station data.

To run the main application:

```bash
npm start
```

**Weather data source:** [Open-Meteo Weather Forecast API](https://open-meteo.com/en/docs). The open endpoint is free for non-commercial use and does **not** require an API key. For commercial use, see [Open-Meteo pricing](https://open-meteo.com/en/pricing).

### Testing

To run the Jest test suites and verify the recursive algorithms and class logic:

```bash
npm test
```

## Technologies Used

- TypeScript
- Node.js
- Jest
- ts-node
- [Open-Meteo](https://open-meteo.com/en/docs) (live weather API)
