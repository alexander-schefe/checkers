import {GameInstance, Move, Piece, Color, Settings} from "./Game"

class TreeNode {
    parent: TreeNode | null;
    children: TreeNode[] = [];
    depth: number;
    value: number = 0;
    virtualBoard: VirtualBoard;
    move: Move | null;
    

    constructor (parent: TreeNode | null, depth : number, virtualBoard : VirtualBoard, move : Move | null) {
        this.depth = depth;
        this.parent  = parent;
        this.virtualBoard = virtualBoard;
        this.move = move;
        if(this.parent) this.parent.children.push(this);
    }
}

export class AI {
    gameInstance: GameInstance;
    color: Color;
    tree : TreeNode[]

    constructor(gameInstance: GameInstance, color: Color) {
        this.gameInstance = gameInstance;
        this.color = color;
        this.tree = [];
    }

    generate(depth : number) : (Move | null) {
        if(depth < 0) depth = 0;
        
        const root = new TreeNode(null, -1, new VirtualBoard(this.gameInstance), null);
        this.tree.push(root);

        this.generateTree(depth, depth, root);

        const dir = this.color === Color.White ? 1 : -1;

        //Eval Tree
        for(let i = depth; i >= 0; i--) {
            const nodes = this.tree.filter((n) => {
                return n.depth === i;
            });
            nodes.forEach((n) => {
                if(n.children.length <= 0) {
                    n.value = dir * n.virtualBoard.evaluateBoard();
                }
                else {
                    if(this.color === n.virtualBoard.gameInstance.turn % 2)    {
                        let lowest = Number.MAX_VALUE;
                        n.children.forEach((c) => {
                            if(c.value < lowest) lowest = c.value;
                        });
                        n.value = lowest;
                    }
                    else {
                        let highest = -Number.MAX_VALUE;
                        n.children.forEach((c) => {
                            if(c.value > highest) highest = c.value;
                        });
                        n.value = highest;
                    }
                }
            });
        }
        console.log("checked positions: " + this.tree.length);

        const result = this.tree.filter((n) => {
            return n.depth === 0;
        }).sort((a,b) => {
            return b.value - a.value;
        });

        if(result.length > 0) {
            const moves = result.filter((n) => {
                return n.value === result[0].value;
            });
            if(moves.length > 0) {
                let r = Math.floor(Math.random() * moves.length);
                if(r > moves.length - 1 || r < 0) r = 0;

                const move = this.gameInstance.convertMove(moves[r].move as Move) as Move;
                console.log("chosen move: (x: " + move.from[0] + ", y: " + move.from[1] + ") ==> (x: " + move.to[0] + ", y: " + move.to[1] + ")" );
                return move;
            }
            else return null
        }
        else return null;
    }

    generateTree(depth : number, counter : number, parent : TreeNode) {
        if(counter < 0) return;

        const moves : Move[] = [];

        for(let x = 0; x < parent.virtualBoard.gameInstance.size; x++) {
            for(let y = 0; y < parent.virtualBoard.gameInstance.size; y++) {
                const piece = parent.virtualBoard.gameInstance.board[x][y];
                if(piece !== null && piece.color === parent.virtualBoard.gameInstance.turn % 2) {
                    const pMoves = piece.getAllowedMoves();
                    pMoves.forEach((e) => {
                        moves.push(e);
                    });
                }
            }
        }

        moves.forEach((e) => {
            const virtualBoard = new VirtualBoard(parent.virtualBoard.gameInstance);
            const moveConverted = virtualBoard.gameInstance.convertMove(e);
            if(moveConverted != null) {
                virtualBoard.makeMove(moveConverted);
                const node = new TreeNode(parent, depth - counter, virtualBoard, moveConverted);
                this.tree.push(node);
                this.generateTree(depth, counter - 1, node)
            }
        });
    }
}

class VirtualBoard {
    gameInstance : GameInstance;

    constructor (gameInstance : GameInstance) {
        this.gameInstance = new GameInstance(gameInstance.settings);
        this.initiate(gameInstance.moveHistory);
        this.gameInstance.turn = gameInstance.turn;
        this.gameInstance.size = gameInstance.size;
        if(gameInstance.selectionLock !== null) {
            this.gameInstance.selectionLock = this.gameInstance.convertPiece((gameInstance.selectionLock as Piece).position);
        }
        else this.gameInstance.selectionLock = null;
    }

    initiate (moveHistory : Move[]) {
        moveHistory.forEach((move) => {
            const m = this.gameInstance.convertMove(move);
            if(m !== null) this.gameInstance.makeMove(m as Move);
            else {
                console.error("Error: Move conversion failed!");
                return;
            }
        });
    }

    makeMove (move : Move) {
        const m = this.gameInstance.convertMove(move);
        if(m !== null) this.gameInstance.makeMove(m);
        else console.error("Error: Move could not be made because move === null");
    }

    evaluateBoard () {
        let v = 0;
        for(let x = 0; x < this.gameInstance.size; x++) {
            for(let y = 0; y < this.gameInstance.size; y++) {
                const p = this.gameInstance.board[x][y];
                if (p !== null && p.color === Color.White) {
                    if(p.promoted) v += 3;
                    else v += 1;
                }
                else if (p !== null) {
                    if(p.promoted) v -= 3;
                    else v -= 1;
                }
            }
        }
        return v;
    }
}