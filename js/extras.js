'use strict'

// Extra Features

var gTimerStart
var gTimerInterval


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
    var timeInSecs = Math.floor(timeDiff / 1000)
    elTimer.innerText = String(timeInSecs).padStart(3, '0')

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
    // elCell.classList.add("mined")
    // console.log('hi')
}

// pressing on light bulb
function hint(elBulb, whichBulb) {
    if (!gGame.isOn || gGame.hintMode) return
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