from typing import List, Optional
import random

def check_winner(board: List[str]):
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  
        [0, 4, 8], [2, 4, 6]             
    ]
    for state in win_conditions:
        a, b, c = state
        if board[a] and board[a] == board[b] == board[c]:
            return board[a]
    if "" not in board:
        return "draw"
    return None

def available_moves(board: List[str]):
    return [i for i in range(9) if board[i] == ""]


def minimax(board: List[str], ai_symbol: str, depth: int, maximizer: bool) -> int:
    player_symbol = "O" if ai_symbol == "X" else "X"
    winner = check_winner(board)
    
    if winner == ai_symbol:
        return 10
    elif winner == player_symbol:
        return -10
    elif "" not in board or depth == 0:
        return 0
    
    scores = []
    for i in available_moves(board):
        board[i] = ai_symbol if maximizer else player_symbol
        score = minimax(board, ai_symbol, depth-1, not maximizer)
        board[i] = ""
        scores.append((i, score))
        
    best = max if maximizer else min
    return best(scores, key=lambda x: x[1])[1]
        

def best_move( board: List[str], ai_symbol: str, depth: int, turn: bool) -> int:
    
    best_score = -float('inf')
    best_move = -1
    moves = available_moves(board)
    
    if check_winner(board) == "X" or check_winner(board)=="O":
        return best_move
    
    if depth < 3:
        if random.random() < 0.7:
            return random.choice(moves)
    
    for i in moves:
        board[i] = ai_symbol        
        score = minimax(board, ai_symbol, depth-1, not turn)
        noise = random.uniform(-5 + depth, 0)
        score += noise 
        
        board[i] = ""
        if score > best_score:
            best_score = score
            best_move = i
    
    return best_move
