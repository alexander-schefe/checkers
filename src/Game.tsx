import React from 'react';
import './App.css';
import { setSelectionRange } from '@testing-library/user-event/dist/utils';

export enum Color {
    "White",
    "Black"
}

type Move = {
    piece: IPiece;
    newPosition: number,
    killPosition: number | null,
    endTurn: boolean,
}

function newMove(movingPiece: IPiece, pos : number, killPos : number | null, endT : boolean) : Move {
    const m : Move = {piece: movingPiece, newPosition: pos, killPosition: killPos, endTurn: endT}
    return m;
}

class GameInstance {
    size : number = 0;
    turn : number = 0;
    moveHistory : [number, number][] = [];
    fieldData : (IPiece | null)[] = [];
    selectionLock : IPiece | null = null;
 
    constructor(size : number) {
        this.fieldData = Array(size * size).fill(null);
        this.size = size;
    }

    initializeField = () => {
        for(let index = 0; index < this.size * this.size; index++)
        {
            if((index + (Math.floor(index / this.size) % 2 === 0 ? 1 : 0)) % 2 !== 0) continue;
            if(index >= this.size * (this.size / 2 - 1) && index < this.size * (this.size - (this.size / 2 - 1))) continue;

            const col = index < Math.floor(this.size * this.size / 2) ? Color.White : Color.Black;
            this.fieldData[index] = new Checker(index, col);
        }
    }

    makeMove = (piece : IPiece, move : Move) => {
        this.moveHistory.push([piece.position, move.newPosition]);
        if(typeof move.killPosition === "number") {
            this.fieldData[move.newPosition] = this.fieldData[piece.position];
            this.fieldData[move.killPosition] = null;
            this.fieldData[piece.position] = null;
        }
        else {
            this.fieldData[move.newPosition] = this.fieldData[piece.position];
            this.fieldData[piece.position] = null;
        }
        piece.position = move.newPosition;
        if(move.endTurn) {
            this.turn++;
            this.selectionLock = null;
        }
        else if(piece.getPossibleMovePositions(this.fieldData, this.size).filter((e) => e.killPosition !== null).length === 0) {
            this.turn++;
            this.selectionLock = null;
        }
        else {
            this.selectionLock = piece;
            console.log("locked on " + piece.position);
        }
        if(Math.floor(move.newPosition / this.size) === 7 && piece.color === Color.White) piece.king = true;
        if(Math.floor(move.newPosition / this.size) === 0 && piece.color === Color.Black) piece.king = true;
    }

    getAllPossibleMoves = (color : Color) : Move[][] => {
        const moves : Move[][] = [];
        const killPossible = false;

        this.fieldData.forEach((e) => {
            if(e !== null) {
                const p = e as IPiece;
                if(p.color === color) {
                    const pMoves = p.getPossibleMovePositions(this.fieldData, this.size);
                    moves.push(pMoves);
                }
            } 
        });

        const kMoves : Move[][] = [];
        moves.forEach((pMoves) => {
            const kArr : Move[] = pMoves.filter((m) => { return m.killPosition !== null });
            if(kArr.length > 0) kMoves.push(kArr);
        });

        if(kMoves.length === 0) {
            return moves;
        }

        else {
            return kMoves;
        }
    }
}

export interface IPiece {
    position : number,
    color : Color,
    king : boolean,

    getPossibleMovePositions (field : (IPiece | null)[], size : number) : Move[];
    getAllowedMoves (gameInstance : GameInstance) : Move[];
}

class Checker implements IPiece {
    position : number = 0;
    color : Color = Color.White;
    king : boolean = false;

    constructor(position : number, color : Color) {
        this.position = position;
        this.color = color;
    }

    getPossibleMovePositions = (field : (IPiece | null)[], size : number) : Move[] => {
        
        const moves : Move[] = this.getMovesInDir(field, size, 1);

        if(this.king) {
            const moves2 : Move[] = this.getMovesInDir(field, size, -1);
            moves2.forEach((e) => moves.push(e));
        }

        return moves;
    }

    getAllowedMoves = (gameInstance : GameInstance) : Move[] => {
        
        const moves = gameInstance.getAllPossibleMoves(this.color);

        const pMoves : Move[] | undefined = moves.find((e) => {
            return e.filter( (m) => { return m.piece.position === this.position}) .length > 0
        });
        
        /* console.log("all possible moves: ");
        console.log(moves);*/

        if(pMoves !== undefined) return pMoves as Move[];
        else return []
    }

    getMovesInDir = (field : (IPiece | null)[],size : number, direction : number) : Move[] => {
        const moves : Move[] = [];
        
        let pos : number;
        let pos2 : number;
        let piece : IPiece | null;
        const dir = direction * size * (this.color === Color.White ? 1 : -1);

        //Killing Moves
        pos = this.position + dir - 1;
        pos2 = this.position + dir * 2 - 2;
        piece = field[pos];
        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== 1) {
            if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, pos, false));
        }

        pos = this.position + dir + 1;
        pos2 = this.position + dir * 2 + 2;
        piece = field[pos];
        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== size - 2) {
            if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, pos, false));
        }

        //Normal Moves 
        pos = this.position + dir - 1;
        if(pos >= 0 && pos < field.length && this.position % size !== 0) {
            if(field[pos] === null) moves.push(newMove(this, pos, null, true));
        }

        pos = this.position + dir + 1;
        if(pos >= 0 && pos < field.length && this.position % size !== size - 1) {
            if(field[pos] === null) moves.push(newMove(this, pos, null, true));
        }

        return moves;
    }
}


export default GameInstance;
