
// based on one of Mike Bostock's random maze generators
// Randomized Depth-First II
// https://bl.ocks.org/mbostock/97f1cdb9e0a695cd8df4

// or maybe random-depth first III?
// https://bl.ocks.org/mbostock/949c772b81296f8e4188

var width = 9600,
height = 9600;

var N = 1 << 0,
S = 1 << 1,
W = 1 << 2,
E = 1 << 3;

var cellSize = 120;
var cellSpacing = 4;
var cellWidth = Math.floor((width - cellSpacing) / (cellSize + cellSpacing));
var cellHeight = Math.floor((height - cellSpacing) / (cellSize + cellSpacing));
var cells = generateMaze(cellWidth, cellHeight); // each cell’s edge bits

//distance = d3.range(cellWidth * cellHeight).map(function() { return 0; }),
var frontier = [(cellHeight - 1) * cellWidth];

var cellShape = game.add.graphics(0, 0);  //init rect
cellShape.lineStyle(4, 0x0000FF, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
cellShape.beginFill(0xFFFFFF, 1); // color (0xFFFF0B), alpha (0 -> 1) // required settings

//
//var canvas = d3.select("body").append("canvas")
//.attr("width", width)
//.attr("height", height);
//
//var context = canvas.node().getContext("2d");
//
//context.translate(
//                  Math.round((width - cellWidth * cellSize - (cellWidth + 1) * cellSpacing) / 2),
//                  Math.round((height - cellHeight * cellSize - (cellHeight + 1) * cellSpacing) / 2)
//                  );
//
//context.fillStyle = "#fff";
//for (var y = 0, i = 0; y < cellHeight; ++y) {
//    for (var x = 0; x < cellWidth; ++x, ++i) {
//        fillCell(i);
//        if (cells[i] & S) fillSouth(i);
//        if (cells[i] & E) fillEast(i);
//    }
//}
//
//d3.timer(function() {
//         for (var i = 0; i < 50; ++i) {
//         if (exploreFrontier()) {
//         return true;
//         }
//         }
//         });
//
function exploreFrontier() {
    if ((i0 = popRandom(frontier)) == null) return true;
    var i0,
    i1;
//        d0 = distance[i0],
//        d1 = d0 + 1;
    
    // context.fillStyle = d3.hsl(d0 % 360, 1, .5) + "";
    fillCell(i0);
    
    //context.fillStyle = d3.hsl(d1 % 360, 1, .5) + "";
    if (cells[i0] & E && !distance[i1 = i0 + 1]) distance[i1] = d1, fillEast(i0), frontier.push(i1);
    if (cells[i0] & W && !distance[i1 = i0 - 1]) distance[i1] = d1, fillEast(i1), frontier.push(i1);
    if (cells[i0] & S && !distance[i1 = i0 + cellWidth]) distance[i1] = d1, fillSouth(i0), frontier.push(i1);
    if (cells[i0] & N && !distance[i1 = i0 - cellWidth]) distance[i1] = d1, fillSouth(i1), frontier.push(i1);
}

function fillCell(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;

    cellShape.drawRect(x * cellSize + (x + 1) * cellSpacing, y * cellSize + (y + 1) * cellSpacing, cellSize, cellSize);
}

function fillEast(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;
   walls.create((x + 1) * (cellSize + cellSpacing), y * cellSize + (y + 1) * cellSpacing, 'east-wall').body.immovable = true;
}

function fillSouth(i) {
    var x = i % cellWidth, y = i / cellWidth | 0;
    walls.create(x * cellSize + (x + 1) * cellSpacing, (y + 1) * (cellSize + cellSpacing), 'south-wall').body.immovable = true;
}

function generateMaze(width, height) {
    var cells = new Array(cellWidth * cellHeight), // each cell’s edge bits
    frontier = [];
    
    var start = (cellHeight - 1) * cellWidth;
    cells[start] = 0;
    frontier.push({index: start, direction: N});
    frontier.push({index: start, direction: E});
    shuffle(frontier, 0, 2);
    while (!exploreFrontier());
    return cells;
    
    function exploreFrontier() {
        if ((edge = frontier.pop()) == null) return true;
        
        var edge,
        i0 = edge.index,
        d0 = edge.direction,
        i1 = i0 + (d0 === N ? -cellWidth : d0 === S ? cellWidth : d0 === W ? -1 : +1),
        x0 = i0 % cellWidth,
        y0 = i0 / cellWidth | 0,
        x1,
        y1,
        d1,
        open = cells[i1] == null; // opposite not yet part of the maze
        
        if (d0 === N) x1 = x0, y1 = y0 - 1, d1 = S;
        else if (d0 === S) x1 = x0, y1 = y0 + 1, d1 = N;
        else if (d0 === W) x1 = x0 - 1, y1 = y0, d1 = E;
        else x1 = x0 + 1, y1 = y0, d1 = W;
        
        if (open) {
            cells[i0] |= d0, cells[i1] |= d1;
            
            var m = 0;
            if (y1 > 0 && cells[i1 - cellWidth] == null) frontier.push({index: i1, direction: N}), ++m;
            if (y1 < cellHeight - 1 && cells[i1 + cellWidth] == null) frontier.push({index: i1, direction: S}), ++m;
            if (x1 > 0 && cells[i1 - 1] == null) frontier.push({index: i1, direction: W}), ++m;
            if (x1 < cellWidth - 1 && cells[i1 + 1] == null) frontier.push({index: i1, direction: E}), ++m;
            shuffle(frontier, frontier.length - m, frontier.length);
        }
    }
}

function popRandom(array) {
    if (!array.length) return;
    var n = array.length, i = Math.random() * n | 0, t;
    t = array[i], array[i] = array[n - 1], array[n - 1] = t;
    return array.pop();
}

function shuffle(array, i0, i1) {
    var m = i1 - i0, t, i, j;
    while (m) {
        i = Math.random() * m-- | 0;
        t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
}

// d3.select(self.frameElement).style("height", height + "px");

