import glob
import json
import os
import subprocess

def classify_mob_loot(item_id, mob, comment):
    if not comment:
        return None, comment

    c_lower = comment.lower().strip()

    # 1. Slime ball on slime - special case
    if item_id == 'slime_ball' and mob == 'slime':
        if 'not killed by a frog' in c_lower or 'size is small' in c_lower:
            return None, 'only small slimes (not killed by a frog)'
        if 'killed by a frog' in c_lower:
            return 'killed_by_frog', None

    # 2. Frog kill (froglights & small slimes)
    if 'killed by a' in c_lower and 'frog' in c_lower:
        if 'orange' in c_lower or 'temperate' in c_lower:
            return 'killed_by_frog', 'temperate (orange) frog, tiny magma cube'
        if 'white' in c_lower or 'warm' in c_lower:
            return 'killed_by_frog', 'warm (white) frog, tiny magma cube'
        if 'green' in c_lower or 'cold' in c_lower:
            return 'killed_by_frog', 'cold (green) frog, tiny magma cube'
        if 'tiny magma cube' in c_lower:
            return 'killed_by_frog', 'tiny magma cube'
        return 'killed_by_frog', None
    if 'when killed by a frog' in c_lower:
        return 'killed_by_frog', None

    # 3. Fox mouth hold
    if mob == 'fox' and ('mouth' in c_lower or 'holding' in c_lower):
        if '(1%)' in c_lower or '(2%)' in c_lower or '(3%)' in c_lower or '(4%)' in c_lower:
            pct = c_lower.split('(')[-1].replace(')', '').strip()
            return 'fox_mouth', f'{pct} chance when spawning'
        elif 'wheat' in c_lower:
            return 'fox_mouth', '4% chance when spawning'
        return 'fox_mouth', None

    # 4. Cat gifts
    if 'gift' in c_lower and ('cat' in c_lower or mob == 'cat' or 'waking up' in c_lower):
        if '11.291%' in c_lower or 'combined' in c_lower:
            return 'cat_gift', '70% chance for a gift when waking up (11.3% combined)'
        return 'cat_gift', '70% chance for a gift when waking up'

    # 5. Sheared
    if 'sheared' in c_lower or 'shearing' in c_lower:
        if c_lower in ['when sheared', 'by shearing its head']:
            return 'sheared', None
        if 'brown mooshroom' in c_lower:
            return 'sheared', 'only when shearing a brown mooshroom'
        if 'red mooshroom' in c_lower:
            return 'sheared', 'only when shearing a red mooshroom'
        if 'when sheared and brown' in c_lower:
            return 'sheared', 'when brown'
        if 'drops two mushrooms' in c_lower:
            return 'sheared', comment
        return 'sheared', comment

    # 6. Charged creeper
    if 'charged creeper' in c_lower:
        return 'charged_creeper', None

    # 7. Killed by skeleton / stray / bogged / parched (creeper music discs)
    if 'killed by skeleton' in c_lower or 'killed by skeleton, stray, bogged or parched' in c_lower:
        return 'killed_by_skeleton', None

    # 8. Fire aspect / on fire
    if 'fire aspect' in c_lower or 'on fire' in c_lower:
        if 'without fire aspect' in c_lower:
            return 'player_kill_only', 'without fire aspect'
        return 'fire_aspect_or_on_fire', None

    # 9. When equipped (wearing or holding)
    if 'only when wearing it' in c_lower:
        return 'when_equipped', None
    if 'only when wearing a saddle' in c_lower:
        return 'when_equipped', 'wearing a saddle'
    if 'when holding' in c_lower or 'only when holding' in c_lower or 'holding a' in c_lower or 'while holding' in c_lower:
        if (
            'stone sword' in c_lower
            or 'iron spear' in c_lower
            or 'iron sword' in c_lower
            or 'when holding one' in c_lower
            or 'when holding an axe' in c_lower
            or 'when holding a golden sword' in c_lower
        ):
            return 'when_equipped', None
        return 'when_equipped', comment

    # 10. Periodic drop
    if 'every 5-10 minutes' in c_lower or 'laid only by' in c_lower:
        if 'laid only by' in c_lower:
            variant = comment.split('laid only by')[-1].strip()
            return 'periodic_drop', f'laid by {variant} (every 5-10 min)'
        return 'periodic_drop', 'every 5-10 minutes'

    # 11. Mob interaction
    if 'digging into the ground' in c_lower:
        return 'mob_interaction', 'sniffer digging (8 min cooldown)'
    if 'when brushed' in c_lower:
        return 'mob_interaction', 'brushed'
    if 'struck by lightning' in c_lower:
        return 'mob_interaction', 'struck by lightning'
    if 'rams a hard block' in c_lower:
        return 'mob_interaction', 'when an adult goat rams a hard block (up to 2 horns per goat)'
    if 'baby pandas when sneezing' in c_lower:
        return 'mob_interaction', 'weak baby panda sneezing'
    if 'breeding two sniffers' in c_lower:
        return 'mob_interaction', 'sniffer breeding'
    if 'baby turtles drop a single scute' in c_lower:
        return 'mob_interaction', 'baby turtle growing into adult'
    if 'wither rose is placed' in c_lower:
        return 'mob_interaction', 'placed on block where mob died (dropped if cannot be placed)'
    if 'player-deflected fireball' in c_lower:
        return 'mob_interaction', 'player-deflected fireball'
    if 'chicken jockey' in c_lower:
        return 'mob_interaction', 'baby zombie from chicken jockey (player kill)'
    if 'riding a camel husk' in c_lower:
        return 'mob_interaction', 'only if riding a camel husk'
    if 'riding a zombie horse' in c_lower:
        return 'mob_interaction', 'only if riding a zombie horse'

    # 12. Player kill only
    if 'player kill' in c_lower or 'player-kill' in c_lower or 'player kills only' in c_lower or 'killed by a player' in c_lower:
        if 'looting' in c_lower:
            return 'player_kill_only', '5.5% with Looting III (Looting I: 3.5%, II: 4.5%, III: 5.5%)'
        return 'player_kill_only', None

    # Comment only
    return None, comment

def migrate_file(filepath):
    print(f'Migrating {filepath}...')
    # Use git HEAD to retrieve the original unmigrated comments to prevent degradation
    try:
        git_content = subprocess.check_output(['git', 'show', f'HEAD:{filepath}']).decode('utf-8')
        orig_data = json.loads(git_content)
        orig_items = orig_data.get('items', orig_data)
    except Exception:
        orig_items = None

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    items = data.get('items', data)
    modified_count = 0

    for item_id, item in items.items():
        if not isinstance(item, dict):
            continue
        mob_loot = item.get('obtaining', {}).get('mobLoot', [])
        orig_item = orig_items.get(item_id, {}) if orig_items else {}
        orig_mob_loot = orig_item.get('obtaining', {}).get('mobLoot', []) if orig_items else []

        for i, m in enumerate(mob_loot):
            # Prefer original comment if available
            orig_comment = orig_mob_loot[i].get('comment') if i < len(orig_mob_loot) else m.get('comment')
            mob = m.get('mob')
            req, new_c = classify_mob_loot(item_id, mob, orig_comment)
            if req is not None:
                m['specialRequirement'] = req
                modified_count += 1
            else:
                m.pop('specialRequirement', None)

            if new_c is None:
                m.pop('comment', None)
            else:
                m['comment'] = new_c

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f'Done {filepath}: updated {modified_count} mobLoot entries.')

if __name__ == '__main__':
    targets = sorted(glob.glob('public/data/versions/**/items.json', recursive=True) + ['public/data/items.json'])
    for t in targets:
        migrate_file(t)
