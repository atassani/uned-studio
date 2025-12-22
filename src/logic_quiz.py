import re
import random
import sys
import os
import json

EMOJI_SUCCESS = "✅"
EMOJI_FAIL = "❌"
EMOJI_ASK = "❓"
EMOJI_SECTION = "📚"
EMOJI_QUESTION = "📝"
EMOJI_INPUT = "👉"
EMOJI_DONE = "🎉"
EMOJI_PROGRESS = "📊"
EMOJI_REVIEW = "🔎"

HIST_FILE = os.path.expanduser("~/.logic_quiz_history.json")

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def parse_questions(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = [line.rstrip('\n') for line in f]

    questions = []
    section = None
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        # Section: all uppercase, not empty
        if line.strip() and line == line.upper() and re.search(r'[A-ZÁÉÍÓÚÜÑ]', line):
            section = line.strip()
            i += 1
            continue
        # Question: starts with number
        m = re.match(r'^(\d+)[\.-]\s*(.*)', line)
        if m:
            qtext = m.group(0)
            # Next line: answer
            if i+1 < n:
                ans_line = lines[i+1].strip()
                ans_match = re.match(r'^(Verdadero|Falso)\.?$', ans_line, re.IGNORECASE)
                if ans_match:
                    answer = ans_match.group(1).upper()[0]  # 'V' or 'F'
                    # Next line: explanation
                    explanation = lines[i+2].strip() if i+2 < n else ''
                    questions.append({
                        'section': section,
                        'question': qtext,
                        'answer': answer,
                        'explanation': explanation,
                        'index': len(questions)
                    })
                    i += 3
                    continue
        i += 1
    return questions

def load_history():
    if os.path.exists(HIST_FILE):
        with open(HIST_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_history(history):
    with open(HIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def review_questions_grid(questions, correct, incorrect):
    from collections import defaultdict
    # Group by section
    section_map = defaultdict(list)
    for q in questions:
        section_map[q['section']].append(q)
    # Prepare grid
    columns = 5
    print(f"\n{EMOJI_REVIEW} Estado de las preguntas:")
    for section, qs in section_map.items():
        print(f"\n{EMOJI_SECTION} {section}")
        # Build list of "number+emoji" strings
        num_status_list = []
        for q in qs:
            idx = str(q['index'])
            m = re.match(r'^(\d+)', q['question'])
            qnum = m.group(1) if m else '?'
            if idx in correct:
                status = EMOJI_SUCCESS
            elif idx in incorrect:
                status = EMOJI_FAIL
            else:
                status = EMOJI_ASK
            num_status_list.append(f"{qnum}{status}")
        # Print in columns
        for row in range(0, len(num_status_list), columns):
            print(' '.join(num_status_list[row:row+columns]))
    print(f"\n{EMOJI_SUCCESS} = Correcta   {EMOJI_FAIL} = Fallada   {EMOJI_ASK} = Pendiente")
    print(f"{EMOJI_PROGRESS} Total: {len(questions)} | Correctas: {len(correct)} | Falladas: {len(incorrect)} | Pendientes: {len(questions) - len(correct)}\n")
    print("Pulsa ENTER para continuar, o Q para salir...")
    next_action = input().strip().lower()
    if next_action == 'q':
        print("¡Hasta luego!")
        sys.exit(0)

def main():
    filename = "data/TEORÍA LÓGICA I - preguntas.processed.txt"
    questions = parse_questions(filename)
    if not questions:
        print("No se encontraron preguntas en el archivo.")
        sys.exit(1)
    history = load_history()
    correct = set(history.get('correct', []))
    incorrect = set(history.get('incorrect', []))
    while True:
        clear_screen()
        review_questions_grid(questions, correct, incorrect)
        pending = [q for q in questions if str(q['index']) not in correct]
        total = len(questions)
        done = len(correct)
        fail = len(incorrect)
        if not pending:
            print(f"\n{EMOJI_DONE} ¡Has respondido todas las preguntas correctamente!")
            os.remove(HIST_FILE)
            break
        random.shuffle(pending)
        for q in pending:
            clear_screen()
            print(f"{EMOJI_PROGRESS} {done}/{total} correctas | {fail} falladas | {len(pending)} pendientes")
            print(f"\n{EMOJI_SECTION} {q['section']}")
            print(f"{EMOJI_QUESTION} {q['question']}")
            user = input(f"{EMOJI_ASK} ¿Verdadero (V) o Falso (F)? {EMOJI_INPUT} (Q para salir) ").strip().upper()
            if user == 'Q':
                print("¡Hasta luego!")
                sys.exit(0)
            while user not in ('V', 'F'):
                user = input(f"Por favor, responde con V o F: {EMOJI_INPUT} (Q para salir) ").strip().upper()
                if user == 'Q':
                    print("¡Hasta luego!")
                    sys.exit(0)
            idx = str(q['index'])
            if user == q['answer']:
                print(f"{EMOJI_SUCCESS} ¡Correcto! {q['explanation']}")
                correct.add(idx)
                if idx in incorrect:
                    incorrect.remove(idx)
            else:
                print(f"{EMOJI_FAIL} Incorrecto. {q['explanation']}")
                incorrect.add(idx)
            save_history({'correct': list(correct), 'incorrect': list(incorrect)})
            print("Pulsa ENTER para continuar, E para ver el estado, o Q para salir...")
            next_action = input().strip().lower()
            if next_action == 'q':
                print("¡Hasta luego!")
                sys.exit(0)
            if next_action == 'e':
                clear_screen()
                review_questions_grid(questions, correct, incorrect)
            done = len(correct)
            fail = len(incorrect)
        clear_screen()

if __name__ == '__main__':
    main()
