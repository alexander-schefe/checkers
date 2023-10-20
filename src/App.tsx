import React, { MutableRefObject } from 'react';
import Switch from "react-switch";
import './App.css';
import {GameInstance, Piece, Color, Settings} from "./Game"
import settingsLogo from "./settingsLogo.png";

function App() {
  const running = React.useRef(false);

  const selectedPiece : MutableRefObject<Piece | null> = React.useRef(null);

  const boardSize = React.useRef(8);
  const setting1 = React.useRef(true);
  const setting2 = React.useRef(true);
  const setting3 = React.useRef(true);
  const setting4 = React.useRef(false);

  const showSettings = React.useRef(false);

  const createSettings = () : Settings => {
    return {
      boardSize : boardSize.current,
      forcedTake : setting1.current,
      queenUnlimitedJumpDistance : setting2.current,
      queenKillMultiple: setting3.current,
      queenMoveBackwards: setting4.current,
    };
  }

  const gameInstance = React.useRef(new GameInstance(createSettings()));

  const size = () => {
    return gameInstance.current.size;
  };

  //Allows components to update each frame (I think)
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

  //Starts the Game and applies Settings
  const startGame = React.useCallback(() => {
    console.log("starting game with settings: ");
    console.log(createSettings());
    running.current = true;
    gameInstance.current = new GameInstance(createSettings());
    selectedPiece.current = null;
  }, []);

  //Returns the actual Hex color a piece should have
  const getPieceColor = (position : [number, number]) => {
    const colNWhite = "#FB6161";
    const colNBlack = "#61dafb";
    const colKWhite = "#d32469";
    const colKBlack = "#53F2D6";
    const p = gameInstance.current.board[position[0]][position[1]];
    let col = p === null ? "#00000000" : (p?.color === 0 ? (p?.promoted ? colKWhite : colNWhite) : (p?.promoted ? colKBlack : colNBlack));
    return col;
  }

  //Handles what happens when you click on a piece
  const onClickPiece = (position : [number, number]) => {
    const piece = gameInstance.current.board[position[0]][position[1]];

    //Cancels a followup jump on click if forcedTake is disabled
    if(!gameInstance.current.settings.forcedTake && piece !== null && gameInstance.current.selectionLock !== null && piece !== gameInstance.current.selectionLock) {
      gameInstance.current.turn++;
      gameInstance.current.selectionLock = null;
      selectedPiece.current = null;
      return;
    }

    //Selects a piece when an actual piece gets clicked
    if(piece !== null) {
      if (piece.color !== (gameInstance.current.turn % 2 === 0 ? Color.White : Color.Black)) return;
      console.log("Selected P." + position.toString() + ", " + (piece.color === 0 ? "White" : "Black") + ", queen: " + piece.promoted);
      console.log(piece.getAllowedMoves());
      selectedPiece.current = piece;
      return;
    }
    //Does Move when an empty cell gets clicked and the selectedPiece can move there
    else if(selectedPiece.current !== null) {
      if(gameInstance.current.board[selectedPiece.current.position[0]][selectedPiece.current.position[1]] !== null) {
        const sp = gameInstance.current.board[selectedPiece.current.position[0]][selectedPiece.current.position[1]] as Piece;
        const m = sp.getAllowedMoves();
        const poss = m.filter((e) => {
          return e.to[0] === position[0] && e.to[1] === position[1];
        });
        if(poss?.length > 0) {
          gameInstance.current.makeMove(poss[0]);
          if(poss[0].endTurn) selectedPiece.current = null;
          else onClickPiece(poss[0].to);
        }
      }
    }
  }

  const Game = () => {
    document.title = "Checkers - by Alexander";
    useFrameTime();

    return (
      <section className="Holder">
        <Title />
        <div className="Game" style={{border: "2px " + (gameInstance.current.turn % 2 === 0 ? "#FB6161" : "#61dafb") + " solid"}}>
          <Board/>
        </div>
        <Settings/>
      </section>
    );
  }

  const Board = () => {
    let arr = [];
    //Generates a grid of divs for the board (checkerboard)
    for(let y = 0; y < size(); y++) {
      for(let x = 0; x < size(); x++) {
        const pieceStyle = {
          backgroundColor: getPieceColor([x, y]),
          opacity: gameInstance.current.board[x][y] !== null ? ((gameInstance.current.board[x][y] as Piece).getAllowedMoves().length > 0 ? "100%" : "60%") : "100%",
          outline: (gameInstance.current.board[x][y] === selectedPiece.current && selectedPiece.current !== null) ? "2px white solid" : "",
          
        }
        const movementSelectorStyle = {
          display: selectedPiece.current !== null ? (selectedPiece.current.getAllowedMoves().filter((e) => { return e.to[0] === x && e.to[1] === y}).length > 0 ? "block" : "none") : "none",
          PointerEvent: "none",
        }
        arr.push (<div key={x + y * size()} className={"Cell Cell" + ((x + y) % 2 === 0 ? "Even" : "Odd")}>
          <div className={"Piece" + (gameInstance.current.board[x][y] === null ? " NoHover" : "")} style={pieceStyle} onClick={e => onClickPiece([x, y])}>
            <div className="MoveSelector" style={movementSelectorStyle}></div>
          </div>
        </div>);
      }
    }

    const boardStyle = {
      gridTemplateColumns: (size().toString() + "fr ").repeat(size()),
    }
    return (
      <div className="Board" style={boardStyle}>
        {arr}
      </div>
    );
  }

  const Title = () => {
    return (
      <h1 className="Title" style={{color: (gameInstance.current.turn % 2 === 0 ? "#FB6161" :  "#61dafb")}}>
          Checkers
      </h1>
    );
  }

  const SettingSwitch = (props : {id : string, labelText : string, checkedVar : MutableRefObject<boolean>}) => {
    return (
      <div className="Setting">
        <Switch 
          id={props.id} className="SettingSwitch"
          height={35} width={75}
          uncheckedIcon={false} checkedIcon={false}
          onHandleColor="#fff" offHandleColor="#fff" onColor="#61dafb" offColor="#282c34"
          onChange={(e) => {props.checkedVar.current = e}}
          checked={props.checkedVar.current}
        />
        <p>{props.labelText}</p>
      </div>
    );
  }

  const Settings = () => {
    return (
      <div className="Settings" style={{display: showSettings.current ? "block" : "none"}}>
        <div className="SettingsTitle"><h3>Rule Settings</h3><p style={{fontSize: "15px", color: "#aaa"}}>{"(will only apply after resetting)"}</p></div>
        <div className="SettingsGrid">
          <div className="Setting">
              <p id="SizeNumber">{boardSize.current}</p>
              <div className="MinusButton" onClick={() => {boardSize.current += boardSize.current >= 8 ? -2 : 0;}}><p>-</p></div>
              <div className="PlusButton" onClick={() => {boardSize.current += boardSize.current <= 12 ? 2 : 0;}}><p>+</p></div>
          </div>
          <SettingSwitch id="sw1" labelText="ForceTake" checkedVar={setting1}/>
          <SettingSwitch id="sw2" labelText="Unlimit the Queen's jumping distance" checkedVar={setting2}/>
          <SettingSwitch id="sw3" labelText="Allow Queen to kill multiple in single jump" checkedVar={setting3}/>
          <SettingSwitch id="sw4" labelText="Allow Queen to move backwards without kill" checkedVar={setting4}/>
        </div>
      </div>
    )
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
        </div>
      </div>
      <button id="SettingsButton" onClick={() => {showSettings.current = !showSettings.current;}}>
        <img src={settingsLogo} id="SettingsLogo"/>
      </button>
    </div>
  );
}

export default App;