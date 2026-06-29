# -*- coding: utf-8 -*-
"""
Real-Time Multiplayer Quiz Session Manager
==========================================
Manages live quiz sessions with WebSocket events (Flask-SocketIO).
Implements a Kahoot/Quizizz-style multiplayer quiz flow.

State Machine:
  waiting -> active -> question_N -> revealing -> completed

Scoring:
  - Correct answer base: 1000 points
  - Speed bonus: up to +500 points (faster = more)
  - Streak bonus: +100 per consecutive correct answer
"""

import random
import string
import time
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class SessionStatus(str, Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    QUESTION = "question"
    REVEALING = "revealing"
    COMPLETED = "completed"


@dataclass
class QuizQuestion:
    id: str
    text: str
    options: List[Dict[str, str]]  # [{id, text}]
    correct_option_id: str
    points: int = 1000
    time_limit: int = 20  # seconds


@dataclass
class PlayerAnswer:
    player_id: str
    question_id: str
    selected_option_id: str
    is_correct: bool
    time_spent: float  # seconds
    points_earned: int
    timestamp: float


@dataclass
class Player:
    id: str
    name: str
    avatar_color: str
    score: int = 0
    streak: int = 0
    answers: Dict[str, PlayerAnswer] = field(default_factory=dict)
    joined_at: float = field(default_factory=time.time)
    is_connected: bool = True
    badges: List[str] = field(default_factory=list)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "avatarColor": self.avatar_color,
            "score": self.score,
            "streak": self.streak,
            "isConnected": self.is_connected,
            "badges": self.badges,
            "answeredCount": len(self.answers),
        }


@dataclass
class LiveSession:
    session_id: str
    access_code: str
    quiz_title: str
    questions: List[QuizQuestion]
    creator_id: str
    status: SessionStatus = SessionStatus.WAITING
    current_question_index: int = -1
    players: Dict[str, Player] = field(default_factory=dict)
    question_start_time: float = 0
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None

    @property
    def current_question(self) -> Optional[QuizQuestion]:
        if 0 <= self.current_question_index < len(self.questions):
            return self.questions[self.current_question_index]
        return None

    @property
    def total_questions(self) -> int:
        return len(self.questions)

    def to_dict(self):
        return {
            "sessionId": self.session_id,
            "accessCode": self.access_code,
            "quizTitle": self.quiz_title,
            "status": self.status.value,
            "currentQuestionIndex": self.current_question_index,
            "totalQuestions": self.total_questions,
            "playerCount": len(self.players),
            "createdAt": self.created_at,
            "startedAt": self.started_at,
        }


AVATAR_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
]


class LiveSessionManager:
    """
    Manages multiple live quiz sessions.
    Handles player joins, answer scoring, and leaderboard updates.
    """

    def __init__(self):
        self.sessions: Dict[str, LiveSession] = {}
        self._code_to_session: Dict[str, str] = {}

    def _generate_access_code(self) -> str:
        """Generate a unique QZ-XXXX access code."""
        for _ in range(100):
            digits = "".join(random.choices(string.digits, k=4))
            code = f"QZ-{digits}"
            if code not in self._code_to_session:
                return code
        raise RuntimeError("Unable to generate unique access code")

    def create_session(
        self,
        quiz_title: str,
        questions: List[Dict],
        creator_id: str,
    ) -> LiveSession:
        """Create a new live quiz session."""
        session_id = f"session_{int(time.time())}_{random.randint(1000, 9999)}"
        access_code = self._generate_access_code()

        quiz_questions = []
        for i, q in enumerate(questions):
            quiz_questions.append(QuizQuestion(
                id=q.get("id", f"q{i+1}"),
                text=q["text"],
                options=q["options"],
                correct_option_id=q["correct_option_id"],
                points=q.get("points", 1000),
                time_limit=q.get("time_limit", 20),
            ))

        session = LiveSession(
            session_id=session_id,
            access_code=access_code,
            quiz_title=quiz_title,
            questions=quiz_questions,
            creator_id=creator_id,
        )

        self.sessions[session_id] = session
        self._code_to_session[access_code] = session_id
        logger.info(f"Session created: {session_id} with code {access_code}")
        return session

    def get_session_by_code(self, code: str) -> Optional[LiveSession]:
        """Lookup a session by its access code."""
        session_id = self._code_to_session.get(code.upper())
        return self.sessions.get(session_id) if session_id else None

    def get_session(self, session_id: str) -> Optional[LiveSession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)

    def join_session(self, access_code: str, player_name: str) -> tuple:
        """
        Add a player to a session.
        Returns (session, player) or raises ValueError.
        """
        session = self.get_session_by_code(access_code)
        if not session:
            raise ValueError(f"Session not found for code: {access_code}")

        if session.status != SessionStatus.WAITING:
            raise ValueError("Session has already started")

        player_id = f"player_{int(time.time())}_{random.randint(100, 999)}"
        color = AVATAR_COLORS[len(session.players) % len(AVATAR_COLORS)]

        player = Player(
            id=player_id,
            name=player_name,
            avatar_color=color,
        )
        session.players[player_id] = player
        logger.info(f"Player {player_name} joined session {session.access_code}")
        return session, player

    def start_session(self, session_id: str) -> LiveSession:
        """Transition session from waiting to active, then deliver first question."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != SessionStatus.WAITING:
            raise ValueError("Session not in waiting state")
        if len(session.players) == 0:
            raise ValueError("No players in session")

        session.status = SessionStatus.ACTIVE
        session.started_at = time.time()
        logger.info(f"Session {session.access_code} started with {len(session.players)} players")
        return session

    def advance_to_question(self, session_id: str) -> Optional[QuizQuestion]:
        """Move to the next question."""
        session = self.sessions.get(session_id)
        if not session:
            return None

        session.current_question_index += 1

        if session.current_question_index >= session.total_questions:
            session.status = SessionStatus.COMPLETED
            session.completed_at = time.time()
            self._calculate_badges(session)
            logger.info(f"Session {session.access_code} completed")
            return None

        session.status = SessionStatus.QUESTION
        session.question_start_time = time.time()
        question = session.current_question
        logger.info(
            f"Session {session.access_code}: Question {session.current_question_index + 1}/{session.total_questions}"
        )
        return question

    def submit_answer(
        self,
        session_id: str,
        player_id: str,
        question_id: str,
        selected_option_id: str,
    ) -> PlayerAnswer:
        """Score and record a player's answer."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        player = session.players.get(player_id)
        if not player:
            raise ValueError("Player not found")

        question = session.current_question
        if not question or question.id != question_id:
            raise ValueError("Question mismatch")

        if question_id in player.answers:
            raise ValueError("Already answered this question")

        time_spent = time.time() - session.question_start_time
        is_correct = selected_option_id == question.correct_option_id

        # --- Scoring ---
        points = 0
        if is_correct:
            # Base points
            points = question.points  # 1000

            # Speed bonus: max 500 points, linearly decreasing with time
            max_time = question.time_limit
            speed_ratio = max(0, 1 - (time_spent / max_time))
            speed_bonus = int(500 * speed_ratio)
            points += speed_bonus

            # Streak bonus
            player.streak += 1
            streak_bonus = min(player.streak * 100, 500)  # cap at 500
            points += streak_bonus
        else:
            player.streak = 0

        player.score += points

        answer = PlayerAnswer(
            player_id=player_id,
            question_id=question_id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
            time_spent=round(time_spent, 2),
            points_earned=points,
            timestamp=time.time(),
        )
        player.answers[question_id] = answer
        return answer

    def get_leaderboard(self, session_id: str) -> List[Dict]:
        """Get sorted leaderboard for a session."""
        session = self.sessions.get(session_id)
        if not session:
            return []

        sorted_players = sorted(
            session.players.values(),
            key=lambda p: (-p.score, p.joined_at),
        )

        leaderboard = []
        for rank, player in enumerate(sorted_players, 1):
            correct_count = sum(
                1 for a in player.answers.values() if a.is_correct
            )
            total_answered = len(player.answers)
            avg_time = (
                sum(a.time_spent for a in player.answers.values()) / total_answered
                if total_answered > 0
                else 0
            )

            leaderboard.append({
                "rank": rank,
                "playerId": player.id,
                "name": player.name,
                "avatarColor": player.avatar_color,
                "score": player.score,
                "correctAnswers": correct_count,
                "totalAnswered": total_answered,
                "averageTime": round(avg_time, 2),
                "streak": player.streak,
                "badges": player.badges,
            })

        return leaderboard

    def get_question_results(self, session_id: str, question_id: str) -> Dict:
        """Get detailed results for a specific question."""
        session = self.sessions.get(session_id)
        if not session:
            return {}

        question = None
        for q in session.questions:
            if q.id == question_id:
                question = q
                break

        if not question:
            return {}

        option_counts = {opt["id"]: 0 for opt in question.options}
        player_results = []

        for player in session.players.values():
            answer = player.answers.get(question_id)
            if answer:
                option_counts[answer.selected_option_id] = option_counts.get(
                    answer.selected_option_id, 0
                ) + 1
                player_results.append({
                    "playerId": player.id,
                    "name": player.name,
                    "selectedOption": answer.selected_option_id,
                    "isCorrect": answer.is_correct,
                    "timeSpent": answer.time_spent,
                    "pointsEarned": answer.points_earned,
                })

        return {
            "questionId": question_id,
            "questionText": question.text,
            "correctOptionId": question.correct_option_id,
            "optionCounts": option_counts,
            "totalAnswered": len(player_results),
            "totalPlayers": len(session.players),
            "correctCount": sum(1 for r in player_results if r["isCorrect"]),
            "playerResults": sorted(player_results, key=lambda x: x["timeSpent"]),
        }

    def _calculate_badges(self, session: LiveSession):
        """Award badges at the end of a session."""
        if not session.players:
            return

        sorted_players = sorted(
            session.players.values(),
            key=lambda p: -p.score,
        )

        # Podium badges
        if len(sorted_players) >= 1:
            sorted_players[0].badges.append("gold")
        if len(sorted_players) >= 2:
            sorted_players[1].badges.append("silver")
        if len(sorted_players) >= 3:
            sorted_players[2].badges.append("bronze")

        for player in session.players.values():
            correct = sum(1 for a in player.answers.values() if a.is_correct)
            total = len(session.questions)

            # Perfect score
            if correct == total:
                player.badges.append("perfect")

            # Speed demon — average under 5 seconds
            if player.answers:
                avg = sum(a.time_spent for a in player.answers.values()) / len(player.answers)
                if avg < 5:
                    player.badges.append("speed-demon")

            # Max streak
            max_streak = 0
            current = 0
            for q in session.questions:
                answer = player.answers.get(q.id)
                if answer and answer.is_correct:
                    current += 1
                    max_streak = max(max_streak, current)
                else:
                    current = 0
            if max_streak >= 3:
                player.badges.append("streak-master")

    def delete_session(self, session_id: str):
        """Remove a session."""
        session = self.sessions.pop(session_id, None)
        if session:
            self._code_to_session.pop(session.access_code, None)
