import json,re
from pathlib import Path
base=Path(__file__).resolve().parents[2]
data=Path(__file__).resolve().parents[1]/'src'/'data'
screens=json.loads((data/'legacyScreens.json').read_text(encoding='utf-8'))
nav=json.loads((data/'legacyNavigation.json').read_text(encoding='utf-8'))
out=base/'docs'/'frontend'/'feature-parity-matrix.md'
lines=['# EasyBook frontend feature-parity matrix','','## Status meaning','','- **Identified**: present in recovered source or menu wiring.','- **UI implemented**: the web route renders source-extracted control metadata (fields, buttons, grids, tabs and sections where present); it does not mean business behavior is complete.','- **Navigation implemented**: route is available from the app shell or source screen catalog.','- **UI interaction implemented**: local-only input, search, sort, tab, pagination or dialog state. No data is saved or posted.','- **Pending backend integration**: all database reads/writes, authentication, calculations and report output are intentionally unconnected.','- **Unverified against source**: static extraction does not fully determine the screen structure or runtime content.','','> The web app uses only clearly labeled synthetic demo rows. No recovered database content, member records, production credentials or financial values are used. A placeholder action route is not marked as a reconstructed screen.','',f'Inventory totals: **{len(screens)} Forms**, **{len(nav["entries"])} MainForm navigation/action entries** (including submenu group pages), **{sum(len(s["actions"]) for s in screens)} form actions**.','','| Legacy type | Original module | Original form / action | Original navigation path | Web route | UI implementation status | Navigation status | Actions / buttons identified | Dialogs / workflow | Source reference | Uncertainty / next review |','|---|---|---|---|---|---|---|---|---|---|---|']

def cell(s):return str(s).replace('|','\\|').replace('\n',' ')
for x in screens:
    actions=[a['label']+((' ['+a['handler']+']') if a.get('handler') else ' [no Click handler recovered]') for a in x.get('actions',[])]
    source=f'[`{x["source"]}:{x["line"]}`](../../{x["source"]}#{x["line"]})'
    ui='Implemented from recovered controls' if x['screenConfidence']=='source-backed' else 'Screen shell only; UI structure unverified'
    interaction='Local inputs, tabs, table search/sort/page, modal/preview actions' if x['screenConfidence']=='source-backed' else 'Preview-only'
    uncertain='Control labels inferred from field names where source label association was unavailable; options/required rules not fully verified; runtime query columns may be dynamic.'
    if x.get('dialogCallCount'): uncertain+=f' Source includes {x["dialogCallCount"]} MessageBox call(s); exact wording/workflows require review.'
    if not x.get('grids') and any(word in x['name'].lower() for word in ('grid','list','search','view')): uncertain+=' Listing may be populated dynamically by a query.'
    route='/app/screens/'+x['id']
    lines.append('| '+ ' | '.join(map(cell,['Form',x['category'],x['name']+' — '+(x.get('title') or 'untitled in source'),x.get('category',''),route,ui,'Implemented', '; '.join(actions) or 'No button action declarations recovered',f'{x.get("dialogCallCount",0)} source MessageBox call(s); generic preview dialogs wired; exact legacy dialog text not yet audited',source,uncertain]))+' |')
for e in nav['entries']:
    route='/app/browse/'+e['id'] if e['kind']=='group' else '/app/actions/'+e['id']
    path=' › '.join(e.get('menuPath') or [e['group'],e['label']])
    if e['kind']=='group':
        ui='Menu group page with child navigation; not a legacy form'
        workflow='Opens submenu browser; children have individual routes.'
        uncertainty='Menu hierarchy recovered from MainForm designer; items may be hidden by EasyVer/rights at runtime.'
    elif e.get('destinationScreenIds'):
        ui='Uses source-backed destination form UI'
        dest=', '.join(s['name'] for sid in e['destinationScreenIds'] for s in screens if s['id']==sid)
        workflow='Direct handler constructs '+dest+'.'
        uncertainty='Handler may choose branches or runtime behavior; backend calls are not connected.'
    else:
        ui='Action route present; screen structure not marked implemented'
        workflow='Handler '+e.get('handler','(none)')+' has no direct recovered Form construction.'
        uncertainty='Trace helper/report call to establish the exact user-visible screen before marking UI implemented.'
    source=f'[`{e["source"]}:{e["line"]}`](../../{e["source"]}#{e["line"]})'
    navstatus='Implemented' if e['kind']=='group' or e.get('destinationScreenIds') or e['kind']=='action' else 'Unverified'
    actions=e.get('handler') or 'Submenu grouping'
    lines.append('| '+ ' | '.join(map(cell,['Navigation',e['group'],e['label'],path,route,ui,navstatus,actions,workflow,source,uncertainty]))+' |')
out.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('wrote matrix rows:',len(screens)+len(nav['entries']))
