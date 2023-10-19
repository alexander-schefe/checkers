import React from 'react';
import './App.css';
import GameInstance from "./Game"
import {IPiece, Color} from "./Game"

function App() {
  const size = 8;

  const running = React.useRef(false);
  const oldTime = React.useRef(0);
  const t = React.useRef(0);

  const gameInstance = React.useRef(new GameInstance(size));

  const selectedPiece = React.useRef(-1);

  const useFrameTime = () => {
    const [frameTime, setFrameTime] = React.useState(performance.now());
    React.useEffect(() => {
      let frameId: number;
      const frame = (time : number) => {
        setFrameTime(time);
        frameId = requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      return () => cancelAnimationFrame(frameId);
    }, []);

    return frameTime;
  };
  
  const Game = () => {
    document.title = "Checkers - by Alexander";
    const frameTime = useFrameTime();
    update(frameTime);
    return (
      <section className="Holder">
        <Title />
        <div className="Game" style={{border: "2px " + (gameInstance.current.turn % 2 === 0 ? "#FB6161" : "#61dafb") + " solid"}}>
        
        <Board/>
      </div>
      </section>
    );
  }

  const Board = () => {
    const arr = [...Array(size * size)].map((x, i) => {
      const sPiece = selectedPiece.current !== -1 ? gameInstance.current.fieldData[selectedPiece.current] : null;
      
      const pieceStyle = {
        backgroundColor: getPieceColor(i),
      }
      const movementSelectorStyle = {
        display: sPiece !== null ? (sPiece.getAllowedMoves(gameInstance.current).filter((e) => { return e.newPosition === i}).length > 0 ? "block" : "none") : "none",
        PointerEvent: "none",
      }
      return (<div key={i} className={"Cell Cell" + ((i + (Math.floor(i / size) % 2 === 0 ? 1 : 0)) % 2 === 0 ? "Even" : "Odd")}>
        <div className="Piece" style={pieceStyle} onClick={e => onClickPiece(i)}>
          <div className="MoveSelector" style={movementSelectorStyle}></div>
        </div>
      </div>)
    })
    const boardStyle = {
      gridTemplateColumns: (size.toString() + "fr ").repeat(size),
    }
    return (
      <div className="Board" style={boardStyle}>
        {arr}
      </div>
    );
  }

  const getPieceColor = (i : number) => {
    const colNWhite = "#FB6161";
    const colNBlack = "#61dafb";
    const colKWhite = "#d32469";
    const colKBlack = "#53F2D6";
    let col = gameInstance.current.fieldData[i] === null ? "" : (gameInstance.current.fieldData[i]?.color === 0 ? (gameInstance.current.fieldData[i]?.king ? colKWhite : colNWhite) : (gameInstance.current.fieldData[i]?.king ? colKBlack : colNBlack));
    return col;
  }

  const onClickPiece = (i : number) => {
    const piece = gameInstance.current.fieldData[i];

    if(piece !== null && gameInstance.current.selectionLock !== null && piece !== gameInstance.current.selectionLock) {
      gameInstance.current.turn++;
      gameInstance.current.selectionLock = null;
      selectedPiece.current = -1;
      return;
    }

    if(piece !== null) {
      if (piece.color !== (gameInstance.current.turn % 2 === 0 ? Color.White : Color.Black)) return;
      console.log("Selected P." + i.toString() + ", " + (piece.color === 0 ? "White" : "Black") + ", king: " + piece.king);
      selectedPiece.current = i;
      console.log(piece.getAllowedMoves(gameInstance.current));
      return;
    }
    else if(selectedPiece.current !== -1) {
      if(gameInstance.current.fieldData[selectedPiece.current] !== null) {
        const sp = gameInstance.current.fieldData[selectedPiece.current] as IPiece;
        const m = sp.getAllowedMoves(gameInstance.current);
        const poss = m.filter((e) => {
          return e.newPosition === i;
        });
        if(poss?.length > 0) {
          gameInstance.current.makeMove(sp, poss[0]);
          if(poss[0].endTurn) selectedPiece.current = -1;
          else onClickPiece(poss[0].newPosition);
        }
      }
    }
  }

  const startGame = React.useCallback(() => {
    console.log("starting game...");
    running.current = true;
    gameInstance.current = new GameInstance(size);
    gameInstance.current.initializeField();
    gameInstance.current.turn = 1;
    selectedPiece.current = -1;
  }, []);
  
  const stopGame = React.useCallback(() => {
    console.log("resetting game...");
    running.current = false;
    gameInstance.current = new GameInstance(size);
    gameInstance.current.turn = 1;
    selectedPiece.current = -1;
  }, []);

  const update = React.useCallback((frameTime : number) => {
    const deltaTime = (frameTime - oldTime.current) / 1000;
    oldTime.current = frameTime;
    t.current += deltaTime;

    if(!running.current) return;
    
    //CODE FOR UPDATE HERE
    
    Title();

  }, []);

  const Title = () => {
    return (
      <h1 className="Title" style={{color: (gameInstance.current.turn % 2 === 0 ? "#FB6161" :  "#61dafb")}}>
          Checkers
      </h1>
    );
  }
  
  return (
    <div className="App">
      <div className="Body">
        <Game />
      </div>
      <div className="Footer">
        <div className="Buttons">
          <button className="Button" onClick={startGame}>
            Start Game
          </button>
          <button  className="Button" onClick={stopGame}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
