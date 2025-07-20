from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
from models import *
from util import *
from dotenv import load_dotenv
import os

load_dotenv()
FRONTEND_URL = os.environ["FRONTEND_URL"]

app = FastAPI()

origins = [FRONTEND_URL, "http://localhost", "http://localhost:5000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/new_game", response_model=NewGameResponse)
def new_game(req: NewGameRequest):
    board = [""] * 9
    player_symbol = random.choice(["X", "O"])
    move_history = []
    ai_move = None
    
    depth = req.depth if req.depth is not None else 0
    
    if req.ai_mode and player_symbol == "O":
        ai_move = best_move(board, "X", depth, turn=True)
        if ai_move is not None and ai_move != -1:
            board[ai_move] = "X"
            move_history.append(ai_move)

    result = check_winner(board) or "in_progress"
    your_turn = True

    depth = min(depth, len(available_moves(board)))
    
    return NewGameResponse(
        player_symbol=player_symbol,
        your_turn=your_turn,
        board=board,
        ai_move=ai_move,
        result=result,
        depth=depth,
        ai_enabled=req.ai_mode,
        mode=req.mode,
        move_history=move_history if req.mode == "decay" else [],
    )   

@app.post("/make_move", response_model=NewGameResponse)
def make_move(req: MoveRequest):
    board = req.board[:]

    if board[req.player_move] != "":
        return NewGameResponse(
            player_symbol=req.player_symbol,
            your_turn=True,
            board=board,
            ai_move=None,
            result=check_winner(board) or "in_progress",
            depth=req.depth,
            ai_enabled=req.ai_enabled,
            mode=req.mode,
            move_history=req.move_history
        )

    if req.mode == "decay":
        move_history = req.move_history.copy()
    else:
        move_history = []

    # Player move
    board[req.player_move] = req.player_symbol
    if req.mode == "decay":
        move_history.append(req.player_move)
        if len(move_history) > 6:
            old_move = move_history.pop(0)
            board[old_move] = ""

    result = check_winner(board)
    ai_move = None

    if result is None and req.ai_enabled:
        ai_symbol = "O" if req.player_symbol == "X" else "X"
        ai_move = best_move(board, ai_symbol, req.depth, True)
        if ai_move != -1:
            board[ai_move] = ai_symbol
            if req.mode == "decay":
                move_history.append(ai_move)
                if len(move_history) > 6:
                    old_move = move_history.pop(0)
                    board[old_move] = ""
        result = check_winner(board)

    if result is None:
        result = "in_progress"

    req.depth = min(req.depth, len(available_moves(board)))
    
    return NewGameResponse(
        player_symbol=req.player_symbol,
        your_turn=(result == "in_progress"),
        board=board,
        ai_move=ai_move,
        result=result,
        depth=req.depth,
        ai_enabled=req.ai_enabled,
        mode=req.mode,
        move_history=move_history if req.mode == "decay" else []
    )
