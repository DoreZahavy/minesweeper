'use strict'

var loseAudio = new Audio('sounds/lose.mp3')
var winAudio = new Audio('sounds/win.mp3')
var hintAudio = new Audio('sounds/hint.mp3')
var revealAudio = new Audio('sounds/reveal.mp3')

var gBoard
var gLevel = {
    size: 4,
    mines: 2
}
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    lives: 1,
    hintMode: 0
}

const EMPTY = ' '
const MINE_IMG = `<img src="img/mine.png">`
const FLAG = '🚩'


function onInit() {
    // gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    // console.log('hi')

    reviveBulbs()

    gBoard = createBoard(gLevel.size)
    console.log('gBoard:', gBoard)
    renderBoard()


}


function createBoard(size) {
    var board = []
    for (var i = 0; i < size; i++) {
        board[i] = []
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: -1,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    return board
}

function putMinesOnBoard(rowIdx, colIdx) {
    // Putting random mines
    for (var i = 0; i < gLevel.mines; i++) {
        var pos = findEmptyPoss(rowIdx, colIdx)
        gBoard[pos.i][pos.j].isMine = true
    }

    // calculating the mine counter on each cell
    updateMineCounters()

}

function updateMineCounters() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (!gBoard[i][j].isMine) {
                gBoard[i][j].minesAroundCount = countMines(i, j)
            }
        }
    }
}

function renderBoard() {
    var strHTML = ''
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gBoard[0].length; j++) {
            var cellContent = EMPTY
            if (gBoard[i][j].isShown) {
                if (gBoard[i][j].isMine) cellContent = MINE_IMG
                else cellContent = (gBoard[i][j].minesAroundCount) ? gBoard[i][j].minesAroundCount : EMPTY
            } else if (gBoard[i][j].isMarked) cellContent = FLAG

            var cellStatus = (gBoard[i][j].isShown) ? 'revealed' : 'covered'
            var mineCount = gBoard[i][j].minesAroundCount
            var classList = `class="cell cell-${i}-${j} ${cellStatus} count${mineCount}"`
            strHTML += `<td ${classList} 
            oncontextmenu="onFlag(this, ${i},${j})" 
            onClick="onCellClicked(this, ${i},${j})">
                ${cellContent}</td>
                `
        }
        strHTML += '</tr>'
    }
    document.querySelector('tbody').innerHTML = strHTML
    disableContextMenu()
}

function onCellClicked(elCell, rowIdx, colIdx) {
    if (gGame.hintMode && !gBoard[rowIdx][colIdx].isShown) {
        hintAudio.play()
        // console.log('hi')
        quickReveal(elCell, rowIdx, colIdx)
        return
    }
    if (!document.querySelector(".revealed")) {
        revealAudio.play()
        putMinesOnBoard(rowIdx, colIdx)
        startTimer()
        gGame.isOn = true
    }
    if (!gGame.isOn) return

    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isMarked || currCell.isShown) return
    else if (currCell.isMine) {
        gBoard[rowIdx][colIdx].isShown = true
        renderBoard()
        gGame.lives--
        document.querySelector(`[title="Lives"]`).innerText = gGame.lives
        if (!gGame.lives) {

            gameOver(false, elCell)
            return
        }
    }
    gGame.shownCount++
    revealAudio.play()
    expandShown(rowIdx, colIdx)
    renderBoard()
    checkGameOver()
}

//  expands safe areas and uses recursion on neighbor free areas
function expandShown(rowIdx, colIdx) {
    gBoard[rowIdx][colIdx].isShown = true
    if (gBoard[rowIdx][colIdx].minesAroundCount === 0) {

        // RECURSION
        for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
            if (i < 0 || i >= gBoard.length) continue
            for (var j = colIdx - 1; j <= colIdx + 1; j++) {
                if (i === rowIdx && j === colIdx) continue
                if (j < 0 || j >= gBoard[0].length) continue
                if (gBoard[i][j].isShown || gBoard[i][j].isMarked) continue
                gBoard[i][j].isShown = true
                gGame.shownCount++
                if (gBoard[i][j].minesAroundCount === 0) {
                    expandShown(i, j)
                }
            }
        }
    }
    // console.log('gGame.shownCount:', gGame.shownCount)
    renderBoard()
}

// right click to flag or de-flag
function onFlag(elCell, rowIdx, colIdx) {
    if (!gGame.isOn) return
    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown) return
    if (currCell.isMarked) {
        currCell.isMarked = false
        gGame.markedCount--

    } else {
        currCell.isMarked = true
        gGame.markedCount++
    }
    renderBoard()
    document.querySelector(`[title="Bombs left"]`).innerText =
        String(gLevel.mines - gGame.markedCount).padStart(3, '0')
    checkGameOver()
}


function disableContextMenu() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            elCell.addEventListener("contextmenu", (e) => { e.preventDefault() })
        }
    }
}


function checkGameOver() {
    // console.log('gGame.markedCount:', gGame.markedCount)
    // console.log('gGame.shownCount:', gGame.shownCount)
    const cellsAmount = gLevel.size * gLevel.size
    if (gGame.shownCount === cellsAmount - gLevel.mines &&
        gGame.markedCount === gLevel.mines) {
        gameOver(true, null)
    }
}

// Both Win and Lose
function gameOver(isWin, elCell) {

    clearInterval(gTimerInterval)

    var elModal = document.querySelector('.modal')
    // check if win or lose
    elModal.innerText = (isWin) ? 'Congratulations\nYou Win!' : 'Game Over\nTry Again'
    if (isWin) {
        winAudio.play()
        elModal.innerText = 'Congratulations\nYou Win!'
        elModal.style.color = 'green'
        document.querySelector('[title="How do you do?"]').innerText = '😎'
    } else {
        loseAudio.play()
        elModal.innerText = 'Game Over\nTry Again'
        elModal.style.color = 'red'
        document.querySelector('[title="How do you do?"]').innerText = '🤯'
        loseRevealBoard(elCell)
    }
    elModal.style.display = 'block'
    gGame.isOn = false
}

// Difficulty button restart the game
function restart(size, mines) {
    document.querySelector(`[title="Timer"]`).innerText = '000'
    document.querySelector(`[title="Bombs left"]`).innerText = '000'
    if (mines > 2) gGame.lives = 3
    else gGame.lives = 1
    document.querySelector(`[title="Lives"]`).innerText = gGame.lives

    gLevel.size = size
    gLevel.mines = mines
    // change smiley
    document.querySelector('[title="How do you do?"]').innerText = '😃'
    document.querySelector('.modal').style.display = 'none'
    // update bombs left
    document.querySelector(`[title="Bombs left"]`).innerText = String(gLevel.mines).padStart(3, '0')
    onInit()
}


