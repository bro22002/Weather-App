# Weather Data Processor

A terminal-based Node.js application built with TypeScript that simulates fetching data from remote weather stations, organizes the information using object-oriented principles, and performs data analysis using recursive algorithms.

## Features

- **Object-Oriented Design:** Data is encapsulated within a robust `WeatherStation` class.
- **Asynchronous Simulation:** Uses `async`/`await` and `Promises` to mock live sensor data fetching with realistic network latency.
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

To run the main application and observe the simulated data processing:

```bash
npm start
```

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
