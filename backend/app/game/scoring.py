"""
Scoring logic for Tuneup.

Points = base_correct + speed_bonus
  - base_correct: 100 points for correct guess
  - speed_bonus: proportional to time remaining (max 500)
"""

from app.config import settings


def calculate_points(time_remaining_ms: int, round_duration_ms: int) -> int:
    """
    Calculate points for a correct guess.

    Args:
        time_remaining_ms: ms left in the round when guessed
        round_duration_ms: total ms for the round

    Returns:
        Total points awarded.
    """
    base = settings.points_per_correct

    # Speed bonus: linear from 0 to max_bonus based on time remaining
    ratio = max(0, time_remaining_ms / max(round_duration_ms, 1))
    bonus = int(settings.bonus_max * ratio)

    return base + bonus


def rank_players(scores: dict[str, int]) -> list[tuple[str, int, int]]:
    """
    Rank players by score.

    Returns:
        List of (player_id, score, rank) sorted descending.
    """
    sorted_players = sorted(scores.items(), key=lambda x: -x[1])
    result = []
    for i, (pid, score) in enumerate(sorted_players):
        rank = i + 1
        # Handle ties
        if i > 0 and score == sorted_players[i - 1][1]:
            rank = result[-1][2]
        result.append((pid, score, rank))
    return result
