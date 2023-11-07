'use strict'

var loseAudio = new Audio('sounds/lose.mp3')
var winAudio = new Audio('sounds/win.mp3')
var hintAudio = new Audio('sounds/hint.mp3')
var revealAudio = new Audio('sounds/reveal.mp3')
var wrongAudio = new Audio('sounds/wrong.mp3')

var gBoard
var gLevel = {
  size: 4,
  mines: 2,
}
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  lives: 1,
  hintMode: 0,
  megaHint: 0,
  safeClicks: 3,
  exterminate: false,
  secsPassed: 0,
  isManual: false,
}
// remember game moves
var gUndo

// animating win modal
var gModalDeg
var gModalInterval

const EMPTY = ' '
const MINE_IMG = `<img src="img/mine.png">`
const FLAG = '🚩'

// Extra Features

var gTimerStart
var gTimerInterval
var gMegaHintPos
var gManualCount = 0

function onInit() {
  gUndo = []

  gGame.exterminate = true

  // gGame.isOn = true
  gGame.shownCount = 0
  gGame.markedCount = 0

  reviveBulbs()
  // if (!gGame.isManual)
  gBoard = createBoard(gLevel.size)

  showBestScore()

  renderBoard()

  // saveScore(gLevel.mines, 'Moshe', 29)
  // saveScore(gLevel.mines, 'Daniel', 24)
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
        isMarked: false,
        isSafe: false,
      }
    }
  }
  return board
}

function putMinesOnBoard(rowIdx, colIdx) {
  // Putting random mines
  for (var i = 0; i < gLevel.mines; i++) {
    var pos = findEmptyPos(rowIdx, colIdx)
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
        else
          cellContent = gBoard[i][j].minesAroundCount
            ? gBoard[i][j].minesAroundCount
            : EMPTY
      } else if (gBoard[i][j].isMarked) cellContent = FLAG

      var cellStatus = gBoard[i][j].isShown ? 'revealed' : 'covered' //covered
      var mineCount = gBoard[i][j].minesAroundCount
      var safeMark = gBoard[i][j].isSafe ? ' safe' : ''
      var classList = `class="cell cell-${i}-${j} ${cellStatus} count${mineCount}${safeMark}"`

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
  if (gGame.isManual && gLevel.mines > gManualCount) {
    buildManualBombs(rowIdx, colIdx)
    return
  }
  if (gGame.megaHint === 1 || gGame.megaHint === 2) {
    megaHintFunc(rowIdx, colIdx)
    return
  }
  if (gGame.hintMode && !gBoard[rowIdx][colIdx].isShown) {
    hintAudio.play()
    quickReveal(elCell, rowIdx, colIdx)
    return
  }
  if (!document.querySelector('.revealed')) {
    if (!gGame.isManual) putMinesOnBoard(rowIdx, colIdx)
    else {
      gManualCount = 0
      updateMineCounters()
    }
    startTimer()
    gGame.isOn = true
    gGame.isManual = false
  }
  if (!gGame.isOn) return

  var currCell = gBoard[rowIdx][colIdx]
  if (currCell.isMarked || currCell.isShown) return
  if (currCell.isMine) {
    saveBoard()
    gBoard[rowIdx][colIdx].isShown = true

    renderBoard()
    gGame.markedCount++
    updateBombsLeft()
    gGame.lives--
    document.querySelector(`[title="Lives"]`).innerText = gGame.lives
    if (!gGame.lives) {
      gameOver(false, elCell)
    } else wrongAudio.play()
    return
  }
  gGame.shownCount++
  revealAudio.play()
  saveBoard()
  expandShown(rowIdx, colIdx)

  renderBoard()
  checkGameOver()
}

//  expands safe areas and uses recursion on neighbor free areas
function expandShown(rowIdx, colIdx) {
  gBoard[rowIdx][colIdx].isShown = true
  if (gBoard[rowIdx][colIdx].minesAroundCount === 0) {
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
  renderBoard()
}

// right click to flag or de-flag
function onFlag(elCell, rowIdx, colIdx) {
  if (!gGame.isOn) return
  var currCell = gBoard[rowIdx][colIdx]
  if (currCell.isShown) return
  saveBoard()
  if (currCell.isMarked) {
    currCell.isMarked = false
    gGame.markedCount--
  } else {
    currCell.isMarked = true
    gGame.markedCount++
  }

  renderBoard()
  updateBombsLeft()
  checkGameOver()
}

function updateBombsLeft() {
  document.querySelector(`[title="Bombs left"]`).innerText = String(
    gLevel.mines - gGame.markedCount
  ).padStart(3, '0')
}

function disableContextMenu() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      var elCell = document.querySelector(`.cell-${i}-${j}`)
      elCell.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    }
  }
}

function countMines(rowIdx, colIdx) {
  var count = 0
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue
      if (j < 0 || j >= gBoard[0].length) continue
      if (gBoard[i][j].isMine) count++
    }
  }
  return count
}

// find a random pos that isnt the parameter pos or a mine
function findEmptyPos(rowIdx, colIdx) {
  var emptyPoss = []
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (!gBoard[i][j].isMine && !(i === rowIdx && j === colIdx)) {
        var pos = {
          i: i,
          j: j,
        }
        emptyPoss.push(pos)
      }
    }
  }
  const randIdx = getRandomInt(0, emptyPoss.length)
  const randPos = emptyPoss[randIdx]
  return randPos
}

function checkGameOver() {
  const cellsAmount = gLevel.size * gLevel.size
  if (
    gGame.shownCount === cellsAmount - gLevel.mines &&
    gGame.markedCount === gLevel.mines
  ) {
    gameOver(true, null)
  }
}

// Both Win and Lose
function gameOver(isWin, elCell) {
  updateManualBtn()
  clearInterval(gTimerInterval)

  // check if win or lose
  if (isWin) {
    saveScore(gLevel.size, gGame.secsPassed)
    showBestScore()
    winAudio.play()
    winModal()
    document.querySelector('[title="How do you do?"]').innerText = '😎'
  } else {
    loseAudio.play()
    var elModal = document.querySelector('.modalLose')
    elModal.style.display = 'block'
    document.querySelector('[title="How do you do?"]').innerText = '🤯'
    loseRevealBoard(elCell)
  }
  gGame.isOn = false
}

// Difficulty button restart the game
function restart(size, mines) {
  gGame.isOn = false
  clearInterval(gTimerInterval)

  gGame.isManual = false
  gManualCount = 0
  updateManualBtn()

  document.querySelector(`[title="Timer"]`).innerText = '000'
  document.querySelector(`[title="Bombs left"]`).innerText = '000'
  var elExt = document.querySelector(`[title="Exterminate 3 Random Mines"]`)
  resetBtn(elExt)
  if (mines > 2) {
    gGame.exterminate = true
    elExt.style.display = 'block'
    gGame.lives = 3
  } else {
    gGame.exterminate = false
    elExt.style.display = 'none'
    gGame.lives = 1
  }
  document.querySelector(`[title="Lives"]`).innerText = gGame.lives
  gMegaHintPos = null
  gGame.megaHint = 0
  resetBtn(document.querySelector(`[title="Mega Hint"]`))

  gLevel.size = size
  gLevel.mines = mines
  // change smiley
  document.querySelector('[title="How do you do?"]').innerText = '😃'
  document.querySelector('.modalLose').style.display = 'none'
  document.querySelector('.modalWin').style.display = 'none'

  gGame.safeClicks = 3
  resetBtn(document.querySelector(`[title="Safety Button"]`))
  var elSafeSpan = document.querySelector('[title="Safety Button"] span')
  elSafeSpan.innerText = gGame.safeClicks

  // update bombs left
  document.querySelector(`[title="Bombs left"]`).innerText = String(
    gLevel.mines
  ).padStart(3, '0')
  onInit()
}

function winModal() {
  var elModal = document.querySelector('.modalWin')
  gModalDeg = 0
  var elImg = elModal.querySelector('img')
  gModalInterval = setInterval(animateModal, 10, elModal, elImg)
}

function animateModal(elModal, elImg) {
  if (gModalDeg) elModal.style.display = 'block'
  gModalDeg += 20
  elImg.style.width = `${gModalDeg * 1.5}px`
  elModal.style.transform = `rotate(${gModalDeg}deg)`
  if (gModalDeg === 360) {
    clearInterval(gModalInterval)
    gModalDeg = 0
  }
}

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
}

// pressing on light bulb
function hint(elBulb, whichBulb) {
  if (
    !gGame.isOn ||
    gGame.hintMode ||
    gGame.megaHint === 1 ||
    gGame.megaHint === 2
  )
    return
  gGame.hintMode = whichBulb
  elBulb.style.background = 'yellow'
}

// revealing hinted cell and negs
function quickReveal(elCell, rowIdx, colIdx) {
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
  document.querySelector(
    `.under-table span:nth-child(${gGame.hintMode})`
  ).hidden = true
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
  var classSel = getClassSelector(randCellPos)
  var randCell = document.querySelector(`${classSel}`)
  var content = randCell.innerText
  randCell.innerHTML = `<img src="img/safe-sign.png">`
  setTimeout(unmark, 2000, randCell, content)
}

function unmark(randCell, content) {
  randCell.innerText = content
}

function findCoveredPos() {
  var emptyPoss = []
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (!gBoard[i][j].isShown && !gBoard[i][j].isMine) {
        var pos = {
          i: i,
          j: j,
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
        isSafe: board[i][j].isSafe,
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
        isSafe: gBoard[i][j].isSafe,
      }
    }
  }
  gUndo.unshift(board)
}

function megaBtn() {
  if (!gGame.isOn || gGame.hintMode) return
  if (gGame.megaHint === -1 || gGame.megaHint === 2) return
  gGame.megaHint = 1
}

// clicking on a cell after hitting mega hint btn
function megaHintFunc(rowIdx, colIdx) {
  if (gGame.megaHint === 1) {
    gMegaHintPos = { i: rowIdx, j: colIdx }
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
          j: j,
        }
        allMinePoss.push(pos)
      }
    }
  }

  for (var i = 0; i < 3; i++) {
    var randMinePos = allMinePoss.splice(
      getRandomInt(0, allMinePoss.length),
      1
    )[0]
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
  if (score < localStorage[diff] || !localStorage[diff])
    localStorage[diff] = score
}

function showBestScore() {
  var diff
  if (gLevel.size === 4) diff = 'Beginner'
  else if (gLevel.size === 8) diff = 'Medium'
  else if (gLevel.size === 12) diff = 'Expert'
  var elSpan = document.querySelector(`.bestScore span`)
  if (!localStorage[diff]) elSpan.innerText = ` ${diff}: No Score`
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
  gManualCount = 0
  if (!gGame.isManual) {
    restart(gLevel.size, gLevel.mines)
    gGame.isManual = true
  } else {
    // cancel manual mode
    restart(gLevel.size, gLevel.mines)
    gGame.isManual = false
  }
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
    elBtnSpan.innerText = 'Ready!'
  } else {
    elBtnSpan.innerText = gGame.isManual
      ? `ON ${gManualCount}/${gLevel.mines}`
      : 'OFF'
  }
}

function darkMode() {
  document.documentElement.style.cssText =
    ' --clrMainText:white; --clrBG: #111; --clrRevealed: lightgray'
}

function lightMode() {
  document.documentElement.style.cssText =
    ' --clrMainText:black; --clrBG: #FAF9F6; --clrRevealed: rgb(161, 161, 161)'
}

function forestMode() {
  document.documentElement.style.cssText =
    ' --clrMainText: #FAF9F6; --clrBG: rgb(5, 29, 3); --clrRevealed: #705139'
}
