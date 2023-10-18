import React from 'react';
import './App.css';
import { setSelectionRange } from '@testing-library/user-event/dist/utils';

export enum Color {
    "White",
    "Black"
}

type Move = {
    newPosition: number,
    killPosition: number | null,
    endTurn: boolean,
}

function newMove(pos : number, killPos : number | null, endT : boolean) : Move {
    const m : Move = {newPosition: pos, killPosition: killPos, endTurn: endT}
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
            if(index >= this.size * 3 && index < this.size * (this.size - 3)) continue;

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
    }
}

export interface IPiece {
    position : number,
    color : Color,

    getPossibleMovePositions (field : (IPiece | null)[], size : number) : Move[];
}

class Checker implements IPiece {
    position : number = 0;
    color : Color = Color.White;

    constructor(position : number, color : Color) {
        this.position = position;
        this.color = color;
    }

    getPossibleMovePositions = (field : (IPiece | null)[], size : number) : Move[] => {
        const moves : Move[] = [];
        let pos : number;
        let pos2 : number;
        let piece : IPiece | null;
        const dir = size * (this.color === Color.White ? 1 : -1);

        pos = this.position + dir - 1;
        if(pos >= 0 && pos < field.length && this.position % size !== 0) {
            if(field[pos] === null) moves.push(newMove(pos, null, true));
        }

        pos = this.position + dir + 1;
        if(pos >= 0 && pos < field.length && this.position % size !== size - 1) {
            if(field[pos] === null) moves.push(newMove(pos, null, true));
        }

        pos = this.position + dir - 1;
        pos2 = this.position + dir * 2 - 2;
        piece = field[pos];
        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== 1) {
            if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(pos2, pos, false));
        }

        pos = this.position + dir + 1;
        pos2 = this.position + dir * 2 + 2;
        piece = field[pos];
        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== size - 2) {
            if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(pos2, pos, false));
        }
        return moves;
    }
}


export default GameInstance;
