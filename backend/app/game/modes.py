"""
Game mode definitions.

Each mode defines:
  - How songs are selected
  - How clips are played
  - How hints are revealed
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class GameModeConfig:
    name: str
    description: str
    clip_duration: int           # seconds of audio to play
    reveal_hints: bool           # whether to gradually reveal info
    hint_type: Optional[str]     # "lyrics", "artist", "year", None
    auto_reveal_after: int       # seconds after which song is revealed
    points_multiplier: float     # score multiplier for this mode


CLASSIC_RUSH = GameModeConfig(
    name="classic_rush",
    description="Guess the song from the intro — faster is better",
    clip_duration=15,
    reveal_hints=False,
    hint_type=None,
    auto_reveal_after=20,
    points_multiplier=1.0,
)

LYRIC_CLUES = GameModeConfig(
    name="lyric_clues",
    description="Lyrics revealed one line at a time",
    clip_duration=30,
    reveal_hints=True,
    hint_type="lyrics",
    auto_reveal_after=25,
    points_multiplier=1.5,
)

SPEED_ROUND = GameModeConfig(
    name="speed_round",
    description="0.5-second audio snippets only",
    clip_duration=1,
    reveal_hints=False,
    hint_type=None,
    auto_reveal_after=10,
    points_multiplier=2.0,
)

MODE_REGISTRY: dict[str, GameModeConfig] = {
    "classic_rush": CLASSIC_RUSH,
    "lyric_clues": LYRIC_CLUES,
    "speed_round": SPEED_ROUND,
}


def get_mode_config(mode_name: str) -> GameModeConfig:
    """Get the config for a game mode, defaulting to Classic Rush."""
    return MODE_REGISTRY.get(mode_name, CLASSIC_RUSH)
