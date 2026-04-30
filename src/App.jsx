import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import countries from './data/africaCountries.json'
import { VIEWBOX_SIZE, countryToSvgPath } from './geo'
import { getAccuracy, makeOptions, shuffle } from './quiz'
import './App.css'

const ADVANCE_DELAY = 650

function makeDeck(source = countries) {
  return shuffle(source)
}

function StudyGuideCard({ country }) {
  return (
    <article className="study-card">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        role="img"
        aria-label={`${country.name} outline`}
      >
        <path d={countryToSvgPath(country.geometry)} fillRule="evenodd" />
      </svg>
      <strong>{country.name}</strong>
    </article>
  )
}

function App() {
  const advanceTimerRef = useRef(null)
  const [deck, setDeck] = useState(() => makeDeck())
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selectedIso, setSelectedIso] = useState(null)
  const [missedCountries, setMissedCountries] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)

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

  const chooseAnswer = useCallback(
    (country) => {
      if (!country || !currentCountry || isAnswered || isAdvancing) return

      const wasCorrect = country.iso === currentCountry.iso
      setSelectedIso(country.iso)
      setAnswered((value) => value + 1)
      setIsAdvancing(true)

      if (wasCorrect) {
        setScore((value) => value + 1)
      } else {
        rememberMiss(currentCountry)
      }

      advanceTimerRef.current = window.setTimeout(() => {
        if (questionIndex + 1 >= deck.length) {
          setIsComplete(true)
          return
        }

        setQuestionIndex((value) => value + 1)
        setSelectedIso(null)
        setIsAdvancing(false)
      }, ADVANCE_DELAY)
    },
    [currentCountry, deck.length, isAnswered, isAdvancing, questionIndex, rememberMiss],
  )

  const restartGame = useCallback((source = countries) => {
    window.clearTimeout(advanceTimerRef.current)
    setDeck(makeDeck(source))
    setQuestionIndex(0)
    setScore(0)
    setAnswered(0)
    setSelectedIso(null)
    setMissedCountries([])
    setIsComplete(false)
    setIsAdvancing(false)
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
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [chooseAnswer, isComplete, options, restartGame])

  useEffect(() => {
    return () => window.clearTimeout(advanceTimerRef.current)
  }, [])

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

          <div className="study-guide">
            <h2>Study guide</h2>
            {missedCountries.length === 0 ? (
              <p>Perfect round. Every outline landed.</p>
            ) : (
              <>
                <p>Review these outlines, then practice just the missed set.</p>
                <div className="study-grid" aria-label="Missed country study guide">
                  {missedCountries.map((country) => (
                    <StudyGuideCard country={country} key={country.iso} />
                  ))}
                </div>
              </>
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
            <div className="answers">
              {options.map((country, index) => {
                const isCorrectOption = country.iso === currentCountry.iso
                const revealCorrect = isAnswered && isCorrectOption
                const showWrong = selectedIso === country.iso
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
                    disabled={isAnswered}
                    onClick={() => chooseAnswer(country)}
                  >
                    <span>{index + 1}</span>
                    {country.name}
                  </button>
                )
              })}
            </div>

            <div className="feedback" aria-live="polite">
              {!isAnswered && <p>Press 1-4 or click an answer.</p>}
              {isAnswered && selectedIso === currentCountry.iso && (
                <p className="success">Correct. Next country coming up.</p>
              )}
              {isAnswered && selectedIso !== currentCountry.iso && (
                <p className="error">
                  The answer is {currentCountry.name}. Next country coming up.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
