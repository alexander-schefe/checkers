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
    killPositions: number[],
    endTurn: boolean,
}

export type RuleSettings = {
    forceTake: boolean;
    queenInfJump: boolean;
    queenKillMultiple: boolean;
    queenMoveBackwards: boolean;
  }

function newMove(movingPiece: IPiece, pos : number, killPos : number[], endT : boolean) : Move {
    const m : Move = {piece: movingPiece, newPosition: pos, killPositions: killPos, endTurn: endT}
    return m;
}

class GameInstance {
    size : number = 0;
    turn : number = 0;
    moveHistory : [number, number][] = [];
    fieldData : (IPiece | null)[] = [];
    selectionLock : IPiece | null = null;
    rules : RuleSettings;
 
    constructor(size : number, ruleSettings : RuleSettings) {
        this.fieldData = Array(size * size).fill(null);
        this.size = size;
        this.rules = ruleSettings;
    }

    initializeField = () => {
        for(let index = 0; index < this.size * this.size; index++)
        {
            if((index + (Math.floor(index / this.size) % 2 === 0 ? 1 : 0)) % 2 !== 0) continue;
            if(index >= this.size * (this.size / 2 - 1) && index < this.size * (this.size - (this.size / 2 - 1))) continue;

            const col = index < Math.floor(this.size * this.size / 2) ? Color.White : Color.Black;
            this.fieldData[index] = new Checker(index, col, this.rules);
        }
    }

    makeMove = (piece : IPiece, move : Move) => {
        this.moveHistory.push([piece.position, move.newPosition]);
        
        this.fieldData[move.newPosition] = this.fieldData[piece.position];
        move.killPositions.forEach((kp) => {this.fieldData[kp] = null;});
        this.fieldData[piece.position] = null;

        piece.position = move.newPosition;
        if(move.endTurn) {
            this.turn++;
            this.selectionLock = null;
        }
        else if(piece.getPossibleMovePositions(this.fieldData, this.size).filter((e) => e.killPositions.length > 0).length === 0) {
            this.turn++;
            this.selectionLock = null;
        }
        else {
            this.selectionLock = piece;
            console.log("locked on " + piece.position);
        }
        if(Math.floor(move.newPosition / this.size) === this.size - 1 && piece.color === Color.White) piece.queen = true;
        if(Math.floor(move.newPosition / this.size) === 0 && piece.color === Color.Black) piece.queen = true;
    }

    getAllPossibleMoves = (color : Color) : Move[][] => {
        const moves : Move[][] = [];

        this.fieldData.forEach((e) => {
            if(e !== null) {
                const p = e as IPiece;
                if(p.color === color) {
                    const pMoves = p.getPossibleMovePositions(this.fieldData, this.size);
                    moves.push(pMoves);
                }
            } 
        });

        if(this.rules.forceTake || this.selectionLock !== null) {
            const kMoves : Move[][] = [];
            moves.forEach((pMoves) => {
                const kArr : Move[] = pMoves.filter((m) => { return m.killPositions.length > 0});
                if(kArr.length > 0) kMoves.push(kArr);
            });
            if(kMoves.length === 0) {
                return moves;
            }
            else {
                return kMoves;
            }
        }
        else {
            return moves;
        }
    }
}

export interface IPiece {
    rules : RuleSettings,
    position : number,
    color : Color,
    queen : boolean,

    getPossibleMovePositions (field : (IPiece | null)[], size : number) : Move[];
    getAllowedMoves (gameInstance : GameInstance) : Move[];
}

class Checker implements IPiece {
    rules : RuleSettings;
    position : number;
    color : Color;
    queen : boolean = false;

    constructor(position : number, color : Color, rules : RuleSettings) {
        this.position = position;
        this.color = color;
        this.rules = rules;
    }

    getAllowedMoves = (gameInstance : GameInstance) : Move[] => {
        
        const moves = gameInstance.getAllPossibleMoves(this.color);

        const pMoves : Move[] | undefined = moves.find((e) => {
            return e.filter( (m) => { return m.piece.position === this.position}) .length > 0
        });

        if(pMoves !== undefined) return pMoves as Move[];
        else return []
    }

    getPossibleMovePositions = (field : (IPiece | null)[], size : number) : Move[] => {
        
        const moves : Move[] = [];
        
        let pos : number;
        let pos2 : number;
        let piece : IPiece | null;
        const dir = size * (this.color === Color.White ? 1 : -1);
        
        if(!this.queen)
        {
            //Normal Moves 
            pos = this.position + dir - 1;
            if(pos >= 0 && pos < field.length && this.position % size !== 0) {
                if(field[pos] === null) moves.push(newMove(this, pos, [], true));
            }

            pos = this.position + dir + 1;
            if(pos >= 0 && pos < field.length && this.position % size !== size - 1) {
            if(field[pos] === null) moves.push(newMove(this, pos, [], true));
            }

            //Killing Moves
            pos = this.position + dir - 1;
            pos2 = this.position + dir * 2 - 2;
            piece = field[pos];
            if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== 1) {
                if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
            }

            pos = this.position + dir + 1;
            pos2 = this.position + dir * 2 + 2;
            piece = field[pos];
            if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== size - 2) {
                if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
            }
        }
        
        else
        {
            //Normal Moves 
            pos = this.position + dir - 1;
            if(pos >= 0 && pos < field.length && this.position % size !== 0) {
                if(field[pos] === null) moves.push(newMove(this, pos, [], true));
            }

            pos = this.position + dir + 1;
            if(pos >= 0 && pos < field.length && this.position % size !== size - 1) {
            if(field[pos] === null) moves.push(newMove(this, pos, [], true));
            }

            if(this.rules.queenMoveBackwards) {
                pos = this.position - dir - 1;
                if(pos >= 0 && pos < field.length && this.position % size !== 0) {
                    if(field[pos] === null) moves.push(newMove(this, pos, [], true));
                }

                pos = this.position - dir + 1;
                if(pos >= 0 && pos < field.length && this.position % size !== size - 1) {
                    if(field[pos] === null) moves.push(newMove(this, pos, [], true));
                }
            }
            if(!this.rules.queenInfJump) {
                //Killing Moves
                pos = this.position + dir - 1;
                pos2 = this.position + dir * 2 - 2;
                piece = field[pos];
                if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== 1) {
                    if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
                }

                pos = this.position + dir + 1;
                pos2 = this.position + dir * 2 + 2;
                piece = field[pos];
                if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== size - 2) {
                    if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
                }

                pos = this.position - dir - 1;
                pos2 = this.position - dir * 2 - 2;
                piece = field[pos];
                if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== 1) {
                    if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
                }

                pos = this.position - dir + 1;
                pos2 = this.position - dir * 2 + 2;
                piece = field[pos];
                if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length && this.position % size !== size - 2) {
                    if(piece !== null && piece.color !== this.color && field[pos2] === null) moves.push(newMove(this, pos2, [pos], false));
                }
            }
            else {
                const y = Math.floor(this.position / size);
                const x = this.position % size;
                let killArr : number[] = [];

                //x+ y+
                killArr = [];
                for(let i = x + 1; i < size - 1; i++) {
                    const yOff = i - x;
                    if(y + yOff >= size - 1 || y + yOff < 1) break;

                    const p = field[(y + yOff) * size + i]
                    if(p !== null && p.color !== this.color) {
                        pos = p.position;
                        pos2 = p.position + size + 1;
                        piece = field[pos];
                        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length) {
                            if(piece !== null && piece.color !== this.color && field[pos2] === null) {
                                killArr.push(pos);
                                moves.push(newMove(this, pos2, killArr, false));
                                break;
                            }
                        }
                        if(this.rules.queenKillMultiple) {
                            killArr.push(pos);
                        }
                        else {
                            break;
                        }
                    }
                    else if(p !== null && p.color === this.color) {
                        break;
                    }
                }

                //x- y+
                killArr = [];
                for(let i = x - 1; i >= 1; i--) {
                    const yOff = x - i;
                    if(y + yOff >= size - 1 || y + yOff < 1) break;

                    const p = field[(y + yOff) * size + i]
                    if(p !== null && p.color !== this.color) {
                        pos = p.position;
                        pos2 = p.position + size - 1;
                        piece = field[pos];
                        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length) {
                            if(piece !== null && piece.color !== this.color && field[pos2] === null) {
                                killArr.push(pos);
                                moves.push(newMove(this, pos2, killArr, false));
                                break;
                            }
                        }
                        if(this.rules.queenKillMultiple) {
                            killArr.push(pos);
                        }
                        else {
                            break;
                        }
                    }
                    else if(p !== null && p.color === this.color) {
                        break;
                    }
                }

                //x+ y-
                killArr = [];
                for(let i = x + 1; i < size - 1; i++) {
                    const yOff = x - i;
                    if(y + yOff >= size - 1 || y + yOff < 1) break;

                    const p = field[(y + yOff) * size + i]
                    if(p !== null && p.color !== this.color) {
                        pos = p.position;
                        pos2 = p.position - size + 1;
                        piece = field[pos];
                        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length) {
                            if(piece !== null && piece.color !== this.color && field[pos2] === null) {
                                killArr.push(pos);
                                moves.push(newMove(this, pos2, killArr, false));
                                break;
                            }
                        }
                        if(this.rules.queenKillMultiple) {
                            killArr.push(pos);
                        }
                        else {
                            break;
                        }
                    }
                    else if(p !== null && p.color === this.color) {
                        break;
                    }
                }

                //x- y-
                killArr = [];
                for(let i = x - 1; i >= 1; i--) {
                    const yOff = i - x;
                    if(y + yOff >= size - 1 || y + yOff < 1) break;

                    const p = field[(y + yOff) * size + i]
                    if(p !== null && p.color !== this.color) {
                        pos = p.position;
                        pos2 = p.position - size - 1;
                        piece = field[pos];
                        if(pos >= 0 && pos < field.length && pos2 >= 0 && pos2 < field.length) {
                            if(piece !== null && piece.color !== this.color && field[pos2] === null) {
                                killArr.push(pos);
                                moves.push(newMove(this, pos2, killArr, false));
                                break;
                            }
                        }
                        if(this.rules.queenKillMultiple) {
                            killArr.push(pos);
                        }
                        else {
                            break;
                        }
                    }
                    else if(p !== null && p.color === this.color) {
                        break;
                    }
                }
            }
        }

        return moves;
    }
}


export default GameInstance;
