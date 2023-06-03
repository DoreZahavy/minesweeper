'use strict'

// Extra Features

var gTimerStart
var gTimerInterval

var gMegaHintPos

var gManualCount = 0

const SAFE_MARK = `<img src="../img/safe-sign.png">` //'😁'



// start the timer and remember starting time
function startTimer() {
    gTimerStart = new Date()
    gTimerInterval = setInterval(updateTimer, 1000)
}
// updates every second
function updateTimer() {
    var currTime = new Date()
    var elTimer = document.querySelector(`[title="Timer"]`)
    var timeDiff = currTime.getTime() - gTimerStart.getTime()
    gGame.secsPassed = Math.floor(timeDiff / 1000)

    // console.log('gGame.secsPassed:', gGame.secsPassed)
    elTimer.innerText = String(gGame.secsPassed).padStart(3, '0')

}

function loseRevealBoard(elCell) {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {

                gBoard[i][j].isShown = true
            }
        }
    }
    renderBoard()
    // console.log('hi')
}

// pressing on light bulb
function hint(elBulb, whichBulb) {
    if (!gGame.isOn || gGame.hintMode ||
        gGame.megaHint === 1 || gGame.megaHint === 2) return
    gGame.hintMode = whichBulb
    // console.log('gGame.hintMode:', gGame.hintMode)
    elBulb.style.background = 'yellow'
}

// revealing hinted cell and negs
function quickReveal(elCell, rowIdx, colIdx) {
    // if(gBoard[rowIdx][colIdx].isShown) return
    // hintAudio.play()
    var mem = []
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) {
            mem[i] = []
            continue
        }
        mem[i] = []
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) {
                mem[i][j] = ''
                continue
            }
            mem[i][j] = gBoard[i][j].isShown
            gBoard[i][j].isShown = true
        }
    }
    renderBoard()
    // console.log('mem:', mem)
    setTimeout(endQuickReveal, 1000, mem, rowIdx, colIdx)
}

// end reveal after 1 sec
function endQuickReveal(mem, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[0].length) continue
            if (mem[i][j] === true || mem[i][j] === false)
                gBoard[i][j].isShown = mem[i][j]
        }
    }
    renderBoard()
    document.querySelector(`.under-table span:nth-child(${gGame.hintMode})`).hidden = true
    // var elBulb = document.querySelector(`[title="hint "]${gGame.hintMode})`)
    // console.log('elBulb:', elBulb)
    gGame.hintMode = 0
}

// bring back used bulbs on restart
function reviveBulbs() {
    for (var i = 2; i < 5; i++) {
        var elBulb = document.querySelector(`.under-table span:nth-child(${i})`)
        elBulb.style.background = 'transparent'
        elBulb.hidden = false
    }

}

function safeBtn() {
    if (!gGame.isOn || !gGame.safeClicks) return
    gGame.safeClicks--
    if (!gGame.safeClicks) {
        blockBtn(document.querySelector(`[title="Safety Button"]`))
    }
    var elSafeSpan = document.querySelector('[title="Safety Button"] span')
    elSafeSpan.innerText = gGame.safeClicks
    var randCellPos = findCoveredPos()
    // console.log('randCellPos:', randCellPos)
    var classSel = getClassSelector(randCellPos)
    // console.log('classSel:', classSel)
    var randCell = document.querySelector(`${classSel}`)
    var content = randCell.innerText
    // console.log('content:', content)
    randCell.innerHTML = SAFE_MARK
    // renderBoard()
    setTimeout(unmark, 2000, randCell, content)
}

function unmark(randCell, content) {
    // gBoard[pos.i][pos.j].isSafe = false
    randCell.innerText = content
    // renderBoard()
}

function findCoveredPos() {

    var emptyPoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (!gBoard[i][j].isShown && !gBoard[i][j].isMine) {
                var pos = {
                    i: i,
                    j: j
                }
                emptyPoss.push(pos)
            }
        }
    }
    const randIdx = getRandomInt(0, emptyPoss.length)
    const randPos = emptyPoss[randIdx]
    return randPos
}

// Undo last change
function undoBtn() {
    if (!gGame.isOn || !gUndo.length) return

    gGame.shownCount = 0
    gGame.markedCount = 0

    var board = gUndo.shift()
    console.log('gUndo.length:', gUndo.length)
    console.log('gUndo:', gUndo)
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {

            gBoard[i][j] = {
                minesAroundCount: board[i][j].minesAroundCount,
                isShown: board[i][j].isShown,
                isMine: board[i][j].isMine,
                isMarked: board[i][j].isMarked,
                isSafe: board[i][j].isSafe
            }
            if (gBoard[i][j].isMarked) gGame.markedCount++
            if (gBoard[i][j].isShown) {
                if (gBoard[i][j].isMine) gGame.markedCount++
                else gGame.shownCount++
            }
        }
    }
    updateBombsLeft()
    renderBoard()
}

// Saves board every change
function saveBoard() {
    var board = []
    for (var i = 0; i < gBoard.length; i++) {
        board[i] = []
        for (var j = 0; j < gBoard[0].length; j++) {

            board[i][j] = {
                minesAroundCount: gBoard[i][j].minesAroundCount,
                isShown: gBoard[i][j].isShown,
                isMine: gBoard[i][j].isMine,
                isMarked: gBoard[i][j].isMarked,
                isSafe: gBoard[i][j].isSafe
            }
        }
    }
    // console.log('board:', board)
    gUndo.unshift(board)
}

function megaBtn() {
    if (!gGame.isOn || gGame.hintMode) return
    if (gGame.megaHint === -1 || gGame.megaHint === 2) return
    // console.log('gGame.megaHint:', gGame.megaHint)
    gGame.megaHint = 1
    // console.log('gGame.megaHint:', gGame.megaHint)
}

// clicking on a cell after hitting mega hint btn
function megaHintFunc(rowIdx, colIdx) {
    // console.log('gGame.megaHint:', gGame.megaHint)
    // console.log('gGame.megaHint:', gGame.megaHint)
    if (gGame.megaHint === 1) {
        gMegaHintPos = { i: rowIdx, j: colIdx }
        // console.log('gMegaHintPos:', gMegaHintPos)
        gGame.megaHint = 2
    } else if (gGame.megaHint === 2) {
        if (gMegaHintPos.i > rowIdx || gMegaHintPos.j > colIdx) return
        var startPos = gMegaHintPos
        var endPos = { i: rowIdx, j: colIdx }
        var mem = []
        for (var i = startPos.i; i <= endPos.i; i++) {
            mem[i] = []
            for (var j = startPos.j; j <= endPos.j; j++) {
                mem[i][j] = gBoard[i][j].isShown
                gBoard[i][j].isShown = true

            }
        }
        renderBoard()
        // console.log('mem:', mem)
        gGame.megaHint = -1
        blockBtn(document.querySelector(`[title="Mega Hint"]`))
        console.log('gGame.megaHint:', gGame.megaHint)

        setTimeout(endMegaReveal, 2000, mem, endPos, startPos)
    }
}

function endMegaReveal(mem, endPos, startPos) {
    for (var i = startPos.i; i <= endPos.i; i++) {
        for (var j = startPos.j; j <= endPos.j; j++) {
            gBoard[i][j].isShown = mem[i][j]
        }
    }
    gMegaHintPos = null
    renderBoard()
}

// Mine Exterminator btn
function exterminate() {
    if (!gGame.isOn || gGame.hintMode || !gGame.exterminate) return
    if (gGame.megaHint === 1 || gGame.megaHint === 2) return
    var allMinePoss = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                var pos = {
                    i: i,
                    j: j
                }
                allMinePoss.push(pos)
            }
        }
    }
    for (var i = 0; i < 3; i++) {

        var randMinePos = allMinePoss.splice(getRandomInt(0, allMinePoss.length), 1)[0]
        var classSel = getClassSelector(randMinePos)
        gBoard[randMinePos.i][randMinePos.j].isMine = false
    }
    updateMineCounters()
    gLevel.mines -= 3
    updateBombsLeft()
    renderBoard()

    gGame.exterminate = false
    blockBtn(document.querySelector(`[title="Exterminate 3 Random Mines"]`))

}

// Saving score when winning
function saveScore(size, score) {
    var diff
    if (size === 4) diff = 'Beginner'
    else if (size === 8) diff = 'Medium'
    else if (size === 12) diff = 'Expert'

    if (score < localStorage[diff] || !localStorage[diff]) localStorage[diff] = score

    // renderScoreTable(diff)

}

function showBestScore() {
    var diff
    if (gLevel.size === 4) diff = 'Beginner'
    else if (gLevel.size === 8) diff = 'Medium'
    else if (gLevel.size === 12) diff = 'Expert'
    var elSpan = document.querySelector(`.bestScore span`)
    if(!localStorage[diff]) elSpan.innerText = ` ${diff}: No Score`
    else elSpan.innerText = `${diff}: ${localStorage[diff]} Seconds!`
}

function resetBtn(elBtn) {
    elBtn.style.background = 'var(--clrBtns)'
    elBtn.style.cursor = 'pointer'
}

function blockBtn(elBtn) {
    elBtn.style.background = `var(--clrBtnsNo)`
    elBtn.style.cursor = 'not-allowed'

}

// Manual Mode Button
function manualMode() {
    if (gLevel.mines === 11 || gLevel.mines === 29) gLevel.mines += 3
    // start manual mode
    if (!gGame.isManual) {
        gGame.isManual = true
        // createBoard(gGame.size)
    }
    else {
        // cancel manual mode
        gGame.isManual = false
    }
    gManualCount = 0
    restart(gLevel.size, gLevel.mines)
    updateManualBtn()
}

function buildManualBombs(rowIdx, colIdx) {
    if (gBoard[rowIdx][colIdx].isMine) return
    gBoard[rowIdx][colIdx].isMine = true
    gManualCount++
    updateManualBtn()
}

function updateManualBtn() {
    var elBtnSpan = document.querySelector('.manualBtn span')
    if (gLevel.mines === gManualCount) {
        // gManualCount = 0
        // gGame.isManual = false
        elBtnSpan.innerText = 'Ready!'
    } else {
        elBtnSpan.innerText = (gGame.isManual) ? `ON ${gManualCount}/${gLevel.mines}` : 'OFF'
    }
}

function darkMode() {
    document.documentElement.style.cssText =
        " --clrMainText:white; --clrBG: #111; --clrRevealed: lightgray"
}

function lightMode() {
    document.documentElement.style.cssText =
        " --clrMainText:black; --clrBG: #FAF9F6; --clrRevealed: rgb(161, 161, 161)"
}

function forestMode(){
    document.documentElement.style.cssText = 
    " --clrMainText: #FAF9F6; --clrBG: rgb(5, 29, 3); --clrRevealed: #705139"
}