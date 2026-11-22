#!/usr/bin/env python3
"""
Extrai da planilha de risco (aba INDICADORES) os valores normalizados (0 a 1) no formato do painel.

    python3 migrations/risco/xlsx_to_valores.py <planilha.xlsx> <saida.json>

Saída: { "m": [cd_mun...], "v": { "cN": [valor 0-10000 ou -1] } }, com os índices na ordem de "m"
(o mesmo formato de dados.json; "nb" não é gerado). Só usa a biblioteca padrão do Python.
Depois: node migrations/risco/update_valores.js <saida.json> [--dry-run]

Colunas da aba -> indicador do painel (cN): a coluna G é c6, H é c7 ... BA é c52 (mesmo número da coluna).
Exceções: a coluna BB (EX_PO_2_2, população total) vira c53, e as colunas BC e BD (comunidades tradicionais e
rurais) viram c55 e c56. O antigo c54 (usuários urbanos expostos) não existe mais na planilha.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
SHEET = 'INDICADORES'
HEADER_CODES_ROW = 4  # códigos dos indicadores (AC_EH_1_3 ...)
EXPECTED_CODES = {  # coluna da planilha -> código; confere que a planilha tem o layout esperado
    'G': 'AC_EH_1_3', 'BA': 'EX_PO_1_2', 'BB': 'EX_PO_2_2', 'BC': 'EX_CT_1_2', 'BD': 'EX_CT_2_2',
}


def col_index(letters):
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1  # A = 0


def panel_col(letters):
    n = col_index(letters)
    if n <= 52:  # G..BA
        return n
    return {53: 53, 54: 55, 55: 56}[n]  # BB, BC, BD


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = sys.argv[1:]
    z = zipfile.ZipFile(src)

    wb = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    target = next((rels[s.get(RNS + 'id')] for s in wb.iter(NS + 'sheet') if s.get('name') == SHEET), None)
    if not target:
        sys.exit(f'Aba {SHEET} não encontrada')
    path = 'xl/' + target.lstrip('/').replace('xl/', '', 1)

    strings = [''.join(t.text or '' for t in si.iter(NS + 't')) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]

    codes, rows = {}, []
    with z.open(path) as f:
        for _, el in ET.iterparse(f):
            if el.tag != NS + 'row':
                continue
            r = int(el.get('r'))
            cells = {}
            for c in el.findall(NS + 'c'):
                v = c.find(NS + 'v')
                if v is None:
                    continue
                letters = re.match(r'[A-Z]+', c.get('r')).group()
                cells[letters] = strings[int(v.text)] if c.get('t') == 's' else v.text
            if r == HEADER_CODES_ROW:
                codes = cells
            elif r > HEADER_CODES_ROW and re.fullmatch(r'\d{7}', cells.get('D', '')):
                rows.append(cells)
            el.clear()

    for letters, code in EXPECTED_CODES.items():
        if codes.get(letters) != code:
            sys.exit(f'Layout inesperado: coluna {letters} deveria ser {code}, é {codes.get(letters)!r}')

    cols = [c for c in codes if col_index(c) >= 6]
    if len(cols) != 50:
        sys.exit(f'Esperava 50 colunas de indicadores, encontrei {len(cols)}')

    ids = [r['D'] for r in rows]
    if len(ids) != len(set(ids)):
        sys.exit('Códigos de município repetidos')

    v = {}
    for letters in sorted(cols, key=col_index):
        vals = []
        for r in rows:
            x = r.get(letters)
            if x is None or x == 'NA':
                vals.append(-1)
                continue
            f = float(x)
            if not 0 <= f <= 1:
                sys.exit(f'Valor fora de 0-1 em {codes[letters]}, município {r["D"]}: {x}')
            vals.append(round(f * 10000))
        v[f'c{panel_col(letters)}'] = vals

    json.dump({'m': ids, 'v': v}, open(out, 'w'), separators=(',', ':'))
    print(f'OK: {len(ids)} municípios, {len(v)} indicadores -> {out}')


if __name__ == '__main__':
    main()
