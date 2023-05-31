'use strict'

// var deadAudio = new Audio('sounds/dead.mp3')

var gBoard
var gLevel = {
    size: 4,
    mines: 2
}
var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}

const EMPTY = ' '
const MINE_IMG = `<img src="img/mine.png">`
const FLAG = '🚩'


function onInit() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    console.log('hi')


    gBoard = createBoard(gLevel.size)
    console.log('gBoard:', gBoard)
    // putMinesOnBoard()
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
                // cellContent: EMPTY
            }
        }
    }
    return board
}

function putMinesOnBoard(rowIdx, colIdx) {
    // TODO: Putting mines, later make it random 
    // gBoard[0][0].isMine = gBoard[1][1].isMine = true

    for (var i = 0; i < gLevel.mines; i++) {
        var pos = findEmptyPoss(rowIdx, colIdx)
        gBoard[pos.i][pos.j].isMine = true
    }

    // console.log('hi')
    updateMineCounters()

}

function updateMineCounters() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (!gBoard[i][j].isMine) {
                gBoard[i][j].minesAroundCount = countMines(i, j)
                // console.log('gBoard[i][j].minesAroundCount:', gBoard[i][j].minesAroundCount)
                // console.log('i:', i)
                // console.log('j:', j)
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
            // var cellContent =(gBoard[i][j].isShown)? gBoard[i][j].cellContent : EMPTY
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

// TODO: add recursion
function expandShown(rowIdx, colIdx) {
    // if (gBoard[rowIdx][colIdx].isMine) return
    gBoard[rowIdx][colIdx].isShown = true
    if (gBoard[rowIdx][colIdx].minesAroundCount === 0) {

        // RECURSION
        for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
            if (i < 0 || i >= gBoard.length) continue
            for (var j = colIdx - 1; j <= colIdx + 1; j++) {
                if (i === rowIdx && j === colIdx) continue
                if (j < 0 || j >= gBoard[0].length) continue
                if (gBoard[i][j].isShown) continue
                gBoard[i][j].isShown = true
                gGame.shownCount++
                if (gBoard[i][j].minesAroundCount === 0) {
                    // var elNewCell = document.querySelector(`${getClassSelector({ i, j })}`)
                    expandShown(i, j)
                }
            }
        }
    }
    console.log('gGame.shownCount:', gGame.shownCount)
    renderBoard()
}


//TODO: write code here and fix problen
function onCellClicked(elCell, rowIdx, colIdx) {
    if (!gGame.isOn) return
    if (!document.querySelector(".revealed")) {
        putMinesOnBoard(rowIdx, colIdx)
    }

    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isMarked || currCell.isShown) return
    else if (currCell.isMine) {
        gBoard[rowIdx][colIdx].isShown = true
        renderBoard()
        gameOver()
        return
    }
    gGame.shownCount++
    expandShown(rowIdx, colIdx)
    renderBoard()
}

//TODO: write code here
function onCellMarked(elCell) {

}

// TODO write function for flagging 
function onFlag(elCell, rowIdx, colIdx) {
    if (!gGame.isOn) return
    var currCell = gBoard[rowIdx][colIdx]
    if (currCell.isShown) return
    currCell.isMarked = (currCell.isMarked) ? false : true
    renderBoard()
}

function disableContextMenu() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var elCell = document.querySelector(`.cell-${i}-${j}`)
            elCell.addEventListener("contextmenu", (e) => { e.preventDefault() })
        }
    }
}


//TODO: write code here
function checkGameOver() {

}

// TODO: Write Code
function gameOver() {
    console.log('game over')
    gGame.isOn = false
}

function restart(size, mines) {
    gLevel.size = size
    gLevel.mines = mines
    onInit()
}


// TODO: Fix to match this project
function startTimer() {
    gTimerStart = new Date()
    gTimerInterval = setInterval(updateTimer, 1)
}
// TODO: Fix to match this project
function updateTimer() {
    var currTime = new Date()
    var elTimer = document.querySelector('.timer')
    // elTimer.style.display = 'block'
    elTimer.innerText = (currTime.getTime() - gTimerStart.getTime()) / 1000
}