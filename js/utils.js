'use strict'

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min)
}

function makeId(length = 6) {
  var txt = ''
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (var i = 0; i < length; i++) {
    txt += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return txt
}

function getRandomColor() {
  var letters = '0123456789ABCDEF'.split('')
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

function isEmptyCell(coord) {
  return !gBoard[coord.i][coord.j]
}

// location is an object like this - { i: 2, j: 7 }
function renderCell(coord, value) {
  // Select the elCell and set the value
  const elCell = document.querySelector(`.cell-${coord.i}-${coord.j}`)
  elCell.innerHTML = value
}

// 'cell-2-7' => {i:2, j:7}
function getCellCoord(strCellId) {
  var coord = {}
  var parts = strCellId.split('-')
  coord.i = +parts[1]
  coord.j = +parts[2]
  return coord
}

// {i:2,j:4} => '.cell-2-4'
function getClassSelector(location) {
  return '.cell-' + location.i + '-' + location.j
}

// {i:2,j:4} => '#cell-2-4'
function getIDSelector(coord) {
  return `#cell-${coord.i}-${coord.j}`
}

function createMat(rows, cols) {
  const mat = []
  for (var i = 0; i < rows; i++) {
    const row = []
    for (var j = 0; j < cols; j++) {
      row.push('')
    }
    mat.push(row)
  }
  return mat
}

function createShuffledArray(size) {
  var nums = []
  for (var i = 1; i <= size; i++) {
    nums.push(i)
  }
  return shuffle(nums)
}

// shuffle array
function shuffle(items) {
  var randIdx, keep
  for (var i = items.length - 1; i > 0; i--) {
    randIdx = getRandomIntInclusive(0, items.length - 1)
    keep = items[i]
    items[i] = items[randIdx]
    items[randIdx] = keep
  }
  return items
}
