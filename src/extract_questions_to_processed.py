import re

def process_file(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    result = []
    SECTION_REGEX = re.compile(r"^CUESTIONES.*")
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i].rstrip('\n')
        # Preserve section headers
        if SECTION_REGEX.match(line.strip()):
            result.append(line)
            i += 1
            continue
        # If line is all uppercase (ignoring whitespace and punctuation), leave untouched
        if line.strip() and line == line.upper() and re.sub(r'[^A-ZÁÉÍÓÚÜÑ ]', '', line) == line.replace('.', '').replace(',', '').replace(':', '').replace(';', '').replace('¿', '').replace('¡', '').replace('!', '').replace('?', '').replace('(', '').replace(')', '').replace('"', '').replace("'", '').replace('-', '').replace('_', '').replace('/', '').replace(' ', ''):
            result.append(line)
            i += 1
            continue
        # If line starts with a number
        m = re.match(r'\d+\s*[\.-]', line)
        if m:
            joined = line
            j = i + 1
            while j < n:
                next_line = lines[j].rstrip('\n')
                if re.fullmatch(r'(Verdadero|Falso)\.?', next_line.strip()):
                    break
                if SECTION_REGEX.match(next_line.strip()):
                    break
                if next_line.strip() and next_line == next_line.upper() and re.sub(r'[^A-ZÁÉÍÓÚÜÑ ]', '', next_line) == next_line.replace('.', '').replace(',', '').replace(':', '').replace(';', '').replace('¿', '').replace('¡', '').replace('!', '').replace('?', '').replace('(', '').replace(')', '').replace('"', '').replace("'", '').replace('-', '').replace('_', '').replace('/', '').replace(' ', ''):
                    break
                joined += ' ' + next_line.strip()
                j += 1
            result.append(joined)
            i = j
            continue
        # If line is Verdadero or Falso (with optional period)
        if re.fullmatch(r'(Verdadero|Falso)\.?', line.strip()):
            result.append(line)
            j = i + 1
            joined = ''
            while j < n:
                next_line = lines[j].rstrip('\n')
                if re.match(r'\d+\s*[\.-]', next_line):
                    break
                if SECTION_REGEX.match(next_line.strip()):
                    break
                if next_line.strip() and next_line == next_line.upper() and re.sub(r'[^A-ZÁÉÍÓÚÜÑ ]', '', next_line) == next_line.replace('.', '').replace(',', '').replace(':', '').replace(';', '').replace('¿', '').replace('¡', '').replace('!', '').replace('?', '').replace('(', '').replace(')', '').replace('"', '').replace("'", '').replace('-', '').replace('_', '').replace('/', '').replace(' ', ''):
                    break
                joined += (' ' if joined else '') + next_line.strip()
                j += 1
            if joined:
                result.append(joined)
            i = j
            continue
        # Default: just append
        result.append(line)
        i += 1

    with open(output_path, 'w', encoding='utf-8') as f:
        for l in result:
            f.write(l + '\n')

if __name__ == '__main__':
    process_file('data/TEORÍA LÓGICA I - preguntas.txt', 'data/TEORÍA LÓGICA I - preguntas.processed.txt')
