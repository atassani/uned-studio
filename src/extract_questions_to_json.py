import json
import re

TXT_PATH = "data/TEORÍA LÓGICA I - preguntas.processed.txt"
JSON_PATH = "public/questions.json"

SECTION_REGEX = re.compile(r"^CUESTIONES.*", re.IGNORECASE)
QUESTION_REGEX = re.compile(r"^(\d+\.-)\s*(.+)")
ANSWER_REGEX = re.compile(r"^(Verdadero|Falso|V|F)\.?$")

questions = []
section = None
number = 0

with open(TXT_PATH, encoding="utf-8") as f:
    lines = [line.strip() for line in f]

    i = 0
    while i < len(lines):
        line = lines[i]
        section_match = SECTION_REGEX.match(line)
        if section_match:
            section = line
            i += 1
            continue
        q_match = QUESTION_REGEX.match(line)
        if q_match:
            number = int(q_match.group(1).replace(".-", ""))
            question_text = q_match.group(2)
            # Find answer
            answer = None
            explanation = ""
            k = i + 1
            # First, look for the answer
            while k < len(lines):
                next_line = lines[k]
                ans_match = ANSWER_REGEX.match(next_line)
                if ans_match:
                    answer = ans_match.group(1)
                    k += 1
                    break
                if SECTION_REGEX.match(next_line) or QUESTION_REGEX.match(next_line):
                    break
                k += 1
            # Now, collect explanation lines until next section/question/answer
            while k < len(lines):
                next_line = lines[k]
                if SECTION_REGEX.match(next_line) or QUESTION_REGEX.match(next_line) or ANSWER_REGEX.match(next_line):
                    break
                explanation += (next_line + " ")
                k += 1
            questions.append({
                "section": section,
                "number": number,
                "question": question_text,
                "answer": answer,
                "explanation": explanation.strip()
            })
            i = k
            continue
        i += 1

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(questions)} questions to {JSON_PATH}")
