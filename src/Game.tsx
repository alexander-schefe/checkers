export enum Color {
    "White",
    "Black",
}

export type Settings = {
    boardSize: number;
    forcedTake: boolean,
    queenUnlimitedJumpDistance: boolean;
    queenKillMultiple: boolean;
    queenMoveBackwards: boolean;
}

export class Move {
    piece: Piece;
    to: [number, number];
    kills: Piece[];
    endTurn: boolean;

    constructor (piece : Piece, to: [number, number], kills: Piece[], endTurn: boolean) {
        this.piece = piece;
        this.to = to;
        this.kills = kills;
        this.endTurn = endTurn;
    }
}

export class GameInstance {
    settings: Settings;
    turn: number;
    board: (Piece | null)[][];
    selectionLock: Piece | null;
    size: number;

    constructor (settings: Settings) {
       this.settings = settings;
       this.turn = Math.random() < 0.5 ? 0 : 1;
       this.board = [];
       this.selectionLock = null;
       this.size = settings.boardSize;
       this.initializeField();
    }

    getCellColor (position: [number, number]) : Color {
        //Get the Color of a cell depending of it's position in a grid
        const x = position[0];
        const y = position[1];
        return (x + y) % 2 === 0 ? Color.Black : Color.White;
    }

    initializeField () {
        //Fills the Array with null
        this.board = [];
        for(let x = 0; x < this.size; x++)
        {
            const arr = []
            for(let y = 0; y < this.size; y++)
            {
                arr.push(null);
            }
            this.board.push(arr);
        }

        //Populates the Array with Pieces
        for(let x = 0; x < this.size; x++)
        {
            for(let y = 0; y < this.size; y++)
            {
                if(this.getCellColor([x, y]) === Color.White) {
                    this.board[x][y] = null;
                }
                else {
                    if(y >= this.size / 2 - 1 && y < this.size / 2 + 1) {
                        this.board[x][y] = null;
                    }
                    else {
                        const color = y < this.size / 2 ? Color.White : Color.Black;
                        this.board[x][y] = new Piece(this, color, [x, y], false);
                    }
                }
            }
        }
    }

    makeMove (move: Move) {
        //Actually carries out a move and updates every required variable
        const from = move.piece.position;
        const to = move.to;
        const piece = move.piece;

        //Moves the piece and updates the board and the piece
        this.board[to[0]][to[1]] = this.board[from[0]][from[1]];
        piece.position = to;
        this.board[from[0]][from[1]] = null;
        move.kills.forEach((kill) => {this.board[kill.position[0]][kill.position[1]] = null;});

        //Checks if current turn should end
        console.log("kill possible: " + piece.killMovePossible());
        if(move.endTurn || !piece.killMovePossible()) {
            this.turn++;
            this.selectionLock = null;
        }
        else {
            this.selectionLock = piece;
            console.log("locked on " + piece.position);
        }

        //Checks for Promotion
        console.log("to:" + to.toString());
        if (to[1] === piece.game.size - 1 && piece.color === Color.White) {
            piece.promoted = true;
        }
        if (to[1] === 0 && piece.color === Color.Black) {
            piece.promoted = true;
        }
    }

    killMovePossible (color: Color) {
        //Checks if any piece of the desired Color could possibly kill an oponents's piece
        for(let x = 0; x < this.size; x++)
        {
            for(let y = 0; y < this.size; y++)
            {
                if(this.board[x][y] !== null) {
                    const piece = this.board[x][y] as Piece;
                    if(piece.color === color && piece.killMovePossible()) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    getAllPiecesBetween (from: [number, number], to: [number, number]) {
        const arr : (Piece | null)[] = [];

        //Gets all Cells between two points on a diagonal, returns [] if not diagonal
        if(Math.abs(from[0] - to[0]) !== Math.abs(from[1] - to[1])) return arr;
        else {
            const dirX = Math.sign(to[0] - from[0]);
            const dirY = Math.sign(to[1] - from[1]);
            
            for(let i = 1; i <= Math.abs(to[0] - from[0]) - 1; i++) {
                const x = from[0] + i * dirX;
                const y = from[1] + i * dirY;
                const cell = this.board[x][y];
                if(cell !== null) arr.push(cell);
                else arr.push(null);
            }
            return arr;
        }
    }
}

export class Piece {
    game: GameInstance;
    color: Color;
    position: [number, number];
    promoted: boolean;

    constructor (game: GameInstance, color: Color, position: [number, number], promoted: boolean) {
        this.game = game;
        this.color = color;
        this.position = position;
        this.promoted = promoted;
    }

    getMoves () {
        //Get all moves a piece can possibly perform
        const moves : Move[] = [];
        let move : Move | null;
        const x = this.position[0];
        const y = this.position[1];
        const dir = this.color === Color.White ? 1 : -1

        //Normal Moves
        //F L
        move = this.CheckMoveViability(new Move(this, [x - 1, y + dir], [] , true));
        if(move !== null) moves.push(move as Move);

        //F R
        move = this.CheckMoveViability(new Move(this, [x + 1, y + dir], [] , true));
        if(move !== null) moves.push(move as Move);

        if(this.promoted) {
            if(this.game.settings.queenMoveBackwards) {
                //B L
                move = this.CheckMoveViability(new Move(this, [x - 1, y - dir], [] , true));
                if(move !== null) moves.push(move as Move);

                //B R
                move = this.CheckMoveViability(new Move(this, [x + 1, y - dir], [] , true));
                if(move !== null) moves.push(move as Move);
            }

            if(this.game.settings.queenUnlimitedJumpDistance) {
                //Kill F L
                move = this.getQueenMove([-1, 1]);
                if(move != null) moves.push(move as Move);

                //Kill F R
                move = this.getQueenMove([1, 1]);
                if(move != null) moves.push(move as Move);

                //Kill B L
                move = this.getQueenMove([-1, -1]);
                if(move != null) moves.push(move as Move);

                //Kill B R
                move = this.getQueenMove([1, -1]);
                if(move != null) moves.push(move as Move);
            }
            else {
                //Kill F L
                move = this.CheckMoveViability(new Move(this, [x - 2, y + dir * 2], [] , false));
                if(move !== null) moves.push(move as Move);

                //Kill F R
                move = this.CheckMoveViability(new Move(this, [x + 2, y + dir * 2], [] , false));
                if(move !== null) moves.push(move as Move);
                
                //Kill B L
                move = this.CheckMoveViability(new Move(this, [x - 2, y - dir * 2], [] , false));
                if(move !== null) moves.push(move as Move);

                //Kill B R
                move = this.CheckMoveViability(new Move(this, [x + 2, y - dir * 2], [] , false));
                if(move !== null) moves.push(move as Move);
            }
        }
        else {
            //Kill F L
            move = this.CheckMoveViability(new Move(this, [x - 2, y + dir * 2], [] , false));
            if(move !== null) moves.push(move as Move);

            //Kill F R
            move = this.CheckMoveViability(new Move(this, [x + 2, y + dir * 2], [] , false));
            if(move !== null) moves.push(move as Move);
        }

        return moves;
    }

    getQueenMove(dir : [number, number]) : Move | null {
        //Get a move that conforms with the rules for the movement of promoted pieces
        const x = this.position[0];
        const y = this.position[1];
        let firstPiece : Piece | null = null;
        const kills : Piece[] = [];

        for(let i = 1; i < this.game.size; i++) {
            const ix = x + i * dir[0];
            const iy = y+ i * dir[1];

            //breaks if edge is reached
            if(ix < 0 || ix >= this.game.size || iy < 0 || iy >= this.game.size) {
                break;
            }

            if(firstPiece !== null) {
                if(this.game.settings.queenKillMultiple) {
                    if(this.game.board[ix][iy] !== null) {
                        kills.push(this.game.board[ix][iy] as Piece);
                    }
                    else return this.CheckMoveViability(new Move(this, [ix, iy], kills, false));
                }
                else return this.CheckMoveViability(new Move(this, [ix, iy], kills, false));
            }

            if(this.game.board[ix][iy] !== null && firstPiece === null) {
                firstPiece = this.game.board[ix][iy] as Piece;
                if(firstPiece.color === this.color) {
                    break;
                }
                else {
                    kills.push(firstPiece as Piece);
                }
            }
        }

        return null;
    }

    CheckMoveViability(move : Move) : Move | null {
        //Checks if a given moves violates any rules
        let jumps : (Piece | null)[] = [];
        let kills : Piece[] = [];

        //Check if landing spot is in bounds
        if(move.to[0] < 0 || move.to[0] >= this.game.size || move.to[1] < 0 || move.to[1] >= this.game.size) return null;

        //Check if landing spot is available
        if(this.game.board[move.to[0]][move.to[1]] !== null) return null;

        jumps = this.game.getAllPiecesBetween(move.piece.position, move.to);
        //console.log("move: from: " + move.piece.position.toString() + ", to: " + move.to.toString() + ", jumps: " + jumps.length.toString());
        if(jumps.length > 0) {
            kills = jumps.filter((e) => { return e !== null; }) as Piece[];

            //Checks if at least one piece is killed
            if(kills.length === 0) return null

            //Checks if only pieces of the opposite color are jumped
            if(kills.filter((e) => { return e.color === move.piece.color }).length > 0) return null;

            //Check if the last jumped cell is occupied
            if(jumps[jumps.length - 1] === null) return null;

            //Checks if jump would go over an empty cell after crossing an occupied cell before
            const result = jumps.find((e) => { return e !== null });
            const firstPiece = typeof result !== "undefined" ? result as Piece : null;
            if(firstPiece === null) return null;
            if(jumps.slice(jumps.indexOf(firstPiece)).filter((e) => { return e === null }).length > 0) return null;
            
            //Checks that only one piece can be jumped if that rule is applied
            if(!this.game.settings.queenKillMultiple) {
                if(jumps.slice(jumps.indexOf(firstPiece)).filter((e) => { return e !== null }).length > 1) return null;
            }
        }
        
        return new Move(move.piece, move.to, kills, move.endTurn);
    }

    getAllowedMoves () {
        //Returns all moves for the piece that it is actually allowed to take (e. g. for the forcedTake rule)
        const killPossible = this.game.killMovePossible(this.color);
        if(this.game.turn % 2 !== this.color || (this.game.selectionLock !== null && this.game.selectionLock !== this)) {
            return [];
        }
        else if(this.game.selectionLock === this) {
            return this.getMoves().filter((m) => {
                return m.kills.length > 0;
            });
        }
        else {
            if((this.game.settings.forcedTake && killPossible))
            {
                return this.getMoves().filter((m) => {
                    return m.kills.length > 0;
                });
            }
            else return this.getMoves();
        }
    }

    killMovePossible () {
        //Checks if the piece can take an opponent's piece
        return this.getMoves().filter((m) => {return m.kills.length > 0}).length > 0;
    }
}