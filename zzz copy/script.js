// script.js

let flashcards = [];
let wrongFlashcards = [];
let currentCardIndex = 0;
let correctCount = 0;
let totalCount = 0;
let currentFlashcardSetName = ''; // To store the name of the current flashcard set

// DOM elements
const questionInput = document.getElementById('questionInput');
const addCardBtn = document.getElementById('addCardBtn');
const questionElement = document.getElementById('question');
const answerElement = document.getElementById('answer');
const correctBtn = document.getElementById('correctBtn');
const wrongBtn = document.getElementById('wrongBtn');
const hintBtn = document.getElementById('hintBtn');
const scoreElement = document.getElementById('score');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const questionList = document.getElementById('questionList');
const wrongList = document.getElementById('wrongList');
const clearWrongBtn = document.getElementById('clearWrongBtn');
const savedSetsListElement = document.getElementById('savedSetsList'); // Get the new list element


// Event Listeners
addCardBtn.addEventListener('click', addFlashcards);
correctBtn.addEventListener('click', handleCorrect);
wrongBtn.addEventListener('click', handleWrong);
hintBtn.addEventListener('click', showHint);
saveBtn.addEventListener('click', saveFlashcards);
loadBtn.addEventListener('click', showSavedSetList); // Changed to showSavedSetList
downloadBtn.addEventListener('click', downloadFlashcards);
clearWrongBtn.addEventListener('click', clearWrongFlashcards);
document.addEventListener('DOMContentLoaded', loadLastSession);


function addFlashcards() {
    const inputText = questionInput.value;
    flashcards = parseFlashcardInput(inputText);
    questionInput.value = "";

    if (flashcards.length > 0) {
        // Set the flashcard set name based on the first question (you can improve this)
        currentFlashcardSetName = sanitizeFilename(flashcards[0].question.substring(0, 20)) || 'Flashcards';

        shuffleCards();
        resetState();
        displayCard();
        updateQuestionList();
        updateWrongList();
    }
}

function parseFlashcardInput(text) {
    const blocks = text.split(/Flashcard \d+\s*/).filter(block => block.trim() !== '');
    return blocks.map(block => {
        const lines = block.split('\n').filter(line => line.trim() !== '');
        const question = lines.find(line => line.startsWith('Question:')).replace('Question:', '').trim();
        const answer = lines.find(line => line.startsWith('Answer:')).replace('Answer:', '').trim();
        return { question, answer };
    });
}

function resetState() {
    currentCardIndex = 0;
    correctCount = 0;
    totalCount = 0;
    wrongFlashcards = [];
    updateWrongList();
}

function shuffleCards() {
    flashcards.sort(() => Math.random() - 0.5);
}

function displayCard() {
    if (currentCardIndex < flashcards.length) {
        const card = flashcards[currentCardIndex];
        questionElement.textContent = card.question;
        answerElement.textContent = card.answer;
        answerElement.classList.add('hidden');
    } else {
        questionElement.textContent = "All done!";
        answerElement.textContent = "";
    }
}

function handleCorrect() {
    correctCount++;
    totalCount++;
    nextCard();
}

function handleWrong() {
    const currentCard = flashcards[currentCardIndex];
    wrongFlashcards.push(currentCard);
    saveWrongFlashcards();
    totalCount++;
    showHint();
    updateWrongList();
    setTimeout(nextCard, 2000);
}

function showHint() {
    answerElement.classList.remove('hidden');
}

function nextCard() {
    currentCardIndex++;
    displayCard();
    updateScore();
}

function updateScore() {
    scoreElement.textContent = `Score: ${correctCount}/${totalCount}`;
}

function updateQuestionList() {
    questionList.innerHTML = '';
    flashcards.forEach((card, index) => {
        const div = document.createElement('div');
        div.className = 'question-item';
        div.textContent = `${index + 1}. ${card.question}`;
        div.onclick = () => jumpToCard(index);
        questionList.appendChild(div);
    });
}

function updateWrongList() {
    wrongList.innerHTML = '';
    wrongFlashcards.forEach((card, index) => {
        const div = document.createElement('div');
        div.className = 'wrong-item';
        div.textContent = `${index + 1}. ${card.question}`;
        wrongList.appendChild(div);
    });
}

function saveFlashcards() {
    if (!currentFlashcardSetName) {
        alert("Please add flashcards first to save.");
        return;
    }
    const data = { flashcards, score: { correctCount, totalCount }, currentCardIndex, wrongFlashcards };
    localStorage.setItem(`flashcardSet-${currentFlashcardSetName}`, JSON.stringify(data));
    alert(`Flashcard set "${currentFlashcardSetName}" saved!`);
}


function showSavedSetList() { // Function to display the list of saved sets
    savedSetsListElement.innerHTML = ''; // Clear previous list
    const savedSetKeys = Object.keys(localStorage).filter(key => key.startsWith('flashcardSet-'));

    if (savedSetKeys.length === 0) {
        savedSetsListElement.textContent = "No saved flashcard sets found.";
        return;
    }

    const ul = document.createElement('ul'); // Create an unordered list (optional, can use divs too)
    savedSetKeys.forEach(key => {
        const setName = key.replace('flashcardSet-', '');
        const li = document.createElement('li'); // Create list item
        const link = document.createElement('a'); // Create a link for each set
        link.href = '#'; // Or 'javascript:void(0);' to prevent page jump
        link.textContent = setName;
        link.onclick = () => actuallyLoadFlashcardSet(setName); // Load set on click
        li.appendChild(link);
        ul.appendChild(li);
    });
    savedSetsListElement.appendChild(ul); // Append the list to the div
}


function actuallyLoadFlashcardSet(setName) { // Renamed and modified function to take setName
    const data = JSON.parse(localStorage.getItem(`flashcardSet-${sanitizeFilename(setName)}`));
    if (data) {
        loadDataToApp(data);
        currentFlashcardSetName = sanitizeFilename(setName);
        alert(`Flashcard set "${setName}" loaded!`);
        savedSetsListElement.innerHTML = ''; // Clear the list after loading (optional)
    } else {
        alert(`Flashcard set "${setName}" not found (this should not happen)!`); // Just in case
    }
}


function loadLastSession() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('flashcardSet-'));
    if (keys.length > 0) {
        const lastKey = keys[keys.length - 1];
        const data = JSON.parse(localStorage.getItem(lastKey));
        if (data) {
            loadDataToApp(data);
            currentFlashcardSetName = lastKey.replace('flashcardSet-', '');
            console.log(`Last session "${currentFlashcardSetName}" loaded on startup.`);
        }
    } else {
        console.log("No saved session found on startup.");
    }
}


function loadDataToApp(data) {
    flashcards = data.flashcards || [];
    wrongFlashcards = data.wrongFlashcards || [];
    correctCount = data.score.correctCount || 0;
    totalCount = data.score.totalCount || 0;
    currentCardIndex = data.currentCardIndex || 0;
    displayCard();
    updateScore();
    updateQuestionList();
    updateWrongList();
}


function saveWrongFlashcards() {
    localStorage.setItem('wrongFlashcards', JSON.stringify(wrongFlashcards));
}


function downloadFlashcards() {
    if (!flashcards || flashcards.length === 0) {
        alert("No flashcards to download.");
        return;
    }

    const blob = new Blob([JSON.stringify(flashcards, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const filename = `${currentFlashcardSetName || 'flashcards'}.json`;
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}


function jumpToCard(index) {
    currentCardIndex = index;
    displayCard();
}

function clearWrongFlashcards() {
    wrongFlashcards = [];
    updateWrongList();
    saveWrongFlashcards();
}


function sanitizeFilename(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}