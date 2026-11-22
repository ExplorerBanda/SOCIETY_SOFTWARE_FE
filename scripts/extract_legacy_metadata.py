from __future__ import annotations
import json, re, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'recovered' / 'decompiled'
MAIN = SRC / 'EasyBook' / 'QuickTC.Forms' / 'MainForm.cs'
OUT = Path(__file__).resolve().parents[1] / 'src' / 'data'

def slug(value: str) -> str:
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode().lower()
    return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',value)).strip('-') or 'item'

def unescape(value: str) -> str:
    return bytes(value, 'utf-8').decode('unicode_escape') if '\\' in value else value

def line_of(text: str, offset: int) -> int:
    return text.count('\n',0,offset)+1

def class_match(text: str):
    return re.search(r'\bclass\s+(\w+)\s*:\s*(?:System\.Windows\.Forms\.)?Form\b',text)

def class_category(name: str, path: Path) -> str:
    if 'Reporter' in path.parts: return 'Reports and print workflows'
    if name in {'MainForm','Login','EMIForm','MDcalc','DateDiff'}: return 'Shell, authentication and calculators'
    member={'MRForm','MrGrid','MrSearch','MRMess','MRPict','MRResign','changecontact','MBalance','MyView'}
    if name in member: return 'Membership and member servicing'
    deposit={'FDcalc','FDCert','FDconfig','FDForm','FDGrid','FDHelp','FDInterest','FDInterestDuedate','FLInterestPosting','ODConfig','ODForm','OverdueInterest','PassBook','PassBookD','PledgedFDR','PledgXFDR','RDPrint','RenewFD','ReNewFDR','SSconfig','SSInterest','SSMaster','SSReceipt','SDMaster','SHForm','SHGrid'}
    if name in deposit: return 'Deposits, shares and savings'
    loan={'CDDemand','ClearLoan','CreateInstalment','CreateOldInstalments','LoanReshedule','RLConfig','RLForm','RLGrid','RLGridRcpt','RLInterest','RlInterest10th','RLTransfer','StopInstal','TransferIntt2Prin','UpdateArbRL','ExecStandInst'}
    if name in loan: return 'Loans and credit processing'
    tx={'AUTOReceipt','Adjustment','AdjustFDVoucher','BankReco','BanktoRCPT','CheqAcknowledge','ChequePrinting','Commission','ContraVoucher','CreateVoucher','DebitVoucher','DuplicateVoucher','ECS','GSTPayment','GSTReceipt','GSTVoucher','JourVoucher','MobiletoRCPT','Payment','PDC','Receipt','ReceiptBK','RePayment','ReverseVoucher','Voucher','VoucherBK','VRGrid','VRGridBK'}
    if name in tx: return 'Transactions and vouchers'
    if name in {'ACMaster','DDmaster','INMaster'}: return 'Arbitration and correspondence'
    admin={'AddReportRights','Addrights','Adduser','Backup','Attach','Changepassword','DatabaseViewer','DayEnd','Detach','Encryptor','Features','LogHistory','Restore','SQLTool','TeamViewer','UpdateDayend','UploadBalances','IFSC','SMSText','MobileNoSMS','CustomizeSMS','BirthdaySMS'}
    if name in admin: return 'Administration and utilities'
    acct={'Acconfig','AGForm','BankName','BKForm','BranchName','BRForm','DConfig','GLForm','GlYear','Holist','IGForm','ITMaster','Masters','Subledger','SLForm','Tcconfig','VRconfig','ChangeGLCode'}
    if name in acct: return 'Accounting and configuration'
    if name in {'AllRefno','LastRcpt','PersonalLedger','RecoMaster','ShowRefno'}: return 'Reports and member views'
    return 'Other workflow'

# Build all recovered Form classes as screen metadata.
screens=[]
for path in sorted(SRC.rglob('*.cs')):
    if 'bin' in path.parts or 'obj' in path.parts: continue
    text=path.read_text(encoding='utf-8-sig',errors='replace')
    cm=class_match(text)
    if not cm: continue
    name=cm.group(1); sid=slug(name)
    declarations={}
    for m in re.finditer(r'^\s*(?:private|protected|public)\s+(?:new\s+)?(?:System\.Windows\.Forms\.)?(\w+)\s+(\w+)\s*(?:=|;)',text,re.M):
        typ,field=m.group(1),m.group(2)
        declarations[field]=typ
    label_text={m.group(1):unescape(m.group(2)) for m in re.finditer(r'this\.(\w+)\.Text\s*=\s*"((?:\\.|[^"\\])*)"\s*;',text)}
    coords={}
    for m in re.finditer(r'this\.(\w+)\.Location\s*=\s*new\s+(?:System\.Drawing\.)?Point\((\d+),\s*(\d+)\)',text):
        coords[m.group(1)]=(int(m.group(2)),int(m.group(3)))
    # Reporter forms often create controls dynamically through CreateControl helpers.
    # Recover their label text and coordinates without executing any SQL or UI code.
    dynamic_labels=[]
    label_call=re.compile(r'CreateLabel\s*\(\s*(?:this\.)?(\w+)\s*,\s*new\s+(?:System\.Drawing\.)?Point\((\d+),\s*(\d+)\)\s*,\s*new\s+(?:System\.Drawing\.)?Size\(\d+,\s*\d+\)\s*,\s*"((?:\\.|[^"\\])*)"',re.S)
    for m in label_call.finditer(text):
        dynamic_labels.append((m.group(1),int(m.group(2)),int(m.group(3)),unescape(m.group(4)).strip(),m.start()))
    dynamic_positions={}
    dynamic_control_call=re.compile(r'Create(?:TextBox|Combo|CheckBox|RadioButton)\s*\(\s*(?:this\.)?(\w+)\s*,\s*new\s+(?:System\.Drawing\.)?Point\((\d+),\s*(\d+)\)',re.S)
    for m in dynamic_control_call.finditer(text):
        dynamic_positions.setdefault(m.group(1),[]).append((int(m.group(2)),int(m.group(3)),m.start()))
    # A nearby left-side label is used only as a likely label association; otherwise use the field name.
    field_parent={}
    for m in re.finditer(r'this\.(\w+)\.Controls\.Add\(this\.(\w+)\)',text): field_parent[m.group(2)]=m.group(1)
    for m in re.finditer(r'this\.(\w+)\.Controls\.AddRange\(new System\.Windows\.Forms\.Control\[\]\s*\{(.*?)\}\);',text,re.S):
        parent=m.group(1)
        for child in re.findall(r'this\.(\w+)',m.group(2)):field_parent[child]=parent
    groups=[]
    for field,typ in declarations.items():
        if typ=='GroupBox':
            label=label_text.get(field,'').strip()
            if label: groups.append({'field':field,'label':label})
    tabs=[]
    for field,typ in declarations.items():
        if typ=='TabPage':
            label=label_text.get(field,'').strip()
            if label: tabs.append({'field':field,'label':label})
    fields=[]
    input_types={'TextBox':'text','MaskedTextBox':'text','ComboBox':'select','DateTimePicker':'date','CheckBox':'checkbox','RadioButton':'radio','NumericUpDown':'number','MyCombo':'select'}
    for field,typ in declarations.items():
        if typ not in input_types: continue
        field_label=''
        field_positions=([(coords[field][0],coords[field][1],0)] if field in coords else dynamic_positions.get(field,[]))
        if field_positions:
            x,y,control_offset=field_positions[0]
            candidates=[]
            for lname,ltyp in declarations.items():
                if ltyp!='Label' or lname not in coords: continue
                lx,ly=coords[lname]
                label=label_text.get(lname,'').strip()
                if label and lx < x and abs(ly-y)<=22: candidates.append((abs(ly-y),-lx,label))
            nearby_dynamic=[(offset,label) for label_field,lx,ly,label,offset in dynamic_labels if lx < x and abs(ly-y)<=3 and label and offset < control_offset]
            if nearby_dynamic:
                field_label=max(nearby_dynamic,key=lambda candidate:candidate[0])[1]
            if candidates: field_label=sorted(candidates)[0][2]
        cleaned=field.lstrip('_')
        fallback=re.sub(r'([a-z0-9])([A-Z])',r'\1 \2',cleaned).replace('_',' ').strip()
        label=field_label or fallback or field
        group=field_parent.get(field)
        section=label_text.get(group,'') if group and declarations.get(group)=='GroupBox' else ''
        tab=None; parent=group
        while parent and parent in field_parent:
            parent=field_parent[parent]
            if declarations.get(parent)=='TabPage':
                tab=label_text.get(parent,'').strip() or parent
                break
        multiline=bool(re.search(r'this\.'+re.escape(field)+r'\.Multiline\s*=\s*true',text,re.I))
        read_only=bool(re.search(r'this\.'+re.escape(field)+r'\.ReadOnly\s*=\s*true',text,re.I))
        length_match=re.search(r'this\.'+re.escape(field)+r'\.MaxLength\s*=\s*(\d+)',text)
        hidden=bool(re.search(r'this\.'+re.escape(field)+r'\.Visible\s*=\s*false',text,re.I))
        fields.append({'name':field,'label':label,'type':'textarea' if multiline else input_types[typ],'section':section or None,'tab':tab,'options':[],'required':None,'readOnly':read_only,'maxLength':int(length_match.group(1)) if length_match else None,'visibleByDefault':not hidden,'sourceType':typ})
    actions=[]
    click_handlers={m.group(1):m.group(2) for m in re.finditer(r'this\.(\w+)\.Click\s*\+=\s*new\s+System\.EventHandler\((?:this\.)?(\w+)\)',text)}
    for field,typ in declarations.items():
        if typ not in {'Button','LinkLabel','ToolStripMenuItem'}: continue
        title=label_text.get(field,'').strip()
        if not title and typ=='Button': title=re.sub(r'([a-z0-9])([A-Z])',r'\1 \2',field).strip()
        handler=click_handlers.get(field)
        actions.append({'name':field,'label':title or field,'handler':handler,'kind': 'link' if typ=='LinkLabel' else 'button','sourceType':typ})
    grid_column_map={}
    for gm in re.finditer(r'this\.(\w+)\.Columns\.AddRange\((.*?)\);',text,re.S):
        grid_column_map[gm.group(1)]=re.findall(r'this\.(\w+)',gm.group(2))
    grid_fields=[field for field,typ in declarations.items() if typ in {'DataGridView','DataGrid'}]
    grids=[]
    for field in grid_fields:
        columns=[]
        selected_columns=grid_column_map.get(field,[])
        if not selected_columns and len(grid_fields)==1:
            selected_columns=[col for col,ct in declarations.items() if ct.startswith('DataGridView')]
        for col in selected_columns:
            header=label_text.get(col,'').strip()
            if header: columns.append({'name':col,'label':header})
        grids.append({'name':field,'columns':columns})
    title=''
    if name=='MainForm': title='Runtime caption (company name; debug preview has a separate caption)'
    elif name=='Login': title='Login'
    else:
        tm=re.search(r'\b(?:this|base)\.Text\s*=\s*"((?:\\.|[^"\\])*)"',text)
        title=unescape(tm.group(1)).strip() if tm else ''
    is_db=bool(re.search(r'\b(?:DALClass|DALXcute|SqlDataAdapter|SqlCommand|SqlConnection|SqlDataReader)\b|\bGeneral\.Str\b',text))
    screens.append({'id':sid,'name':name,'title':title,'category':class_category(name,path),'source':path.relative_to(ROOT).as_posix(),'line':line_of(text,cm.start(1)),'fields':fields,'actions':actions,'grids':grids,'sections':groups,'tabs':tabs,'hasDirectDatabaseCalls':is_db,'dialogCallCount':len(re.findall(r'MessageBox\.Show\s*\(',text)),'screenConfidence':'source-backed' if (fields or actions or grids or groups or tabs) else 'needs visual/source review'})

# Menu/action model from MainForm designer event wiring and menu structure.
text=MAIN.read_text(encoding='utf-8-sig',errors='replace')
labels={m.group(1):unescape(m.group(2)) for m in re.finditer(r'this\.(\w+)\.Text\s*=\s*"((?:\\.|[^"\\])*)"\s*;',text)}
children={}
for m in re.finditer(r'this\.(\w+)\.DropDownItems\.AddRange\(new System\.Windows\.Forms\.ToolStripItem\[\]\s*\{(.*?)\}\);',text,re.S): children[m.group(1)]=re.findall(r'this\.(\w+)',m.group(2))
rootm=re.search(r'this\.menuStrip1\.Items\.AddRange\(new System\.Windows\.Forms\.ToolStripItem\[\]\s*\{(.*?)\}\);',text,re.S)
roots=re.findall(r'this\.(\w+)',rootm.group(1)) if rootm else []
clicks={m.group(1):m.group(2) for m in re.finditer(r'this\.(\w+)\.Click\s*\+=\s*new\s+System\.EventHandler\(this\.(\w+)\)',text)}
# Extract method bodies, tracking braces so route targets stay within the handler.
methods={}
method_re=re.compile(r'\b(?:private|public|protected)\s+(?:static\s+)?(?:async\s+)?[\w<>.?]+\s+(\w+)\s*\([^)]*\)\s*\{')
for m in method_re.finditer(text):
    depth=1;i=m.end()
    while i<len(text) and depth:
        if text[i]=='{': depth+=1
        elif text[i]=='}': depth-=1
        i+=1
    methods[m.group(1)]=(text[m.end():i-1],line_of(text,m.start()))
screen_ids={x['name']:x['id'] for x in screens}
report_classes=set()
for report_file in (SRC/'Reporter').rglob('*.cs'):
    report_text=report_file.read_text(encoding='utf-8-sig',errors='replace')
    report_classes.update(re.findall(r'\bclass\s+(\w+)\s*:\s*ReportClass\b',report_text))

def method_bodies(source_text):
    found={}
    for match in method_re.finditer(source_text):
        depth=1; i=match.end()
        while i<len(source_text) and depth:
            if source_text[i]=='{': depth+=1
            elif source_text[i]=='}': depth-=1
            i+=1
        found[match.group(1)]=source_text[match.end():i-1]
    return found

# Preserve source-level button workflows when a click handler directly opens another Form.
for screen in screens:
    screen_text=(ROOT/screen['source']).read_text(encoding='utf-8-sig',errors='replace')
    bodies=method_bodies(screen_text)
    for action in screen['actions']:
        body=bodies.get(action.get('handler') or '', '')
        constructed=re.findall(r'\bnew\s+(\w+)\s*\(',body)
        action['destinationScreenIds']=list(dict.fromkeys(screen_ids[x] for x in constructed if x in screen_ids))
        action['reportTargets']=list(dict.fromkeys(x for x in constructed if x in report_classes))

entries=[]; tree=[]; used=set()
def add_node(field,root_label,path_labels=None):
    if path_labels is None: path_labels=[]
    if field.startswith('toolStripSeparator'): return None
    label=labels.get(field,field).strip()
    if not label: return None
    handler=clicks.get(field)
    entry=None
    if handler:
        body,hline=methods.get(handler,('',line_of(text,text.find('this.'+field+'.Click'))))
        targets=[]
        for target in re.findall(r'\bnew\s+(\w+)\s*\(',body):
            if target in screen_ids and target not in targets: targets.append(target)
        base=f'{root_label}|{label}|{handler}|{field}'
        eid='nav-'+slug(base)
        serial=1; unique=eid
        while unique in used: serial+=1; unique=f'{eid}-{serial}'
        used.add(unique)
        reports=list(dict.fromkeys(x for x in re.findall(r'\bnew\s+(\w+)\s*\(',body) if x in report_classes))
        entry={'id':unique,'label':label,'group':root_label,'menuPath':path_labels+[label],'field':field,'handler':handler,'line':hline,'source':MAIN.relative_to(ROOT).as_posix(),'destinationScreenIds':[screen_ids[x] for x in targets],'reportTargets':reports,'kind':'action'}
        entries.append(entry)
    childnodes=[]
    for child in children.get(field,[]):
        c=add_node(child,root_label,path_labels+[label])
        if c:childnodes.append(c)
    node={'label':label,'field':field,'group':root_label,'entryId':entry['id'] if entry else None,'children':childnodes}
    if not entry and not childnodes: return None
    if not entry:
        base=f'{root_label}|group|{field}'; eid='group-'+slug(base); serial=1; unique=eid
        while unique in used: serial+=1; unique=f'{eid}-{serial}'
        used.add(unique)
        g={'id':unique,'label':label,'group':root_label,'menuPath':path_labels+[label],'field':field,'handler':None,'line':line_of(text,text.find('this.'+field+'.DropDownItems.AddRange')),'source':MAIN.relative_to(ROOT).as_posix(),'destinationScreenIds':[],'kind':'group'}
        entries.append(g);node['entryId']=unique
    return node
for r in roots:
    rootlabel=labels.get(r,r).strip()
    node=add_node(r,rootlabel)
    if node: tree.append(node)
# MainForm click delegates not represented by menu arrays (quick actions, calculators, shell buttons).
for field,handler in clicks.items():
    if field in {x['field'] for x in entries}: continue
    body,hline=methods.get(handler,('',line_of(text,text.find('this.'+field+'.Click'))))
    targets=[]
    for target in re.findall(r'\bnew\s+(\w+)\s*\(',body):
        if target in screen_ids and target not in targets: targets.append(target)
    label=labels.get(field,field).strip() or field
    base=f'Quick actions / other shell controls|{label}|{handler}|{field}'
    eid='nav-'+slug(base); serial=1; unique=eid
    while unique in used: serial+=1; unique=f'{eid}-{serial}'
    used.add(unique)
    reports=list(dict.fromkeys(x for x in re.findall(r'\bnew\s+(\w+)\s*\(',body) if x in report_classes))
    e={'id':unique,'label':label,'group':'Quick actions / other shell controls','menuPath':['Quick actions',label],'field':field,'handler':handler,'line':hline,'source':MAIN.relative_to(ROOT).as_posix(),'destinationScreenIds':[screen_ids[x] for x in targets],'reportTargets':reports,'kind':'action'}
    entries.append(e)

OUT.mkdir(parents=True,exist_ok=True)
(OUT/'legacyScreens.json').write_text(json.dumps(screens,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'legacyNavigation.json').write_text(json.dumps({'topLevel': [labels.get(x,x) for x in roots], 'tree':tree, 'entries':entries},ensure_ascii=False,indent=2),encoding='utf-8')
summary=[{'id':x['id'],'name':x['name'],'title':x['title'],'category':x['category'],'source':x['source'],'line':x['line'],'fieldCount':len(x['fields']),'actionCount':len(x['actions']),'gridCount':len(x['grids']),'hasDirectDatabaseCalls':x['hasDirectDatabaseCalls'],'screenConfidence':x['screenConfidence']} for x in screens]
(OUT/'legacyScreenSummaries.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
screen_dir=OUT/'screens'; screen_dir.mkdir(exist_ok=True)
for screen in screens: (screen_dir/(screen['id']+'.json')).write_text(json.dumps(screen,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Extracted {len(screens)} forms, {len(entries)} navigation/action entries, {sum(len(x["fields"]) for x in screens)} inputs, {sum(len(x["actions"]) for x in screens)} form actions.')
