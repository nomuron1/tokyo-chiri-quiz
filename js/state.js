export const state = {
  geojsonLayer: null,
  placeLayer: null,

  streetQuestions: [],
  crossQuestions: [],
  placeQuestions: [],

  currentQuestions: [],

  score: 0,
  totalQuestions: 0,

  wrongAnswers: [],
  answerHistory: [],

  currentHighlightedLayer: null,
  currentPlaceLayer: null,

  currentQuizType: null,
  currentDifficulty: null,
  currentQuestion: null,

  selectedQuizInitialData: null,
  filteredQuestionsByDiff: [],
  selectedQuestionCount: 0,

  searchMarkers: [],
  searchHighlightedLayer: null,
};
