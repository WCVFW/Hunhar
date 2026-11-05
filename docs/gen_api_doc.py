"""Generate docs/API_REFERENCE.md from the Spring controllers, DTOs/entities and the frontend api.ts."""
import json, os, re, sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BE = os.path.join(ROOT, 'Hunhar-backend')
FE_API = os.path.join(ROOT, 'Hunhar-frontend', 'src', 'services', 'api.ts')
OUT = os.path.join(ROOT, 'docs', 'API_REFERENCE.md')

SERVICES = OrderedDict([
    ('identity-service', 'Identity service (port 8081): auth, users, profiles, KYC, leaderboard'),
    ('project-service', 'Project service (port 8082): projects, bids, workspace, teams, files, disputes'),
    ('billing-service', 'Billing service (port 8083): payments, wallet, escrow, credits, invoices, platform settings'),
    ('engagement-service', 'Engagement service (port 8084): chat, notifications, calendar, forum, CMS, analytics'),
])
PUBLIC_PREFIXES = ['/api/v1/auth/', '/api/v1/content/', '/api/v1/webhooks/', '/api/v1/projects/public', '/api/v1/projects/files/']

# ---------------------------------------------------------------- java sources
java_files = []
for svc in list(SERVICES) + ['common-lib']:
    for dp, _, fs in os.walk(os.path.join(BE, svc, 'src', 'main', 'java')):
        java_files += [os.path.join(dp, f) for f in fs if f.endswith('.java')]
SRC = {p: open(p, encoding='utf-8').read() for p in java_files}


def strip_comments(s):
    s = re.sub(r'/\*(?!\*).*?\*/', '', s, flags=re.S)
    return s


def find_block(text, start):
    """Return index just after the matching closing brace for the '{' at/after start."""
    i = text.index('{', start)
    depth = 0
    in_str = None
    while i < len(text):
        c = text[i]
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == in_str:
                in_str = None
        elif c in '"\'':
            in_str = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return len(text)


# class name -> (kind, body text)  (includes nested static classes and records)
CLASSES = {}
for p, s in SRC.items():
    for m in re.finditer(r'\b(class|record|enum)\s+([A-Z]\w*)\s*(\([^)]*\))?[^{;]*\{', s):
        kind, name = m.group(1), m.group(2)
        end = find_block(s, m.end() - 1)
        CLASSES.setdefault(name, (kind, s[m.start():end], m.group(3) or ''))

JAVA_SIMPLE = {
    'String': 'string', 'UUID': 'string (uuid)', 'Integer': 'integer', 'int': 'integer', 'Long': 'integer', 'long': 'integer',
    'BigDecimal': 'number', 'Double': 'number', 'double': 'number', 'Float': 'number', 'Boolean': 'boolean', 'boolean': 'boolean',
    'LocalDate': 'string (date, yyyy-MM-dd)', 'LocalDateTime': 'string (date-time)', 'Instant': 'string (ISO date-time)',
    'OffsetDateTime': 'string (date-time)', 'Object': 'any', 'Void': 'null', 'MultipartFile': 'file (multipart)',
}


def enum_values(name):
    c = CLASSES.get(name)
    if not c or c[0] != 'enum':
        return None
    body = c[1][c[1].index('{') + 1:]
    body = body.split(';')[0]
    vals = re.findall(r'\b([A-Z][A-Z0-9_]+)\b(?:\s*\([^)]*\))?', body)
    return vals


def type_label(t):
    t = t.strip()
    m = re.match(r'(List|Set|Collection|Page)<(.+)>$', t)
    if m:
        inner = type_label(m.group(2))
        return f'{"page of" if m.group(1) == "Page" else "array of"} {inner}'
    m = re.match(r'Map<\s*String\s*,\s*(.+)>$', t)
    if m:
        return f'object (map of {type_label(m.group(1))})'
    if t.endswith('[]'):
        return 'array of ' + type_label(t[:-2])
    if t in JAVA_SIMPLE:
        return JAVA_SIMPLE[t]
    ev = enum_values(t)
    if ev:
        return 'enum: ' + ' | '.join(ev)
    return t


def fields_of(name, depth=0):
    """List of (name, type, rules, ignored) for a DTO/entity/record."""
    c = CLASSES.get(name)
    if not c or c[0] == 'enum':
        return []
    kind, body, rec_params = c
    out = []
    if kind == 'record':
        for part in split_params(rec_params.strip('()')):
            anns = re.findall(r'@(\w+)(\([^)]*\))?', part)
            clean = re.sub(r'@\w+(\([^)]*\))?\s*', '', part).strip()
            bits = clean.rsplit(' ', 1)
            if len(bits) == 2:
                out.append((bits[1], bits[0], rules_of(anns), any(a[0] == 'JsonIgnore' for a in anns)))
        return out
    inner = body[body.index('{') + 1:]
    # drop nested classes and method bodies
    inner = re.sub(r'\b(public|private|protected)?\s*static\s+(class|record|enum)\b', '\0', inner)
    depth_ = 0
    flat = []
    in_s = False
    prev = ''
    for ch in inner:
        if ch == '"' and prev != chr(92):
            in_s = not in_s
        if not in_s and ch == '{':
            depth_ += 1
        elif not in_s and ch == '}':
            depth_ -= 1
        elif depth_ == 0:
            flat.append(ch)
        prev = ch
    flat = ''.join(flat)
    for m in re.finditer(r'((?:@\w+(?:\((?:[^()]|\([^()]*\))*\))?\s*)*)(?:private|protected|public)\s+(?!static|final\s+static)(?:final\s+)?([\w<>,.?\[\] ]+?)\s+(\w+)\s*(?:=[^;]*)?;', flat):
        anns_txt, ftype, fname = m.group(1), m.group(2).strip(), m.group(3)
        if 'static' in ftype:
            continue
        anns = re.findall(r'@(\w+)(\((?:[^()]|\([^()]*\))*\))?', anns_txt)
        names = [a[0] for a in anns]
        if 'Transient' in names and 'JsonIgnore' in names:
            continue
        ignored = 'JsonIgnore' in names or (('JsonProperty' in anns_txt) and 'WRITE_ONLY' in anns_txt)
        out.append((fname, ftype, rules_of(anns), ignored))
    return out


def split_params(s):
    parts, depth, cur = [], 0, ''
    for ch in s:
        if ch in '<(':
            depth += 1
        elif ch in '>)':
            depth -= 1
        if ch == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return [p.strip() for p in parts]


def rules_of(anns):
    r = []
    for name, args in anns:
        a = (args or '').strip('()')
        msg = re.search(r'message\s*=\s*"([^"]*)"', a)
        if name in ('NotBlank', 'NotNull', 'NotEmpty'):
            r.append('required')
        elif name == 'Email':
            r.append('valid email')
        elif name == 'Size':
            mn = re.search(r'min\s*=\s*(\d+)', a)
            mx = re.search(r'max\s*=\s*(\d+)', a)
            r.append('length ' + (f'{mn.group(1)}' if mn else '0') + '–' + (mx.group(1) if mx else '∞'))
        elif name in ('Min', 'DecimalMin', 'Positive', 'PositiveOrZero', 'Max', 'DecimalMax'):
            v = re.search(r'"?([\d.]+)"?', a)
            sym = {'Min': '≥', 'DecimalMin': '≥', 'Max': '≤', 'DecimalMax': '≤'}.get(name)
            r.append('> 0' if name == 'Positive' else '≥ 0' if name == 'PositiveOrZero' else f'{sym} {v.group(1) if v else a}')
        elif name == 'Pattern':
            rx = re.search(r'regexp\s*=\s*"((?:[^"\\]|\\.)*)"', a)
            r.append(f'pattern `{rx.group(1)}`' if rx else 'pattern')
        elif name in ('Future', 'FutureOrPresent'):
            r.append('future date')
        if msg and name in ('NotBlank', 'NotNull', 'Pattern', 'Size', 'Email', 'Min', 'Max', 'DecimalMin', 'DecimalMax', 'Positive'):
            r[-1] += f' ("{msg.group(1)}")'
    return ', '.join(r)


SAMPLE = {'string': '"string"', 'string (uuid)': '"3f2b8c1e-9a7d-4e21-b6f0-5c1d2e3f4a5b"', 'integer': '0', 'number': '0.00',
          'boolean': 'false', 'string (date, yyyy-MM-dd)': '"2026-11-15"', 'string (date-time)': '"2026-11-01T10:30:00"',
          'string (ISO date-time)': '"2026-11-01T10:30:00Z"', 'any': '{}', 'null': 'null'}


def sample_value(ftype, fname='', depth=0):
    t = ftype.strip()
    m = re.match(r'(List|Set|Collection)<(.+)>$', t)
    if m:
        return [sample_value(m.group(2), fname, depth + 1)]
    m = re.match(r'Map<\s*String\s*,\s*(.+)>$', t)
    if m:
        return {'key': sample_value(m.group(1), '', depth + 1)}
    if t.endswith('[]'):
        return [sample_value(t[:-2], fname, depth + 1)]
    lbl = type_label(t)
    if lbl.startswith('enum: '):
        return lbl[6:].split(' | ')[0]
    if lbl in SAMPLE:
        v = json.loads(SAMPLE[lbl])
        low = fname.lower()
        if lbl == 'string':
            if 'email' in low: return 'user@example.com'
            if 'mobile' in low or 'phone' in low: return '9876543210'
            if 'password' in low: return 'Str0ng#Pass'
            if 'otp' in low: return '123456'
            if 'url' in low: return '/api/v1/projects/files/3f2b8c1e.png'
            if 'name' in low: return 'Asha Kumar'
            if 'title' in low: return 'Landing page redesign'
            if 'token' in low: return 'eyJhbGciOiJIUzI1NiJ9...'
            return 'string'
        if lbl in ('number', 'integer') and any(k in low for k in ('amount', 'budget', 'price', 'balance')):
            return 5000 if lbl == 'integer' else 5000.00
        return v
    if depth >= 2 or t not in CLASSES:
        return {} if t not in ('T', '?') else None
    return sample_object(t, depth + 1)


def sample_object(name, depth=0):
    o = OrderedDict()
    for fname, ftype, _, ignored in fields_of(name):
        if not ignored:
            o[fname] = sample_value(ftype, fname, depth)
    return o


# ---------------------------------------------------------------- frontend map
fe = open(FE_API, encoding='utf-8').read()
FE_MAP = {}
FE_SIG = {}
TS_IFACES = {}
for im in re.finditer(r'export interface (\w+)(?:<[^>]*>)?(?: extends [\w, <>]+)? \{', fe):
    end = find_block(fe, im.end() - 1)
    rows = []
    for fm2 in re.finditer(r'^\s{2}(\w+)(\??):\s*(.+?)\s*$', fe[im.end():end - 1], re.M):
        rows.append((fm2.group(1), fm2.group(3).rstrip(';,'), fm2.group(2) == '?'))
    TS_IFACES[im.group(1)] = rows
for gm in re.finditer(r'export const (\w+Api) = \{', fe):
    gname = gm.group(1)
    end = find_block(fe, gm.end() - 1)
    block = fe[gm.end():end]
    for fm in re.finditer(r'\n  (\w+)\s*:\s*(?:async\s*)?\(', block):
        fname = fm.group(1)
        nxt = re.search(r'\n  \w+\s*:\s*(?:async\s*)?\(', block[fm.end():])
        body = block[fm.end(): fm.end() + (nxt.start() if nxt else len(block))]
        pm = re.search(r"(?:apiRequest<[^(]*>\(|fetch\()\s*(?:'([^']+)'|`([^`]+)`)", body)
        if not pm:
            continue
        path = pm.group(1) or pm.group(2)
        path = path.replace('${API_BASE_URL}', '')
        path = re.sub(r'\$\{[^}]+\}', '{}', path).split('?')[0]
        path = re.sub(r"'\s*\+.*$", '', path)
        mm = re.search(r"json\('(\w+)'", body) or re.search(r"method:\s*'(GET|POST|PUT|PATCH|DELETE)'", body)
        method = mm.group(1) if mm else 'GET'
        sig_open = fm.end() - 1
        depth, j = 0, sig_open
        while j < len(block):
            if block[j] == '(':
                depth += 1
            elif block[j] == ')':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        params_ts = ' '.join(block[sig_open + 1:j].split())
        rt = re.search(r'apiRequest<(.+?)>\(', body)
        FE_MAP.setdefault((method.upper(), path.rstrip('/')), []).append(f'{gname}.{fname}()')
        FE_SIG[f'{gname}.{fname}()'] = (f'{gname}.{fname}({params_ts})', rt.group(1).strip() if rt else None)


def fe_lookup(method, path):
    norm = re.sub(r'\{[^}]+\}', '{}', path).rstrip('/')
    return FE_MAP.get((method, norm), [])


# ---------------------------------------------------------------- controllers
MAP_RE = re.compile(r'@(Get|Post|Put|Patch|Delete|Request)Mapping\s*(\((?:[^()]|\([^()]*\))*\))?')


def mapping_paths(args):
    if not args:
        return ['']
    a = args.strip('()')
    m = re.search(r'(?:value|path)\s*=\s*\{([^}]*)\}', a) or re.search(r'^\s*\{([^}]*)\}', a)
    if m:
        return re.findall(r'"([^"]*)"', m.group(1))
    m = re.search(r'"([^"]*)"', a)
    return [m.group(1)] if m else ['']


def javadoc_before(text, idx):
    seg = text[:idx].rstrip()
    # skip annotations between javadoc and mapping
    m = re.search(r'/\*\*((?:(?!\*/).)*)\*/\s*((?:@\w+(?:\((?:[^()]|\([^()]*\))*\))?\s*)*)$', seg, re.S)
    if not m:
        return ''
    d = re.sub(r'^\s*\*\s?', '', m.group(1), flags=re.M).strip()
    d = re.sub(r'\s*\n\s*', ' ', d)
    return re.sub(r'\{@code ([^}]*)\}', r'`\1`', d)


def line_comment_before(text, idx):
    seg = text[:idx].rstrip().split('\n')
    out = []
    for line in reversed(seg):
        l = line.strip()
        if l.startswith('@'):
            continue
        if l.startswith('//'):
            out.insert(0, l[2:].strip())
            continue
        break
    return re.sub(r'^[-=*\s]+', '', ' '.join(out)).strip()


endpoints = []  # dicts
for p, s in sorted(SRC.items()):
    if not p.endswith('Controller.java') or 'Internal' in os.path.basename(p) or 'Fallback' in p:
        continue
    svc = next(k for k in SERVICES if os.sep + k + os.sep in p)
    cls_m = re.search(r'public class (\w+)', s)
    cls_start = cls_m.start()
    head = s[:cls_start]
    prefix = ''
    cm = re.search(r'@RequestMapping\s*(\((?:[^()]|\([^()]*\))*\))', head)
    if cm:
        prefix = mapping_paths(cm.group(1))[0]
    helper_admin = set(re.findall(r'private \w[\w<>]* (\w+)\([^)]*\)\s*\{[^}]*hasRole\("ADMIN"\)', s))
    for mm in MAP_RE.finditer(s, cls_start):
        verb = mm.group(1)
        if verb == 'Request':
            continue
        # method signature follows
        sig_start = mm.end()
        brace = s.index('{', sig_start)
        sig = s[sig_start:brace]
        name_m = re.search(r'(\w+)\s*\(', re.sub(r'@\w+(\((?:[^()]|\([^()]*\))*\))?', '', sig))
        mname = name_m.group(1) if name_m else '?'
        ret_m = re.search(r'ResponseEntity<\s*ApiResponse<(.+?)>\s*>\s+\w+\s*\(', sig) or re.search(r'ApiResponse<(.+?)>\s+\w+\s*\(', sig)
        raw_ret = re.search(r'(?:public\s+)?([\w<>,\s?\[\]]+?)\s+' + re.escape(mname) + r'\s*\(', sig)
        ret = ret_m.group(1).strip() if ret_m else (raw_ret.group(1).strip() if raw_ret else '?')
        enveloped = bool(ret_m)
        params_txt = sig[sig.index('(', sig.index(mname)) + 1: sig.rindex(')')]
        params = split_params(params_txt)
        body_end = find_block(s, brace)
        mbody = s[brace:body_end]
        desc = javadoc_before(s, mm.start()) or line_comment_before(s, mm.start())
        for sub in mapping_paths(mm.group(2)):
            full = (prefix + sub) or '/'
            ep = dict(service=svc, controller=cls_m.group(1), method=verb.upper(), path=full, desc=desc, ret=ret,
                      enveloped=enveloped, path_vars=[], query=[], body=None, multipart=[], name=mname)
            for prm in params:
                if '@CurrentUser' in prm or 'HttpServletRequest' in prm or 'HttpServletResponse' in prm or '@RequestHeader' in prm:
                    if '@RequestHeader' in prm:
                        hn = re.search(r'@RequestHeader\(\s*(?:value\s*=\s*|name\s*=\s*)?"([^"]+)"', prm)
                        ep.setdefault('headers', []).append(hn.group(1) if hn else '?')
                    continue
                clean = re.sub(r'@\w+(\((?:[^()]|\([^()]*\))*\))?\s*', '', prm).strip()
                bits = clean.rsplit(' ', 1)
                if len(bits) != 2:
                    continue
                ptype, pname = bits[0].replace('final ', '').strip(), bits[1]
                if '@PathVariable' in prm:
                    ep['path_vars'].append((pname, type_label(ptype)))
                elif '@RequestParam' in prm or '@RequestPart' in prm:
                    a = re.search(r'@Request(?:Param|Part)(\((?:[^()]|\([^()]*\))*\))?', prm).group(1) or ''
                    nm = re.search(r'(?:value|name)\s*=\s*"([^"]+)"', a) or re.search(r'^\(\s*"([^"]+)"', a)
                    req = 'required = false' not in a and 'defaultValue' not in a
                    dv = re.search(r'defaultValue\s*=\s*"([^"]*)"', a)
                    item = (nm.group(1) if nm else pname, type_label(ptype), req, dv.group(1) if dv else None)
                    (ep['multipart'] if 'MultipartFile' in ptype else ep['query']).append(item)
                elif '@RequestBody' in prm:
                    ep['body'] = ptype
            # auth
            full_norm = full
            needs_user = 'requireUser(' in mbody or 'requireAdmin(' in mbody or any('@CurrentUser' in x and 'required = false' not in x for x in params) and 'user' in mbody.lower()
            if any(full_norm.startswith(pp.rstrip('/')) for pp in PUBLIC_PREFIXES) and not ('/auth/me' in full_norm or ('requireUser(' in mbody)):
                auth = 'Public (no token)'
            else:
                roles = set(re.findall(r'hasRole\("(\w+)"\)', mbody))
                neg = re.findall(r'!\s*\w*\.?hasRole\("(\w+)"\)|!\s*requireUser\([^)]*\)\.hasRole\("(\w+)"\)', mbody)
                if 'requireAdmin(' in mbody or any(h + '(' in mbody for h in helper_admin):
                    roles.add('ADMIN')
                if roles == {'ADMIN'} or (roles and all(r == 'ADMIN' for r in roles)):
                    auth = 'ADMIN only' if ('requireAdmin(' in mbody or neg or any(h + '(' in mbody for h in helper_admin)) else 'Signed-in user (admins get extra access)'
                elif roles:
                    auth = ' / '.join(sorted(roles)) + ' (Bearer token)'
                else:
                    auth = 'Signed-in user (Bearer token)'
                if 'Forbidden' in mbody and auth.startswith('Signed-in') and 'ADMIN' not in roles:
                    auth += '; ownership checked'
            ep['auth'] = auth
            endpoints.append(ep)

# Some controllers delegate role checks to services; record known role rules from the code base
ROLE_HINTS = {
    ('POST', '/api/v1/bids/project/{projectId}'): 'FREELANCER (Bearer token); costs credits',
    ('GET', '/api/v1/bids/my-bids'): 'FREELANCER (Bearer token)',
    ('GET', '/api/v1/bids/client/recent'): 'CLIENT (Bearer token)',
    ('GET', '/api/v1/bids/project/{projectId}'): 'CLIENT who owns the project, or ADMIN',
    ('POST', '/api/v1/bids/{bidId}/award'): 'CLIENT who owns the project',
    ('PATCH', '/api/v1/bids/{bidId}/reject'): 'CLIENT who owns the project',
    ('PATCH', '/api/v1/bids/{bidId}/shortlist'): 'CLIENT who owns the project',
    ('PATCH', '/api/v1/bids/{bidId}/withdraw'): 'FREELANCER who placed the bid',
    ('PUT', '/api/v1/projects/{id}'): 'CLIENT who owns the project',
    ('POST', '/api/v1/projects/{id}/publish'): 'CLIENT who owns the project',
    ('POST', '/api/v1/projects/{id}/cancel'): 'CLIENT who owns the project',
    ('POST', '/api/v1/projects/{id}/complete'): 'CLIENT who owns the project',
    ('GET', '/api/v1/projects/client/my-projects'): 'CLIENT (Bearer token)',
    ('GET', '/api/v1/projects/freelancer/my-projects'): 'FREELANCER (Bearer token)',
    ('POST', '/api/v1/workspace/milestones/{milestoneId}/fund'): 'CLIENT who owns the project',
    ('POST', '/api/v1/workspace/milestones/{milestoneId}/release'): 'CLIENT who owns the project',
    ('POST', '/api/v1/workspace/deliverables/{deliverableId}/review'): 'CLIENT who owns the project',
    ('POST', '/api/v1/workspace/milestones/{milestoneId}/deliverables'): 'Freelancer working on the project',
    ('POST', '/api/v1/workspace/projects/{projectId}/milestones'): 'Project client or lead freelancer',
    ('PATCH', '/api/v1/workspace/projects/{projectId}/progress'): 'Freelancer working on the project',
    ('GET', '/api/v1/workspace/projects/{projectId}'): 'Project client, team freelancers, or ADMIN',
    ('POST', '/api/v1/disputes/project/{projectId}'): 'Project client or hired freelancer',
    ('GET', '/api/v1/invoices/{invoiceNumber}/pdf'): 'Invoice client, invoice freelancer, or ADMIN',
    ('GET', '/api/v1/invoices/client/my-invoices'): 'CLIENT (Bearer token)',
    ('GET', '/api/v1/invoices/freelancer/my-invoices'): 'FREELANCER (Bearer token)',
    ('POST', '/api/v1/wallets/payout'): 'FREELANCER (Bearer token); minimum amount and KYC rule from platform settings',
    ('POST', '/api/v1/content/pages/{slug}'): 'ADMIN only',
    ('GET', '/api/v1/content/inquiries'): 'ADMIN only',
}

# ---------------------------------------------------------------- render
def field_table(name):
    rows = [f for f in fields_of(name) if not f[3]]
    if not rows:
        return ''
    out = ['| Field | Type | Rules |', '|---|---|---|']
    for fname, ftype, rules, _ in rows:
        out.append(f'| `{fname}` | {type_label(ftype)} | {rules or "optional"} |')
    return '\n'.join(out)


def response_desc(ret):
    t = ret.strip()
    base = re.sub(r'^(List|Set|Page)<(.+)>$', r'\2', t)
    return base


def resp_example(ret):
    t = ret.strip()
    if t in ('Void', '?', 'Object'):
        return None
    m = re.match(r'Page<(.+)>$', t)
    if m:
        return OrderedDict([('content', [sample_value(m.group(1))]), ('totalElements', 1), ('totalPages', 1), ('number', 0), ('size', 20)])
    if t.startswith('Map<'):
        return None
    return sample_value(t)


lines = []
A = lines.append
A('# Hunhar API Reference')
A('')
A('Every REST endpoint the backend exposes, the frontend function that calls it, what you send, and what comes back. '
  'Generated by `python docs/gen_api_doc.py` from the controller, DTO and entity source code (`Hunhar-backend/*/src/main/java`) and `Hunhar-frontend/src/services/api.ts`, so field names and rules match the code.')
A('')
A('## Conventions')
A('')
A('**Base URL.** The frontend calls the API gateway only: `VITE_API_BASE_URL` (default `http://localhost:8080`). The gateway routes `/api/v1/**` to the four services below. `/internal/**` service-to-service endpoints are never exposed through the gateway and are not listed here.')
A('')
A('**Authentication.** Log in with `POST /api/v1/auth/login` and send the returned token on every call:')
A('')
A('```http')
A('Authorization: Bearer <token>')
A('```')
A('')
A('The gateway validates the JWT and passes the user id and role to the services. A missing or expired token returns `401`; `api.ts` then clears the session and redirects to `/login`. Roles are `FREELANCER`, `CLIENT` and `ADMIN`.')
A('')
A('**Response envelope.** Every JSON response has this shape; the documented "Response `data`" is what sits in `data`:')
A('')
A('```json')
A('{ "success": true, "message": "Operation successful", "data": { }, "timestamp": "2026-11-01T10:30:00Z" }')
A('```')
A('')
A('**Errors** use the same envelope with `success: false`, no `data`, and a human-readable `message` the UI shows as-is:')
A('')
A('| Status | When |')
A('|---|---|')
A('| 400 | Validation failed (the first field error is the message) or a business rule was broken, e.g. "Not enough credits" |')
A('| 401 | No/invalid/expired token, or wrong login credentials |')
A('| 403 | Signed in but not allowed (wrong role or not the owner) |')
A('| 404 | Resource or route not found |')
A('| 405 | Wrong HTTP method |')
A('| 409 | Someone else changed the record at the same time; reload and retry |')
A('| 413 | Upload larger than the limit |')
A('| 500 | Unexpected error; the message carries a reference id that appears in the service log |')
A('| 503 | A downstream service is unavailable |')
A('')
A('**Types.** Ids are UUID strings. Money is in INR as a decimal number. Dates are ISO-8601 (`yyyy-MM-dd` for dates, `yyyy-MM-ddTHH:mm:ss` for timestamps). A "page of X" response is a Spring page: `{ content: X[], totalElements, totalPages, number, size }`.')
A('')
A('## Key flows')
A('')
A('1. **Sign up (email OTP).**')
A('   1. `POST /api/v1/auth/otp/send {email}`')
A('   2. `POST /api/v1/auth/otp/verify {email, otp}`')
A('   3. `POST /api/v1/auth/register/client` or `/register/freelancer`, then `POST /api/v1/auth/login`.')
A('2. **Hire.**')
A('   1. The client posts with `POST /api/v1/projects` (`publish: false` saves a draft; publish later with `POST /api/v1/projects/{id}/publish`).')
A('   2. The freelancer bids with `POST /api/v1/bids/project/{projectId}`, which spends credits.')
A('   3. The client shortlists or declines, then awards with `POST /api/v1/bids/{bidId}/award`. The project becomes ACTIVE and a chat opens.')
A('3. **Escrow payment.**')
A('   1. The client tops up the wallet: `POST /api/v1/payments/orders {purpose: WALLET_TOPUP, amount}`, then Razorpay checkout, then `POST /api/v1/payments/orders/{id}/verify`.')
A('   2. The client funds a milestone: `POST /api/v1/workspace/milestones/{id}/fund` moves the money into escrow.')
A('   3. The freelancer submits: `POST /api/v1/workspace/milestones/{id}/deliverables`.')
A('   4. The client approves: `POST /api/v1/workspace/deliverables/{id}/review?approve=true`.')
A('   5. The client releases: `POST /api/v1/workspace/milestones/{id}/release`. The freelancer is paid minus the platform commission and an invoice is generated.')
A('   6. Payouts: `POST /api/v1/wallets/payout` (minimum amount and KYC rules come from the platform settings); an admin processes them.')
A('4. **KYC.**')
A('   1. The freelancer submits with `POST /api/v1/kyc/aadhaar`.')
A('   2. An admin lists pending requests with `GET /api/v1/kyc/admin?status=PENDING_REVIEW`.')
A('   3. The admin decides with `POST /api/v1/kyc/{userId}/approve?approved=true|false&reason=`.')
A('5. **Disputes.**')
A('   1. The client or the hired freelancer raises one with `POST /api/v1/disputes/project/{projectId}`.')
A('   2. An admin resolves it with `POST /api/v1/disputes/{id}/resolve {status: RESOLVED|DISMISSED, resolutionNotes}`.')
A('')

# table of contents
A('## Contents')
A('')
by_svc = OrderedDict((k, []) for k in SERVICES)
for ep in endpoints:
    by_svc[ep['service']].append(ep)
for svc, eps in by_svc.items():
    A(f'- [{SERVICES[svc]}](#{re.sub(r"[^a-z0-9 -]", "", SERVICES[svc].lower()).replace(" ", "-")}) ({len(eps)} endpoints)')
A('')

count = 0
for svc, eps in by_svc.items():
    A(f'## {SERVICES[svc]}')
    A('')
    ctrl_seen = None
    for ep in sorted(eps, key=lambda e: (e['controller'], e['path'], ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].index(e['method']))):
        if ep['controller'] != ctrl_seen:
            ctrl_seen = ep['controller']
            A(f'### {ctrl_seen.replace("Controller", "")}')
            A('')
        count += 1
        A(f'#### `{ep["method"]} {ep["path"]}`')
        A('')
        if ep['desc']:
            A(ep['desc'])
            A('')
        auth = ROLE_HINTS.get((ep['method'], ep['path']), ep['auth'])
        fe_fns = fe_lookup(ep['method'], ep['path'])
        A(f'- **Auth:** {auth}')
        A(f'- **Frontend:** {", ".join("`" + f + "`" for f in fe_fns) if fe_fns else "not called by the web app (API/admin tooling only)"}')
        for h in ep.get('headers', []):
            A(f'- **Header:** `{h}`')
        if ep['path_vars']:
            A('- **Path:** ' + ', '.join(f'`{n}` ({t})' for n, t in ep['path_vars']))
        if ep['query']:
            A('- **Query:** ' + '; '.join(f'`{n}` ({t}{", required" if r else ", optional"}{f", default `{d}`" if d not in (None, "") else ""})' for n, t, r, d in ep['query']))
        if ep['multipart']:
            A('- **Body (multipart/form-data):** ' + ', '.join(f'`{n}` (file)' for n, *_ in ep['multipart']))
        A('')
        for f in fe_fns[:1]:
            sig, _ = FE_SIG.get(f, (None, None))
            if sig:
                A('Frontend call:')
                A('')
                A('```ts')
                A(sig if len(sig) < 400 else sig[:400] + ' …')
                A('```')
                A('')
        if ep['body']:
            b = ep['body']
            if b.startswith('Map<'):
                A(f'**Request body:** JSON object ({type_label(b)}). Send only the keys you want to change.')
                A('')
            elif b in CLASSES:
                A(f'**Request body** (`{b}`):')
                A('')
                tbl = field_table(b)
                if tbl:
                    A(tbl)
                    A('')
                A('```json')
                A(json.dumps(sample_object(b), indent=2, ensure_ascii=False))
                A('```')
                A('')
            else:
                A(f'**Request body:** {type_label(b)}')
                A('')
        ret = ep['ret']
        if not ep['enveloped']:
            A(f'**Response:** raw `{ret}` (not wrapped in the envelope)' + (' — binary file download' if 'byte' in ret or 'Resource' in ret else ''))
            A('')
            continue
        base = response_desc(ret)
        ts_rt = next((FE_SIG[f][1] for f in fe_fns if f in FE_SIG and FE_SIG[f][1]), None)
        if ret.startswith('Map<') or ret.startswith('List<Map') or ret == 'Object':
            ts_base = re.sub(r'(\[\]|PagedResponse<|>)', '', ts_rt or '').strip()
            if ts_rt and ts_rt not in ('any', 'void', 'unknown', 'any[]'):
                A(f'**Response `data`:** `{ts_rt}` (TypeScript type in `api.ts`)')
                A('')
                if ts_base in TS_IFACES and TS_IFACES[ts_base]:
                    A('<details><summary>' + ts_base + ' fields</summary>')
                    A('')
                    A('| Field | Type | |')
                    A('|---|---|---|')
                    for n, t, opt in TS_IFACES[ts_base]:
                        A('| `' + n + '` | `' + t.replace('|', chr(92) + '|') + '` | ' + ('optional' if opt else 'always') + ' |')
                    A('')
                    A('</details>')
                    A('')
            else:
                A(f'**Response `data`:** {type_label(ret)}' + (' (see description)' if ep['desc'] else ''))
                A('')
            continue
        if ret in ('Void', '?'):
            A('**Response `data`:** none (check `success` and `message`).')
            A('')
            continue
        A(f'**Response `data`:** {type_label(ret)}')
        A('')
        if base in CLASSES and CLASSES[base][0] != 'enum':
            tbl = field_table(base)
            if tbl:
                A('<details><summary>' + base + ' fields</summary>')
                A('')
                A(tbl)
                A('')
                A('</details>')
                A('')
        ex = resp_example(ret)
        if ex not in (None, {}, [{}]):
            A('```json')
            A(json.dumps({'success': True, 'message': 'Operation successful', 'data': ex}, indent=2, ensure_ascii=False))
            A('```')
            A('')

lines.insert(4, f'_{count} endpoints._')
lines.insert(5, '')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print(count, 'endpoints;', sum(1 for e in endpoints if fe_lookup(e['method'], e['path'])), 'mapped to frontend')
unmapped_fe = [k for k in FE_MAP if not any(fe_lookup(e['method'], e['path']) == FE_MAP[k] for e in endpoints)]
print('frontend calls with no matching backend route:', unmapped_fe)
