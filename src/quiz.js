export function shuffle(items) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

export function makeOptions(correctCountry, allCountries, optionCount = 4) {
  const incorrect = shuffle(
    allCountries.filter((country) => country.iso !== correctCountry.iso),
  ).slice(0, optionCount - 1)

  return shuffle([correctCountry, ...incorrect])
}

export function getAccuracy(score, answered) {
  if (answered === 0) return 0

  return Math.round((score / answered) * 100)
}
