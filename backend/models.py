from typing import List, Optional
from pydantic import BaseModel # type: ignore

class NewGameRequest(BaseModel):
    mode: str
    ai_mode: bool
    depth: Optional[int] = 5

class NewGameResponse(BaseModel):
    player_symbol: str
    your_turn: bool
    board: List[str]
    ai_move: Optional[int] = None
    result: str
    depth: int
    ai_enabled: bool
    mode: str
    move_history: List[int] = []


class MoveRequest(BaseModel):
    board: List[str]
    player_move: int
    player_symbol: str
    ai_enabled: bool
    depth: int
    mode: str
    move_history: List[int] = []