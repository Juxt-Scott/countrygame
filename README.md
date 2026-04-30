# Africa Outline Quiz

A fast local study game for learning all 54 African countries by outline.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

## What is included

- Vite + React app with no backend
- Local GeoJSON country outlines in `src/data/africaCountries.json`
- Multiple-choice quiz with 4 answers per question
- Randomized question order and randomized answers
- No repeated countries until the deck is complete
- Score, answered count, and accuracy
- Restart button
- Keyboard controls: `1`-`4` to answer, `Enter` for next
- Study Mode toggle
- Final results screen with missed countries
- Practice Missed Countries round

## File structure

```text
src/
  App.jsx                     Quiz UI and game state
  App.css                     App layout and visual styles
  geo.js                      Converts GeoJSON geometry into fitted SVG paths
  quiz.js                     Shuffle, answer option, and accuracy helpers
  data/africaCountries.json   Local outlines for the 54 countries
```

## Data note

The country geometries are stored locally so the app works offline after install. The app uses the country names from the study list while matching outlines by ISO country code.
