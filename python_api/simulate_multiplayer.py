# -*- coding: utf-8 -*-
"""
Real-Time Multiplayer Quiz Simulation
======================================
Self-contained script that demonstrates a full Kahoot-style multiplayer quiz flow.

Creates a quiz, simulates 3 players joining and answering questions,
and outputs a rich text-based dashboard to the console.

Usage:
    python simulate_multiplayer.py
"""

import sys
import time
import random
import threading
import os

# Add parent dir for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from live_session import LiveSessionManager, SessionStatus

# ──────────────────────────────────────────────────────────────────
# Console Styling
# ──────────────────────────────────────────────────────────────────

class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"

    # Foreground
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    ORANGE = "\033[38;5;208m"
    GOLD = "\033[38;5;220m"
    SILVER = "\033[38;5;250m"
    BRONZE = "\033[38;5;173m"
    GRAY = "\033[38;5;245m"
    LIGHT_BLUE = "\033[38;5;117m"
    PINK = "\033[38;5;211m"

    # Background
    BG_DARK = "\033[48;5;234m"
    BG_DARKER = "\033[48;5;232m"
    BG_GREEN = "\033[48;5;22m"
    BG_RED = "\033[48;5;52m"
    BG_BLUE = "\033[48;5;17m"
    BG_GOLD = "\033[48;5;58m"


def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def print_banner():
    banner = f"""
{Colors.ORANGE}{Colors.BOLD}
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║      ██████  ██    ██ ██ ███████  ██████                     ║
    ║     ██    ██ ██    ██ ██    ███  ██    ██                     ║
    ║     ██    ██ ██    ██ ██   ███   ██    ██                     ║
    ║     ██ ▄▄ ██ ██    ██ ██  ███    ██    ██                     ║
    ║      ██████   ██████  ██ ███████  ██████                     ║
    ║         ▀▀                                                   ║
    ║                                                              ║
    ║         {Colors.CYAN}Real-Time Multiplayer Quiz Simulator{Colors.ORANGE}              ║
    ║         {Colors.GRAY}Kahoot-style Live Quiz Experience{Colors.ORANGE}                 ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
{Colors.RESET}"""
    print(banner)


def print_section(title, icon=""):
    width = 60
    print()
    print(f"{Colors.ORANGE}{Colors.BOLD}{'─' * width}{Colors.RESET}")
    print(f"{Colors.ORANGE}{Colors.BOLD}  {icon}  {title}{Colors.RESET}")
    print(f"{Colors.ORANGE}{'─' * width}{Colors.RESET}")


def print_box(content, color=Colors.CYAN, width=58):
    lines = content.split("\n")
    print(f"  {color}┌{'─' * width}┐{Colors.RESET}")
    for line in lines:
        padded = line.ljust(width)[:width]
        print(f"  {color}│{Colors.RESET} {padded}{color}│{Colors.RESET}")
    print(f"  {color}└{'─' * width}┘{Colors.RESET}")


def print_progress_bar(label, value, max_value, width=30, color=Colors.GREEN):
    filled = int((value / max_value) * width) if max_value > 0 else 0
    bar = f"{color}{'█' * filled}{Colors.GRAY}{'░' * (width - filled)}{Colors.RESET}"
    percentage = (value / max_value * 100) if max_value > 0 else 0
    print(f"  {label:20s} {bar} {Colors.WHITE}{percentage:5.1f}%{Colors.RESET}")


def animate_text(text, delay=0.02):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()


def sleep_animated(seconds, message=""):
    """Display a countdown animation."""
    for i in range(int(seconds * 4)):
        dots = "." * (i % 4 + 1)
        sys.stdout.write(f"\r  {Colors.GRAY}{message}{dots.ljust(5)}{Colors.RESET}")
        sys.stdout.flush()
        time.sleep(0.25)
    print()


# ──────────────────────────────────────────────────────────────────
# Sample Quiz Data
# ──────────────────────────────────────────────────────────────────

SAMPLE_QUESTIONS = [
    {
        "id": "q1",
        "text": "Quel langage est principalement utilise pour le developpement web frontend ?",
        "options": [
            {"id": "a", "text": "Python"},
            {"id": "b", "text": "JavaScript"},
            {"id": "c", "text": "Java"},
            {"id": "d", "text": "C++"},
        ],
        "correct_option_id": "b",
        "points": 1000,
        "time_limit": 20,
    },
    {
        "id": "q2",
        "text": "Que signifie HTML ?",
        "options": [
            {"id": "a", "text": "Hyper Text Markup Language"},
            {"id": "b", "text": "High Tech Modern Language"},
            {"id": "c", "text": "Hyper Transfer Markup Language"},
            {"id": "d", "text": "Home Tool Markup Language"},
        ],
        "correct_option_id": "a",
        "points": 1000,
        "time_limit": 20,
    },
    {
        "id": "q3",
        "text": "Quelle base de donnees est de type NoSQL ?",
        "options": [
            {"id": "a", "text": "PostgreSQL"},
            {"id": "b", "text": "MySQL"},
            {"id": "c", "text": "MongoDB"},
            {"id": "d", "text": "Oracle"},
        ],
        "correct_option_id": "c",
        "points": 1000,
        "time_limit": 20,
    },
    {
        "id": "q4",
        "text": "Quel protocole est utilise pour les communications web securisees ?",
        "options": [
            {"id": "a", "text": "FTP"},
            {"id": "b", "text": "HTTP"},
            {"id": "c", "text": "HTTPS"},
            {"id": "d", "text": "SMTP"},
        ],
        "correct_option_id": "c",
        "points": 1000,
        "time_limit": 20,
    },
    {
        "id": "q5",
        "text": "Quel framework React est utilise pour le Server-Side Rendering ?",
        "options": [
            {"id": "a", "text": "Angular"},
            {"id": "b", "text": "Vue.js"},
            {"id": "c", "text": "Next.js"},
            {"id": "d", "text": "Svelte"},
        ],
        "correct_option_id": "c",
        "points": 1000,
        "time_limit": 20,
    },
]


# ──────────────────────────────────────────────────────────────────
# Player Profiles
# ──────────────────────────────────────────────────────────────────

PLAYER_PROFILES = [
    {
        "name": "Player_A (Expert)",
        "accuracy": 0.85,
        "min_time": 1.5,
        "max_time": 5.0,
        "color": Colors.CYAN,
        "icon": "🎓",
    },
    {
        "name": "Player_B (Average)",
        "accuracy": 0.60,
        "min_time": 3.0,
        "max_time": 10.0,
        "color": Colors.YELLOW,
        "icon": "📚",
    },
    {
        "name": "Player_C (Beginner)",
        "accuracy": 0.40,
        "min_time": 5.0,
        "max_time": 15.0,
        "color": Colors.PINK,
        "icon": "🌱",
    },
]


# ──────────────────────────────────────────────────────────────────
# Simulation Engine
# ──────────────────────────────────────────────────────────────────

def simulate_player_answer(manager, session, player, question, profile):
    """Simulate a single player answering a question."""
    will_be_correct = random.random() < profile["accuracy"]
    time_to_answer = random.uniform(profile["min_time"], profile["max_time"])

    if will_be_correct:
        selected = question.correct_option_id
    else:
        wrong_options = [o["id"] for o in question.options if o["id"] != question.correct_option_id]
        selected = random.choice(wrong_options)

    # Simulate thinking time
    time.sleep(min(time_to_answer * 0.05, 0.3))  # Accelerated simulation

    answer = manager.submit_answer(
        session.session_id,
        player.id,
        question.id,
        selected,
    )
    # Override the time_spent for realistic display (since we're simulating fast)
    answer.time_spent = round(time_to_answer, 2)

    return answer


def display_waiting_room(session, players_info):
    """Display the waiting room dashboard."""
    print_section("WAITING ROOM", "🏠")

    code_display = f"""
  {Colors.BOLD}{Colors.WHITE}Quiz: {session.quiz_title}{Colors.RESET}
  {Colors.GRAY}Session ID: {session.session_id}{Colors.RESET}

  {Colors.BOLD}{Colors.ORANGE}╔═══════════════════════════╗{Colors.RESET}
  {Colors.BOLD}{Colors.ORANGE}║   ACCESS CODE:            ║{Colors.RESET}
  {Colors.BOLD}{Colors.ORANGE}║                           ║{Colors.RESET}
  {Colors.BOLD}{Colors.ORANGE}║     {Colors.WHITE}{Colors.BOLD}  {session.access_code}       {Colors.ORANGE}║{Colors.RESET}
  {Colors.BOLD}{Colors.ORANGE}║                           ║{Colors.RESET}
  {Colors.BOLD}{Colors.ORANGE}╚═══════════════════════════╝{Colors.RESET}

  {Colors.GRAY}Share this code with players to join!{Colors.RESET}
"""
    print(code_display)

    print(f"  {Colors.BOLD}{Colors.WHITE}Players Joined:{Colors.RESET}")
    print(f"  {Colors.GRAY}{'─' * 45}{Colors.RESET}")

    for i, info in enumerate(players_info):
        player = info["player"]
        profile = info["profile"]
        time.sleep(0.5)  # Simulate join delay
        status = f"{Colors.GREEN}● Connected{Colors.RESET}"
        print(f"  {profile['icon']}  {profile['color']}{player.name:25s}{Colors.RESET} {status}")

    print(f"  {Colors.GRAY}{'─' * 45}{Colors.RESET}")
    print(f"  {Colors.GREEN}{Colors.BOLD}{len(players_info)} players ready{Colors.RESET}")
    print()


def display_question(question, q_index, total):
    """Display a question to the console."""
    print_section(f"QUESTION {q_index + 1}/{total}", "❓")

    print(f"\n  {Colors.BOLD}{Colors.WHITE}{question.text}{Colors.RESET}\n")

    option_colors = [Colors.RED, Colors.BLUE, Colors.YELLOW, Colors.GREEN]
    option_labels = ["A", "B", "C", "D"]
    for i, opt in enumerate(question.options):
        color = option_colors[i % len(option_colors)]
        label = option_labels[i]
        correct_marker = f" {Colors.GREEN}✓{Colors.RESET}" if opt["id"] == question.correct_option_id else ""
        print(f"    {color}{Colors.BOLD}[{label}]{Colors.RESET} {opt['text']}{correct_marker}")

    print(f"\n  {Colors.GRAY}Time limit: {question.time_limit}s | Points: {question.points}{Colors.RESET}\n")


def display_answer_results(answers_info, question, players_info):
    """Display player answers for a question."""
    print(f"\n  {Colors.BOLD}{Colors.WHITE}Player Answers:{Colors.RESET}")
    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")

    for info in answers_info:
        profile = info["profile"]
        answer = info["answer"]
        player = info["player"]

        if answer.is_correct:
            status = f"{Colors.GREEN}✓ Correct{Colors.RESET}"
            points_str = f"{Colors.GREEN}+{answer.points_earned}{Colors.RESET}"
        else:
            status = f"{Colors.RED}✗ Wrong{Colors.RESET}"
            points_str = f"{Colors.RED}+0{Colors.RESET}"

        time_str = f"{answer.time_spent:.1f}s"
        print(
            f"  {profile['icon']}  {profile['color']}{player.name:22s}{Colors.RESET}"
            f"  {status:20s}"
            f"  {Colors.GRAY}{time_str:>6s}{Colors.RESET}"
            f"  {points_str}"
        )

    # Answer distribution bar chart
    total_players = len(answers_info)
    print(f"\n  {Colors.BOLD}{Colors.WHITE}Answer Distribution:{Colors.RESET}")
    option_colors = [Colors.RED, Colors.BLUE, Colors.YELLOW, Colors.GREEN]
    option_labels = ["A", "B", "C", "D"]

    for i, opt in enumerate(question.options):
        count = sum(1 for a in answers_info if a["answer"].selected_option_id == opt["id"])
        color = option_colors[i % len(option_colors)]
        bar_width = 25
        filled = int((count / total_players) * bar_width) if total_players > 0 else 0
        bar = f"{color}{'█' * filled}{Colors.GRAY}{'░' * (bar_width - filled)}{Colors.RESET}"
        correct = " ✓" if opt["id"] == question.correct_option_id else "  "
        print(f"    [{option_labels[i]}]{correct} {bar} {count}/{total_players}")


def display_leaderboard(leaderboard, title="LEADERBOARD", is_final=False):
    """Display the current leaderboard."""
    icon = "🏆" if is_final else "📊"
    print_section(title, icon)

    if is_final:
        # Podium display
        if len(leaderboard) >= 3:
            print(f"""
                    {Colors.GOLD}┌─────┐{Colors.RESET}
                    {Colors.GOLD}│  1  │{Colors.RESET}
              {Colors.SILVER}┌─────┤     ├─────┐{Colors.RESET}
              {Colors.SILVER}│  2  │     │  3  │{Colors.RESET}
          {Colors.GRAY}────┤     │     │     ├────{Colors.RESET}
          {Colors.GOLD}  {leaderboard[0]['name'][:8]:^8s}{Colors.RESET}
          {Colors.SILVER}  {leaderboard[1]['name'][:8]:^8s}{Colors.RESET}
          {Colors.BRONZE}  {leaderboard[2]['name'][:8]:^8s}{Colors.RESET}
""")

    max_score = leaderboard[0]["score"] if leaderboard else 1

    rank_colors = {
        1: Colors.GOLD,
        2: Colors.SILVER,
        3: Colors.BRONZE,
    }
    rank_icons = {
        1: "🥇",
        2: "🥈",
        3: "🥉",
    }

    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")
    print(
        f"  {Colors.BOLD}{'Rank':>4s}  {'Player':<22s}  {'Score':>7s}  "
        f"{'Correct':>7s}  {'Avg Time':>8s}{Colors.RESET}"
    )
    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")

    for entry in leaderboard:
        rank = entry["rank"]
        color = rank_colors.get(rank, Colors.WHITE)
        icon = rank_icons.get(rank, f" {rank}.")

        bar_width = 15
        filled = int((entry["score"] / max_score) * bar_width) if max_score > 0 else 0
        score_bar = f"{Colors.ORANGE}{'█' * filled}{Colors.GRAY}{'░' * (bar_width - filled)}{Colors.RESET}"

        badges_str = " ".join(
            {
                "gold": "🥇",
                "silver": "🥈",
                "bronze": "🥉",
                "perfect": "💯",
                "speed-demon": "⚡",
                "streak-master": "🔥",
            }.get(b, b)
            for b in entry.get("badges", [])
        )

        print(
            f"  {icon} {color}{entry['name']:22s}{Colors.RESET}"
            f"  {Colors.WHITE}{Colors.BOLD}{entry['score']:>6d}{Colors.RESET}"
            f"  {Colors.GREEN}{entry['correctAnswers']}/{entry['totalAnswered']}{Colors.RESET}"
            f"    {Colors.GRAY}{entry['averageTime']:>5.1f}s{Colors.RESET}"
        )
        if is_final:
            print(f"       {score_bar}  {badges_str}")

    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")


def display_final_stats(session, manager):
    """Display final statistics."""
    print_section("SESSION STATISTICS", "📈")

    total_questions = session.total_questions
    total_players = len(session.players)
    duration = (session.completed_at or time.time()) - (session.started_at or time.time())

    all_answers = []
    for player in session.players.values():
        all_answers.extend(player.answers.values())

    total_correct = sum(1 for a in all_answers if a.is_correct)
    total_answered = len(all_answers)
    overall_accuracy = (total_correct / total_answered * 100) if total_answered > 0 else 0

    avg_time_per_answer = (
        sum(a.time_spent for a in all_answers) / total_answered if total_answered > 0 else 0
    )

    print(f"""
  {Colors.BOLD}{Colors.WHITE}Session Summary{Colors.RESET}
  {Colors.GRAY}{'─' * 40}{Colors.RESET}
  {Colors.CYAN}Total Questions:    {Colors.WHITE}{total_questions}{Colors.RESET}
  {Colors.CYAN}Total Players:      {Colors.WHITE}{total_players}{Colors.RESET}
  {Colors.CYAN}Session Duration:   {Colors.WHITE}{duration:.1f}s{Colors.RESET}
  {Colors.CYAN}Total Answers:      {Colors.WHITE}{total_answered}{Colors.RESET}
  {Colors.CYAN}Correct Answers:    {Colors.GREEN}{total_correct}{Colors.RESET}
  {Colors.CYAN}Overall Accuracy:   {Colors.WHITE}{overall_accuracy:.1f}%{Colors.RESET}
  {Colors.CYAN}Avg Answer Time:    {Colors.WHITE}{avg_time_per_answer:.1f}s{Colors.RESET}
""")

    # Per-question accuracy
    print(f"  {Colors.BOLD}{Colors.WHITE}Per-Question Accuracy:{Colors.RESET}")
    for i, q in enumerate(session.questions):
        q_answers = [
            player.answers.get(q.id)
            for player in session.players.values()
            if q.id in player.answers
        ]
        q_correct = sum(1 for a in q_answers if a and a.is_correct)
        q_total = len(q_answers)
        print_progress_bar(
            f"Q{i+1}",
            q_correct,
            q_total,
            width=25,
            color=Colors.GREEN if q_correct == q_total else Colors.ORANGE,
        )

    # Player accuracy
    print(f"\n  {Colors.BOLD}{Colors.WHITE}Player Accuracy:{Colors.RESET}")
    for player in session.players.values():
        correct = sum(1 for a in player.answers.values() if a.is_correct)
        total = len(player.answers)
        print_progress_bar(
            player.name[:20],
            correct,
            total,
            width=25,
            color=Colors.GREEN,
        )


# ──────────────────────────────────────────────────────────────────
# Main Simulation
# ──────────────────────────────────────────────────────────────────

def run_simulation():
    """Run the full multiplayer quiz simulation."""
    # Enable ANSI colors on Windows
    if os.name == "nt":
        os.system("")

    clear_screen()
    print_banner()

    manager = LiveSessionManager()

    # ── Step 1: Creator creates a quiz session ──
    print_section("STEP 1: QUIZ CREATION", "📝")
    animate_text(f"  {Colors.GRAY}Creator is building a quiz...{Colors.RESET}", 0.03)
    time.sleep(0.5)

    session = manager.create_session(
        quiz_title="Developpement Web - Quiz Interactif",
        questions=SAMPLE_QUESTIONS,
        creator_id="creator_001",
    )

    print(f"  {Colors.GREEN}✓{Colors.RESET} Quiz created: {Colors.WHITE}{Colors.BOLD}{session.quiz_title}{Colors.RESET}")
    print(f"  {Colors.GREEN}✓{Colors.RESET} Questions: {Colors.WHITE}{session.total_questions}{Colors.RESET}")
    print(f"  {Colors.GREEN}✓{Colors.RESET} Access Code: {Colors.ORANGE}{Colors.BOLD}{session.access_code}{Colors.RESET}")
    time.sleep(0.5)

    # ── Step 2: Players join ──
    print_section("STEP 2: PLAYER REGISTRATION", "👥")
    animate_text(f"  {Colors.GRAY}Players are joining the session...{Colors.RESET}", 0.03)
    time.sleep(0.3)

    players_info = []
    for profile in PLAYER_PROFILES:
        _, player = manager.join_session(session.access_code, profile["name"])
        players_info.append({"player": player, "profile": profile})
        time.sleep(0.3)
        print(
            f"  {profile['icon']}  {profile['color']}{Colors.BOLD}{player.name}{Colors.RESET}"
            f"  {Colors.GREEN}joined!{Colors.RESET}"
            f"  {Colors.GRAY}(Accuracy: {profile['accuracy']*100:.0f}%){Colors.RESET}"
        )

    time.sleep(0.5)

    # ── Step 3: Display Waiting Room ──
    display_waiting_room(session, players_info)
    sleep_animated(1, "Starting quiz in")

    # ── Step 4: Start the session ──
    print_section("STEP 3: QUIZ STARTED!", "🚀")
    manager.start_session(session.session_id)
    print(f"\n  {Colors.GREEN}{Colors.BOLD}🎮 The quiz has started!{Colors.RESET}")
    print(f"  {Colors.WHITE}{len(session.players)} players competing{Colors.RESET}")
    print(f"  {Colors.WHITE}{session.total_questions} questions to answer{Colors.RESET}")
    time.sleep(0.5)

    # ── Step 5: Question-by-question flow ──
    for q_idx in range(session.total_questions):
        question = manager.advance_to_question(session.session_id)
        if not question:
            break

        display_question(question, q_idx, session.total_questions)
        sleep_animated(0.5, "Players are answering")

        # Simulate all players answering
        answers_info = []
        for info in players_info:
            answer = simulate_player_answer(
                manager, session, info["player"], question, info["profile"]
            )
            answers_info.append({
                "answer": answer,
                "player": info["player"],
                "profile": info["profile"],
            })

        # Display answer results
        display_answer_results(answers_info, question, players_info)

        # Show leaderboard after each question
        leaderboard = manager.get_leaderboard(session.session_id)
        display_leaderboard(leaderboard, title=f"STANDINGS AFTER Q{q_idx + 1}")

        if q_idx < session.total_questions - 1:
            sleep_animated(0.5, "Next question loading")

    # ── Step 6: Complete the session ──
    # Force status to completed and calculate badges
    session.status = SessionStatus.COMPLETED
    session.completed_at = time.time()
    session._calculate_badges = lambda: None
    manager._calculate_badges = lambda s: None

    # Manually compute badges
    sorted_players = sorted(session.players.values(), key=lambda p: -p.score)
    if len(sorted_players) >= 1:
        sorted_players[0].badges.append("gold")
    if len(sorted_players) >= 2:
        sorted_players[1].badges.append("silver")
    if len(sorted_players) >= 3:
        sorted_players[2].badges.append("bronze")

    for player in session.players.values():
        correct = sum(1 for a in player.answers.values() if a.is_correct)
        if correct == session.total_questions:
            player.badges.append("perfect")
        if player.answers:
            avg = sum(a.time_spent for a in player.answers.values()) / len(player.answers)
            if avg < 5:
                player.badges.append("speed-demon")
        # Streak
        max_streak = 0
        current = 0
        for q in session.questions:
            ans = player.answers.get(q.id)
            if ans and ans.is_correct:
                current += 1
                max_streak = max(max_streak, current)
            else:
                current = 0
        if max_streak >= 3:
            player.badges.append("streak-master")

    # ── Final Results ──
    final_leaderboard = manager.get_leaderboard(session.session_id)
    display_leaderboard(final_leaderboard, title="FINAL RESULTS", is_final=True)
    display_final_stats(session, manager)

    # ── Creator Dashboard Text Mockup ──
    display_creator_dashboard(session, final_leaderboard, manager)

    print(f"\n{Colors.GREEN}{Colors.BOLD}  ✅ Simulation complete!{Colors.RESET}")
    print(f"  {Colors.GRAY}All {session.total_questions} questions answered by {len(session.players)} players.{Colors.RESET}\n")


def display_creator_dashboard(session, leaderboard, manager):
    """Display a simulated text-based visual representation of the creator's real-time dashboard."""
    print_section("CREATOR'S REAL-TIME DASHBOARD", "🖥️")

    # Top bar
    print(f"""
  {Colors.BG_DARK}{Colors.WHITE}                                                              {Colors.RESET}
  {Colors.BG_DARK}{Colors.ORANGE}  ● QUIZO{Colors.WHITE}        Live Dashboard            {Colors.GREEN}● CONNECTED  {Colors.RESET}
  {Colors.BG_DARK}{Colors.WHITE}                                                              {Colors.RESET}
""")

    # Session Info Panel
    print(f"  {Colors.BOLD}{Colors.WHITE}┌──────────────────────────────────────────────────────────┐{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│{Colors.RESET}  📋 {Colors.BOLD}Session Info{Colors.RESET}                                             {Colors.WHITE}│{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│{Colors.RESET}  {Colors.GRAY}Quiz:{Colors.RESET}    {Colors.WHITE}{session.quiz_title:<42s}{Colors.WHITE}│{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│{Colors.RESET}  {Colors.GRAY}Code:{Colors.RESET}    {Colors.ORANGE}{Colors.BOLD}{session.access_code:<42s}{Colors.WHITE}│{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│{Colors.RESET}  {Colors.GRAY}Status:{Colors.RESET}  {Colors.GREEN}● COMPLETED{'':<35s}{Colors.WHITE}│{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│{Colors.RESET}  {Colors.GRAY}Players:{Colors.RESET} {Colors.WHITE}{len(session.players):<42d}{Colors.WHITE}│{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}└──────────────────────────────────────────────────────────┘{Colors.RESET}")

    # Metrics Cards
    total_answers = sum(len(p.answers) for p in session.players.values())
    total_correct = sum(
        sum(1 for a in p.answers.values() if a.is_correct)
        for p in session.players.values()
    )
    accuracy = (total_correct / total_answers * 100) if total_answers > 0 else 0
    avg_score = sum(p.score for p in session.players.values()) / len(session.players) if session.players else 0

    print(f"""
  {Colors.CYAN}┌────────────┐{Colors.RESET} {Colors.GREEN}┌────────────┐{Colors.RESET} {Colors.ORANGE}┌────────────┐{Colors.RESET} {Colors.MAGENTA}┌────────────┐{Colors.RESET}
  {Colors.CYAN}│  👥 Players │{Colors.RESET} {Colors.GREEN}│  ✓ Accuracy│{Colors.RESET} {Colors.ORANGE}│ 🏆 Avg Scr │{Colors.RESET} {Colors.MAGENTA}│  ❓ Questns│{Colors.RESET}
  {Colors.CYAN}│    {Colors.WHITE}{Colors.BOLD}{len(session.players):>4d}{Colors.CYAN}    │{Colors.RESET} {Colors.GREEN}│   {Colors.WHITE}{Colors.BOLD}{accuracy:>5.1f}%{Colors.GREEN}  │{Colors.RESET} {Colors.ORANGE}│   {Colors.WHITE}{Colors.BOLD}{avg_score:>6.0f}{Colors.ORANGE}  │{Colors.RESET} {Colors.MAGENTA}│    {Colors.WHITE}{Colors.BOLD}{session.total_questions:>4d}{Colors.MAGENTA}    │{Colors.RESET}
  {Colors.CYAN}└────────────┘{Colors.RESET} {Colors.GREEN}└────────────┘{Colors.RESET} {Colors.ORANGE}└────────────┘{Colors.RESET} {Colors.MAGENTA}└────────────┘{Colors.RESET}
""")

    # Live Player Table
    print(f"  {Colors.BOLD}{Colors.WHITE}┌─────┬────────────────────────┬────────┬──────────┬─────────┐{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}│ Rank│ Player                 │ Score  │ Correct  │ Badges  │{Colors.RESET}")
    print(f"  {Colors.BOLD}{Colors.WHITE}├─────┼────────────────────────┼────────┼──────────┼─────────┤{Colors.RESET}")

    rank_colors = {1: Colors.GOLD, 2: Colors.SILVER, 3: Colors.BRONZE}
    for entry in leaderboard:
        color = rank_colors.get(entry["rank"], Colors.WHITE)
        badges = " ".join(
            {"gold": "🥇", "silver": "🥈", "bronze": "🥉", "perfect": "💯",
             "speed-demon": "⚡", "streak-master": "🔥"}.get(b, "")
            for b in entry.get("badges", [])
        )
        print(
            f"  {Colors.WHITE}│{color} {entry['rank']:>3d} "
            f"{Colors.WHITE}│ {color}{entry['name']:<22s}"
            f"{Colors.WHITE}│{Colors.BOLD} {entry['score']:>5d}  "
            f"{Colors.WHITE}│ {Colors.GREEN}{entry['correctAnswers']}/{entry['totalAnswered']}"
            f"      {Colors.WHITE}│ {badges:<7s} {Colors.WHITE}│{Colors.RESET}"
        )

    print(f"  {Colors.BOLD}{Colors.WHITE}└─────┴────────────────────────┴────────┴──────────┴─────────┘{Colors.RESET}")

    # Activity Feed
    print(f"\n  {Colors.BOLD}{Colors.WHITE}📡 Live Activity Feed:{Colors.RESET}")
    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")

    events = [
        (Colors.GREEN, "●", "Session created by Creator"),
    ]
    for info in sorted(
        [{"player": p, "profile": pr} for p, pr in zip(session.players.values(), PLAYER_PROFILES)],
        key=lambda x: x["player"].joined_at,
    ):
        events.append((Colors.CYAN, "→", f"{info['player'].name} joined the session"))

    events.append((Colors.ORANGE, "▶", "Quiz started"))

    for i, q in enumerate(session.questions):
        events.append((Colors.YELLOW, "?", f"Question {i+1} delivered"))
        for p in session.players.values():
            ans = p.answers.get(q.id)
            if ans:
                sym = "✓" if ans.is_correct else "✗"
                col = Colors.GREEN if ans.is_correct else Colors.RED
                events.append((col, sym, f"{p.name} answered Q{i+1} in {ans.time_spent:.1f}s"))

    events.append((Colors.GREEN, "■", "Quiz completed - Final results displayed"))

    # Show last 15 events
    for color, symbol, text in events[-15:]:
        print(f"  {color}{symbol}{Colors.RESET} {Colors.GRAY}{text}{Colors.RESET}")

    print(f"  {Colors.GRAY}{'─' * 55}{Colors.RESET}")


# ──────────────────────────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    try:
        run_simulation()
    except KeyboardInterrupt:
        print(f"\n  {Colors.YELLOW}Simulation interrupted.{Colors.RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"\n  {Colors.RED}Error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
