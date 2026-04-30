import { useCallback, useEffect, useMemo, useState } from 'react'
import countries from './data/africaCountries.json'
import { VIEWBOX_SIZE, countryToSvgPath } from './geo'
import { getAccuracy, makeOptions, shuffle } from './quiz'
import './App.css'

function makeDeck(source = countries) {
  return shuffle(source)
}

function App() {
  const [deck, setDeck] = useState(() => makeDeck())
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selectedIso, setSelectedIso] = useState(null)
  const [wrongAttempts, setWrongAttempts] = useState([])
  const [missedCountries, setMissedCountries] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [studyMode, setStudyMode] = useState(false)

  const currentCountry = deck[questionIndex]
  const questionNumber = Math.min(questionIndex + 1, deck.length)
  const isAnswered = selectedIso !== null
  const accuracy = getAccuracy(score, answered)
  const progressValue = isComplete
    ? 100
    : Math.round((questionIndex / deck.length) * 100)

  const options = useMemo(() => {
    if (!currentCountry) return []

    return makeOptions(currentCountry, countries)
  }, [currentCountry])

  const outlinePath = useMemo(() => {
    if (!currentCountry) return ''

    return countryToSvgPath(currentCountry.geometry)
  }, [currentCountry])

  const rememberMiss = useCallback((country) => {
    setMissedCountries((current) => {
      if (current.some((missed) => missed.iso === country.iso)) return current

      return [...current, country]
    })
  }, [])

  const completeQuestion = useCallback(
    ({ wasCorrect, country }) => {
      setSelectedIso(country.iso)
      setAnswered((value) => value + 1)

      if (wasCorrect && wrongAttempts.length === 0) {
        setScore((value) => value + 1)
      } else if (!wasCorrect || wrongAttempts.length > 0) {
        rememberMiss(currentCountry)
      }
    },
    [currentCountry, rememberMiss, wrongAttempts.length],
  )

  const chooseAnswer = useCallback(
    (country) => {
      if (!currentCountry || isAnswered) return

      const wasCorrect = country.iso === currentCountry.iso

      if (wasCorrect) {
        completeQuestion({ wasCorrect, country })
        return
      }

      const nextWrongAttempts = [...wrongAttempts, country.iso]
      setWrongAttempts(nextWrongAttempts)

      if (studyMode && nextWrongAttempts.length < 2) {
        rememberMiss(currentCountry)
        return
      }

      completeQuestion({ wasCorrect, country })
    },
    [
      completeQuestion,
      currentCountry,
      isAnswered,
      rememberMiss,
      studyMode,
      wrongAttempts,
    ],
  )

  const nextQuestion = useCallback(() => {
    if (!isAnswered) return

    if (questionIndex + 1 >= deck.length) {
      setIsComplete(true)
      return
    }

    setQuestionIndex((value) => value + 1)
    setSelectedIso(null)
    setWrongAttempts([])
  }, [deck.length, isAnswered, questionIndex])

  const restartGame = useCallback((source = countries) => {
    setDeck(makeDeck(source))
    setQuestionIndex(0)
    setScore(0)
    setAnswered(0)
    setSelectedIso(null)
    setWrongAttempts([])
    setMissedCountries([])
    setIsComplete(false)
  }, [])

  const practiceMissed = useCallback(() => {
    if (missedCountries.length === 0) return

    restartGame(missedCountries)
  }, [missedCountries, restartGame])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key >= '1' && event.key <= '4') {
        event.preventDefault()
        chooseAnswer(options[Number(event.key) - 1])
      }

      if (event.key === 'Enter') {
        event.preventDefault()

        if (isComplete) {
          restartGame()
        } else {
          nextQuestion()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [chooseAnswer, isComplete, nextQuestion, options, restartGame])

  if (isComplete) {
    return (
      <main className="app-shell">
        <section className="results-panel">
          <p className="eyebrow">Quiz complete</p>
          <h1>Africa outline challenge</h1>
          <div className="result-stats" aria-label="Final score">
            <strong>
              {score}/{answered}
            </strong>
            <span>{accuracy}% accuracy</span>
          </div>

          <div className="missed-list">
            <h2>Countries to review</h2>
            {missedCountries.length === 0 ? (
              <p>Perfect round. Every outline landed.</p>
            ) : (
              <ul>
                {missedCountries.map((country) => (
                  <li key={country.iso}>{country.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="action-row">
            <button type="button" className="primary" onClick={() => restartGame()}>
              Restart Game
            </button>
            <button
              type="button"
              className="secondary"
              disabled={missedCountries.length === 0}
              onClick={practiceMissed}
            >
              Practice Missed Countries
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="quiz-panel">
        <header className="top-bar">
          <div>
            <p className="eyebrow">African countries by outline</p>
            <h1>Which country is this?</h1>
          </div>
          <button type="button" className="restart" onClick={() => restartGame()}>
            Restart Game
          </button>
        </header>

        <div className="stats" aria-label="Quiz score">
          <div>
            <span>Score</span>
            <strong>{score}</strong>
          </div>
          <div>
            <span>Answered</span>
            <strong>{answered}</strong>
          </div>
          <div>
            <span>Accuracy</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>Question</span>
            <strong>
              {questionNumber}/{deck.length}
            </strong>
          </div>
        </div>

        <div
          className="progress"
          aria-label={`Progress: ${questionIndex} of ${deck.length} answered`}
        >
          <span style={{ width: `${progressValue}%` }} />
        </div>

        <div className="game-grid">
          <section className="map-stage" aria-label="Country outline">
            <svg
              viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
              role="img"
              aria-label="Country silhouette"
            >
              <path d={outlinePath} fillRule="evenodd" />
            </svg>
          </section>

          <section className="answer-area" aria-label="Answer choices">
            <label className="study-toggle">
              <input
                type="checkbox"
                checked={studyMode}
                onChange={(event) => setStudyMode(event.target.checked)}
              />
              <span>Study Mode</span>
            </label>

            <div className="answers">
              {options.map((country, index) => {
                const isCorrectOption = country.iso === currentCountry.iso
                const isWrongTry = wrongAttempts.includes(country.iso)
                const revealCorrect = isAnswered && isCorrectOption
                const showWrong = selectedIso === country.iso || isWrongTry
                const className = [
                  'answer-button',
                  revealCorrect ? 'correct' : '',
                  showWrong && !isCorrectOption ? 'incorrect' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    type="button"
                    className={className}
                    key={country.iso}
                    disabled={isAnswered || isWrongTry}
                    onClick={() => chooseAnswer(country)}
                  >
                    <span>{index + 1}</span>
                    {country.name}
                  </button>
                )
              })}
            </div>

            <div className="feedback" aria-live="polite">
              {!isAnswered && wrongAttempts.length === 0 && (
                <p>Choose an answer or press 1-4.</p>
              )}
              {!isAnswered && wrongAttempts.length > 0 && (
                <p>Try again. Study Mode reveals the answer after two misses.</p>
              )}
              {isAnswered && selectedIso === currentCountry.iso && (
                <p className="success">Correct.</p>
              )}
              {isAnswered && selectedIso !== currentCountry.iso && (
                <p className="error">
                  The answer is {currentCountry.name}.
                </p>
              )}
            </div>

            <button
              type="button"
              className="next-button"
              disabled={!isAnswered}
              onClick={nextQuestion}
            >
              {questionIndex + 1 >= deck.length ? 'See Results' : 'Next'}
            </button>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
