/* @ds-bundle: {"format":4,"namespace":"FootballDynasty","components":[{"name":"AppFrame"},{"name":"Button"},{"name":"CurrencyToggle"},{"name":"Money"},{"name":"StarRating"},{"name":"AttributeRating"},{"name":"AttributePanel"},{"name":"SquadTable"},{"name":"FixtureCard"},{"name":"PlayerProfile"},{"name":"FormationBoard"},{"name":"LeagueTable"},{"name":"TransferOffer"},{"name":"Inbox"},{"name":"MatchDay"},{"name":"MatchScoreboard"},{"name":"Commentary"},{"name":"MatchStats"},{"name":"MatchRatings"},{"name":"TrainingSchedule"},{"name":"DevelopmentCard"},{"name":"YouthAcademy"},{"name":"TrophyCabinet"},{"name":"SeasonHistory"},{"name":"HallOfFame"},{"name":"ClubRecords"},{"name":"ManagerCareer"},{"name":"MoneyInput"},{"name":"Icon"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState;

  /* ---------- icons (same drawings as assets/Icons) ---------- */
  var ICONS = {
    squad: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1a5.5 5.5 0 0 1 5.5-5.5h2a5.5 5.5 0 0 1 5.5 5.5v1"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18.5 13.6a5.5 5.5 0 0 1 3 4.9v1.5"/>',
    tactics: '<circle cx="6" cy="18" r="2.5"/><path d="M15 3.5l5 5M20 3.5l-5 5"/><path d="M8.5 16C10 11 13 9.5 17 11.5" stroke-dasharray="2 2.5"/><path d="m14 9.5 3 2-1.5 3"/>',
    transfers: '<path d="M4 8h15M15 4l4 4-4 4"/><path d="M20 16H5M9 12l-4 4 4 4"/>',
    finances: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    fixtures: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 17.5h.01M12 17.5h.01"/>',
    'league-table': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.3h18M3 14.7h18M8 4v16"/>',
    training: '<path d="M12 3 7 18h10L12 3Z"/><path d="M9.2 11.5h5.6"/><path d="M3 21h18"/>',
    scouting: '<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15.5h4"/><path d="M3.5 13.5 6 5h3.5v7.5M20.5 13.5 18 5h-3.5v7.5"/>',
    youth: '<path d="M12 21v-9"/><path d="M12 13C12 8.5 9 6.5 4.5 6.5 4.5 11 7.5 13 12 13Z"/><path d="M12 10.5c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6Z"/>',
    trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0V3Z"/><path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 7.5 10M17 5h2.5v1.5a3.5 3.5 0 0 1-3 3.5"/><path d="M12 14v3.5M8 21h8M9.5 17.5h5V21h-5z"/>',
    crown: '<path d="M3 18 4.5 7l4.5 4 3-6 3 6 4.5-4L21 18H3Z"/><path d="M4 21h16"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z"/>',
    injury: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>',
    booking: '<rect x="7" y="3" width="10" height="16" rx="1.5" transform="rotate(12 12 11)"/>',
    contract: '<path d="M6 3h9l4 4v14H6V3Z"/><path d="M15 3v4h4"/><path d="M9 11h7"/><path d="M9 16.5c1-2 2 0 3 0s1.5-2 3-1"/>',
    morale: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'morale-low': '<circle cx="12" cy="12" r="9"/><path d="M8.5 16c1.8-2 5.2-2 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'morale-ok': '<circle cx="12" cy="12" r="9"/><path d="M8.5 15h7"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5-6-3.5Z"/>',
    sim: '<path d="M3.5 6v12l8-6-8-6ZM12.5 6v12l8-6-8-6Z"/>',
    inbox: '<path d="M3 13 6 5h12l3 8v6H3v-6Z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
    settings: '<path d="M4 7h9M19 7h1M4 17h2M12 17h8"/><circle cx="16" cy="7" r="2.5"/><circle cx="9" cy="17" r="2.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.4-4.4"/>',
    stadium: '<ellipse cx="12" cy="8.5" rx="9" ry="3.5"/><path d="M3 8.5V16c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V8.5"/><path d="M7.5 11.5v7M16.5 11.5v7"/>',
    captain: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M14.3 10.3a2.6 2.6 0 1 0 0 3.4"/>',
    'trend-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    'trend-down': '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
    pitch: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M12 4v16"/><circle cx="12" cy="12" r="3"/><path d="M2.5 9h3v6h-3M21.5 9h-3v6h3"/>',
    'chevron-up': '<path d="m6 15 6-6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>'
  };

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  function Icon(p) {
    var size = p.size || 20;
    return h('svg', {
      className: cx('fd-icon', p.className),
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      role: p.label ? 'img' : undefined, 'aria-label': p.label, 'aria-hidden': p.label ? undefined : true,
      dangerouslySetInnerHTML: { __html: ICONS[p.name] || '' }
    });
  }

  /* ---------- money ---------- */
  var CURRENCIES = {
    EUR: { symbol: '€', label: 'Euro' },
    USD: { symbol: '$', label: 'US dollar' },
    GBP: { symbol: '£', label: 'Pound sterling' }
  };

  function compact(n) {
    var a = Math.abs(n);
    if (a >= 1e9) return (a / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
    if (a >= 1e6) return (a / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return Math.round(a / 1e3) + 'k';
    return String(Math.round(a));
  }

  /** Formats an amount that is ALREADY in the chosen currency. */
  function formatMoney(amount, currency, opts) {
    opts = opts || {};
    var c = CURRENCIES[currency] || CURRENCIES.EUR;
    var sign = amount < 0 ? '−' : (opts.signed && amount > 0 ? '+' : '');
    var body = opts.full ? Math.round(Math.abs(amount)).toLocaleString('en-GB') : compact(amount);
    return sign + c.symbol + body + (opts.perWeek ? '/wk' : '');
  }

  function Money(p) {
    var currency = p.currency || 'EUR';
    var text = formatMoney(p.amount, currency, { perWeek: p.perWeek, signed: p.signed, full: p.full });
    var tone = p.signed ? (p.amount < 0 ? 'fd-money--neg' : p.amount > 0 ? 'fd-money--pos' : '') : '';
    return h('span', { className: cx('fd-money', tone, p.className), title: formatMoney(p.amount, currency, { full: true, perWeek: p.perWeek, signed: p.signed }) }, text);
  }

  function CurrencyToggle(p) {
    var value = p.value || 'EUR';
    return h('div', { className: 'fd-currency', role: 'radiogroup', 'aria-label': 'Display currency' },
      ['EUR', 'USD', 'GBP'].map(function (code) {
        var on = code === value;
        return h('button', {
          key: code, type: 'button', role: 'radio', 'aria-checked': on,
          className: cx('fd-currency__opt', on && 'is-on'), title: CURRENCIES[code].label,
          onClick: function () { if (p.onChange) p.onChange(code); }
        }, CURRENCIES[code].symbol);
      }));
  }

  /* ---------- ratings ---------- */
  /* Visible attributes are 1–20. Every player also has a HIDDEN Current Ability (CA)
     and Potential Ability (PA) from 1 to 200. Stars are CA/PA shown as 0.5–5 stars
     (half steps): gold for senior players, silver for youth players (in the U18 or U21
     squad, or on a youth contract). */
  var ATTRIBUTE_GROUPS = {
    Technical: ['Corners', 'Crossing', 'Dribbling', 'Finishing', 'First Touch', 'Free Kicks', 'Heading', 'Long Shots', 'Marking', 'Passing', 'Penalties', 'Tackling', 'Technique'],
    Mental: ['Aggression', 'Anticipation', 'Bravery', 'Composure', 'Concentration', 'Decisions', 'Determination', 'Flair', 'Leadership', 'Off the Ball', 'Positioning', 'Teamwork', 'Vision', 'Work Rate'],
    Physical: ['Acceleration', 'Agility', 'Balance', 'Jumping Reach', 'Natural Fitness', 'Pace', 'Stamina', 'Strength'],
    Goalkeeping: ['Aerial Reach', 'Command of Area', 'Communication', 'Handling', 'Kicking', 'One on Ones', 'Reflexes', 'Rushing Out', 'Throwing']
  };
  var GK_ATTRS = ATTRIBUTE_GROUPS.Goalkeeping;
  /* key attributes weigh 3, important 2, the rest 1; GK attributes are 0 for outfielders
     and outfield technique (except passing / first touch) is 0 for keepers. */
  var POSITION_WEIGHTS = {
    GK: { key: ['Reflexes', 'Handling', 'One on Ones', 'Aerial Reach', 'Positioning', 'Command of Area'], imp: ['Communication', 'Kicking', 'Concentration', 'Decisions', 'Agility', 'Rushing Out'] },
    CB: { key: ['Marking', 'Tackling', 'Heading', 'Positioning', 'Jumping Reach', 'Strength'], imp: ['Anticipation', 'Concentration', 'Bravery', 'Decisions', 'Pace', 'Composure'] },
    FB: { key: ['Tackling', 'Pace', 'Stamina', 'Crossing', 'Positioning', 'Work Rate'], imp: ['Marking', 'Acceleration', 'Dribbling', 'Teamwork', 'Anticipation', 'Passing'] },
    DM: { key: ['Tackling', 'Positioning', 'Passing', 'Anticipation', 'Teamwork', 'Decisions'], imp: ['Marking', 'Concentration', 'Stamina', 'Strength', 'Composure', 'Work Rate'] },
    CM: { key: ['Passing', 'Decisions', 'Vision', 'First Touch', 'Teamwork', 'Stamina'], imp: ['Technique', 'Anticipation', 'Composure', 'Work Rate', 'Tackling', 'Off the Ball'] },
    AM: { key: ['Passing', 'Vision', 'Technique', 'First Touch', 'Decisions', 'Flair'], imp: ['Dribbling', 'Off the Ball', 'Composure', 'Long Shots', 'Agility', 'Anticipation'] },
    W: { key: ['Dribbling', 'Pace', 'Acceleration', 'Crossing', 'Technique', 'Flair'], imp: ['Agility', 'Off the Ball', 'First Touch', 'Passing', 'Finishing', 'Work Rate'] },
    ST: { key: ['Finishing', 'Off the Ball', 'Composure', 'First Touch', 'Anticipation', 'Acceleration'], imp: ['Heading', 'Dribbling', 'Strength', 'Technique', 'Pace', 'Decisions'] }
  };
  var POS_GROUP = { GK: 'GK', CB: 'CB', LB: 'FB', RB: 'FB', LWB: 'FB', RWB: 'FB', DM: 'DM', CM: 'CM', AM: 'AM', LM: 'W', RM: 'W', LW: 'W', RW: 'W', ST: 'ST' };

  function attributeWeight(attr, pos) {
    var g = POSITION_WEIGHTS[POS_GROUP[pos] || 'CM'];
    if (g.key.indexOf(attr) >= 0) return 3;
    if (g.imp.indexOf(attr) >= 0) return 2;
    var isGK = POS_GROUP[pos] === 'GK', gkAttr = GK_ATTRS.indexOf(attr) >= 0;
    if (!isGK && gkAttr) return 0;
    if (isGK && ATTRIBUTE_GROUPS.Technical.indexOf(attr) >= 0 && attr !== 'Passing' && attr !== 'First Touch') return 0;
    return 1;
  }

  /** Position-weighted average of 1–20 attributes → Current Ability 1–200. */
  function abilityFromAttributes(attributes, pos) {
    var sum = 0, w = 0;
    Object.keys(attributes || {}).forEach(function (k) {
      var wt = attributeWeight(k, pos); sum += attributes[k] * wt; w += wt;
    });
    if (!w) return 1;
    return Math.max(1, Math.min(200, Math.round(((sum / w) - 1) / 19 * 199 + 1)));
  }

  /** CA/PA → stars 0.5–5 in half steps, relative to a comparison scale {low, high}
      (default the whole game, 1–200). With your league's lowest and highest CA, the
      league's best player shows five stars. */
  function starScore(ability, scale) {
    var low = scale ? scale.low : 1, high = scale ? scale.high : 200;
    var v = (ability - low) / Math.max(1, high - low) * 5;
    return Math.max(0.5, Math.min(5, Math.round(v * 2) / 2));
  }

  var YOUTH_SQUADS = ['U18', 'U21'];
  /** Youth = registered to the U18 or U21 squad, or on a youth contract. Age alone
      never counts: a 17-year-old in the first team on a senior contract is gold. */
  function isYouth(player) {
    if (!player) return false;
    if (typeof player.youth === 'boolean') return player.youth;
    return YOUTH_SQUADS.indexOf(player.squad) >= 0 || player.contractType === 'youth';
  }

  var STAR_PATH = 'M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z';

  /** value: 0.5–5 stars, or `ability` (+ `scale`). range: [low, high] for an unsure
      rating (potential not fully scouted): solid to low, faint to high.
      youth: silver stars instead of gold. */
  function StarRating(p) {
    var hi, lo;
    if (p.range) { lo = p.range[0]; hi = p.range[1]; }
    else { hi = lo = typeof p.value === 'number' ? p.value : starScore(p.ability || 1, p.scale); }
    var tier = p.youth ? 'silver' : 'gold';
    var size = p.size || 16;
    var label = (p.potential ? 'Potential ' : 'Ability ') + (lo === hi ? lo : lo + ' to ' + hi) + ' of 5 stars' + (p.youth ? ' (youth)' : '');
    var stars = [];
    for (var i = 0; i < 5; i++) {
      var f1 = Math.max(0, Math.min(1, lo - i)), f2 = Math.max(0, Math.min(1, hi - i));
      stars.push(h('span', { key: i, className: 'fd-star', style: { width: size, height: size } },
        h('svg', { viewBox: '0 0 24 24', width: size, height: size, className: 'fd-star__empty' }, h('path', { d: STAR_PATH })),
        f2 > f1 ? h('span', { className: 'fd-star__fill fd-star__fill--range', style: { width: (f2 * 100) + '%' } },
          h('svg', { viewBox: '0 0 24 24', width: size, height: size }, h('path', { d: STAR_PATH }))) : null,
        f1 > 0 ? h('span', { className: 'fd-star__fill', style: { width: (f1 * 100) + '%' } },
          h('svg', { viewBox: '0 0 24 24', width: size, height: size }, h('path', { d: STAR_PATH }))) : null));
    }
    return h('span', { className: cx('fd-stars', 'fd-stars--' + tier, p.potential && 'fd-stars--potential', p.className), role: 'img', 'aria-label': label, title: label },
      stars, p.showLabel && p.youth ? h('span', { className: 'fd-stars__label' }, 'Youth') : null);
  }

  function attrBand(v) { return v >= 16 ? 'elite' : v >= 11 ? 'good' : v >= 6 ? 'average' : 'poor'; }

  /** One 1–20 attribute. `range` [lo, hi] when scouting is incomplete; `hidden` for unknown. */
  function AttributeRating(p) {
    var name = p.name ? h('span', { className: 'fd-attr__name' }, p.name) : null;
    if (p.hidden) return h('span', { className: cx('fd-attr', 'fd-attr--unknown', p.className), title: (p.name || '') + ': not scouted' }, name, h('span', { className: 'fd-attr__val' }, '–'));
    if (p.range) {
      var lo = Math.max(1, Math.round(p.range[0])), hi = Math.min(20, Math.round(p.range[1]));
      return h('span', { className: cx('fd-attr', 'fd-attr--' + attrBand((lo + hi) / 2), 'fd-attr--range', p.className), title: (p.name ? p.name + ': ' : '') + lo + '–' + hi + ' (scouting estimate)' },
        name, h('span', { className: 'fd-attr__val' }, lo + '–' + hi));
    }
    var v = Math.max(1, Math.min(20, Math.round(p.value)));
    return h('span', { className: cx('fd-attr', 'fd-attr--' + attrBand(v), p.highlight && 'fd-attr--key', p.className), title: p.name ? p.name + ': ' + v + '/20' : v + '/20' },
      name, h('span', { className: 'fd-attr__val' }, v));
  }

  /** The profile's attribute block: Technical / Mental / Physical (Goalkeeping for keepers),
      key attributes for the position marked. */
  function AttributePanel(p) {
    var attrs = p.attributes || {}, pos = p.position || 'CM', isGK = POS_GROUP[pos] === 'GK';
    var groups = isGK ? ['Goalkeeping', 'Mental', 'Physical'] : ['Technical', 'Mental', 'Physical'];
    var known = typeof p.knowledge === 'number' ? p.knowledge : 100;
    return h('div', { className: cx('fd-attrs', p.className) },
      groups.map(function (g) {
        return h('section', { key: g, className: 'fd-attrs__col' },
          h('h4', { className: 'fd-attrs__head' }, g),
          ATTRIBUTE_GROUPS[g].map(function (a) {
            var v = attrs[a], w = attributeWeight(a, pos);
            var props = { key: a, name: a, highlight: w === 3, className: w === 3 ? 'fd-attr--key' : undefined };
            if (v == null) props.hidden = true;
            else if (known < 100) {
              var spread = Math.round((100 - known) / 100 * 6);
              props.range = [v - spread, v + spread];
              if (known < 20) props.hidden = true;
            } else props.value = v;
            return h(AttributeRating, props);
          }));
      }));
  }

  /* ---------- button ---------- */
  function Button(p) {
    var variant = p.variant || 'primary';
    return h('button', {
      type: p.type || 'button', disabled: p.disabled, onClick: p.onClick,
      className: cx('fd-btn', 'fd-btn--' + variant, p.size === 'sm' && 'fd-btn--sm', p.className)
    }, p.icon ? h(Icon, { name: p.icon, size: p.size === 'sm' ? 16 : 18 }) : null, p.children);
  }

  /* ---------- squad table ---------- */
  var POS_ORDER = { GK: 0, CB: 1, LB: 2, RB: 3, LWB: 4, RWB: 5, DM: 6, CM: 7, LM: 8, RM: 9, AM: 10, LW: 11, RW: 12, ST: 13 };
  var MORALE = { high: ['morale', 'High morale', 'fd-ok'], ok: ['morale-ok', 'Okay morale', 'fd-muted'], low: ['morale-low', 'Low morale', 'fd-warn'] };

  function SquadTable(p) {
    var currency = p.currency || 'EUR';
    var st = useState({ key: p.defaultSort || 'pos', dir: 1 });
    var sort = st[0], setSort = st[1];
    var scale = p.scale;
    var rows = (p.players || []).map(function (pl) {
      var ca = typeof pl.ability === 'number' ? pl.ability : abilityFromAttributes(pl.attributes, pl.pos);
      var pa = typeof pl.potential === 'number' ? pl.potential : ca;
      var known = typeof pl.knowledge === 'number' ? pl.knowledge : 100;
      var paLo = known >= 100 ? pa : Math.max(ca, pa - Math.round((100 - known) * 0.6));
      var paHi = known >= 100 ? pa : Math.min(200, pa + Math.round((100 - known) * 0.4));
      return Object.assign({}, pl, { ca: ca, abilityScore: starScore(ca, scale), potentialScore: starScore(pa, scale),
        potentialRange: [starScore(paLo, scale), starScore(paHi, scale)] });
    });
    var getters = {
      number: function (r) { return r.number; }, name: function (r) { return r.name; },
      pos: function (r) { return POS_ORDER[r.pos] == null ? 99 : POS_ORDER[r.pos]; }, age: function (r) { return r.age; },
      ability: function (r) { return r.ca; }, potential: function (r) { return r.potentialRange[1]; },
      wage: function (r) { return r.wage; }, contract: function (r) { return r.contractEnd; }
    };
    rows.sort(function (a, b) {
      var g = getters[sort.key], x = g(a), y = g(b);
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
    function th(key, label, cls) {
      var on = sort.key === key;
      return h('th', { className: cls, 'aria-sort': on ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none', scope: 'col' },
        h('button', { type: 'button', className: cx('fd-th', on && 'is-on'),
          onClick: function () { setSort({ key: key, dir: on ? -sort.dir : (key === 'ability' || key === 'potential' || key === 'wage' ? -1 : 1) }); } },
          label, on ? h(Icon, { name: sort.dir > 0 ? 'chevron-up' : 'chevron-down', size: 12 }) : null));
    }
    return h('div', { className: cx('fd-table-wrap', p.className) },
      h('table', { className: 'fd-table' },
        h('thead', null, h('tr', null,
          th('number', '#', 'fd-num'), th('name', 'Player'), th('pos', 'Pos'), th('age', 'Age', 'fd-num'),
          th('ability', 'Ability'), th('potential', 'Potential'), h('th', { scope: 'col' }, h('span', { className: 'fd-th' }, 'Morale')),
          th('wage', 'Wage', 'fd-num'), th('contract', 'Contract', 'fd-num'))),
        h('tbody', null, rows.map(function (r) {
          var m = MORALE[r.morale] || MORALE.ok;
          return h('tr', { key: r.id || r.name, className: r.selected ? 'is-selected' : undefined, onClick: p.onSelect ? function () { p.onSelect(r); } : undefined },
            h('td', { className: 'fd-num fd-muted' }, r.number),
            h('td', null, h('div', { className: 'fd-player' },
              h('span', { className: 'fd-player__name' }, r.name),
              r.captain ? h(Icon, { name: 'captain', size: 16, className: 'fd-gold', label: 'Captain' }) : null,
              r.status === 'injured' ? h('span', { className: 'fd-tag fd-tag--loss' }, h(Icon, { name: 'injury', size: 12 }), 'Injured') : null,
              r.status === 'suspended' ? h('span', { className: 'fd-tag fd-tag--loss' }, h(Icon, { name: 'booking', size: 12 }), 'Suspended') : null,
              r.status === 'expiring' ? h('span', { className: 'fd-tag fd-tag--warn' }, 'Expiring') : null)),
            h('td', null, h('span', { className: 'fd-pos' }, r.pos)),
            h('td', { className: 'fd-num' }, r.age),
            h('td', null, h(StarRating, { value: r.abilityScore, size: 14, youth: isYouth(r) })),
            h('td', null, h(StarRating, { range: r.potentialRange, size: 14, potential: true, youth: isYouth(r) })),
            h('td', null, h('span', { className: m[2] }, h(Icon, { name: m[0], size: 18, label: m[1] }))),
            h('td', { className: 'fd-num' }, h(Money, { amount: r.wage, currency: currency, perWeek: true })),
            h('td', { className: 'fd-num fd-muted' }, r.contractEnd));
        }))));
  }

  /* ---------- fixture card ---------- */
  function TeamSide(t, side) {
    return h('div', { className: cx('fd-fixture__team', 'fd-fixture__team--' + side, t.isUser && 'is-user') },
      t.crest ? h('img', { className: 'fd-fixture__crest', src: t.crest, alt: '' }) : h('span', { className: 'fd-fixture__badge', 'aria-hidden': true }, (t.short || t.name).slice(0, 3).toUpperCase()),
      h('span', { className: 'fd-fixture__name' }, t.name),
      t.form ? h('span', { className: 'fd-fixture__form', 'aria-label': 'Form: ' + t.form.join(' ') }, t.form.map(function (f, i) {
        return h('span', { key: i, className: 'fd-form fd-form--' + f }, f);
      })) : null);
  }

  function FixtureCard(p) {
    var played = p.status === 'FT' || p.status === 'live';
    var result = null;
    if (p.status === 'FT' && p.score) {
      var userHome = p.home.isUser, userAway = p.away.isUser;
      if (userHome || userAway) {
        var us = userHome ? p.score[0] : p.score[1], them = userHome ? p.score[1] : p.score[0];
        result = us > them ? 'W' : us < them ? 'L' : 'D';
      }
    }
    return h('article', { className: cx('fd-fixture', p.className) },
      h('header', { className: 'fd-fixture__meta' },
        h('span', null, p.competition), h('span', null, p.matchday),
        p.status === 'live' ? h('span', { className: 'fd-live' }, 'Live ' + (p.minute || '') + '′') : h('span', null, p.status === 'FT' ? 'Full time' : p.date)),
      h('div', { className: 'fd-fixture__board' },
        TeamSide(p.home, 'home'),
        h('div', { className: 'fd-fixture__score', 'aria-label': played ? p.home.name + ' ' + p.score[0] + ', ' + p.away.name + ' ' + p.score[1] : 'Kick-off ' + p.kickoff },
          played ? [h('span', { key: 'h' }, p.score[0]), h('span', { key: 'd', className: 'fd-fixture__dash' }, '–'), h('span', { key: 'a' }, p.score[1])]
            : h('span', { className: 'fd-fixture__ko' }, p.kickoff || 'vs')),
        TeamSide(p.away, 'away')),
      (result || p.venue || p.action) ? h('footer', { className: 'fd-fixture__foot' },
        result ? h('span', { className: 'fd-result fd-result--' + result }, result === 'W' ? 'Win' : result === 'L' ? 'Defeat' : 'Draw') : null,
        p.venue ? h('span', { className: 'fd-muted' }, h(Icon, { name: 'stadium', size: 16 }), p.venue) : null,
        p.action || null) : null);
  }

  /* ---------- app frame ---------- */
  var DEFAULT_NAV = [
    { id: 'home', label: 'Home', icon: 'home' }, { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    { id: 'squad', label: 'Squad', icon: 'squad' }, { id: 'tactics', label: 'Tactics', icon: 'tactics' },
    { id: 'training', label: 'Training', icon: 'training' }, { id: 'fixtures', label: 'Fixtures', icon: 'fixtures' },
    { id: 'table', label: 'League table', icon: 'league-table' }, { id: 'transfers', label: 'Transfers', icon: 'transfers' },
    { id: 'scouting', label: 'Scouting', icon: 'scouting' }, { id: 'youth', label: 'Academy', icon: 'youth' },
    { id: 'finances', label: 'Finances', icon: 'finances' }, { id: 'history', label: 'Club history', icon: 'trophy' }
  ];

  function AppFrame(p) {
    var nav = p.nav || DEFAULT_NAV;
    var currency = p.currency || 'EUR';
    return h('div', { className: cx('fd-app', p.className) },
      h('header', { className: 'fd-topbar' },
        h('div', { className: 'fd-topbar__brand' },
          p.crestSrc ? h('img', { src: p.crestSrc, alt: 'Football Dynasty', className: 'fd-topbar__crest' }) : null,
          h('span', { className: 'fd-topbar__game' }, 'Football Dynasty')),
        h('div', { className: 'fd-topbar__club' },
          h('span', { className: 'fd-topbar__clubname' }, p.club),
          p.season ? h('span', { className: 'fd-topbar__date' }, p.season) : null),
        h('div', { className: 'fd-topbar__right' },
          p.budget != null ? h('span', { className: 'fd-topbar__budget' }, h('span', { className: 'fd-label' }, 'Transfer budget'), h(Money, { amount: p.budget, currency: currency })) : null,
          h(CurrencyToggle, { value: currency, onChange: p.onCurrencyChange }),
          p.primaryAction || null)),
      h('div', { className: 'fd-app__body' },
        h('nav', { className: 'fd-sidebar', 'aria-label': 'Main' },
          nav.map(function (n) {
            var on = n.id === p.active;
            return h('button', { key: n.id, type: 'button', className: cx('fd-nav', on && 'is-on'), 'aria-current': on ? 'page' : undefined,
              onClick: function () { if (p.onNavigate) p.onNavigate(n.id); } },
              h(Icon, { name: n.icon, size: 20 }), h('span', null, n.label),
              n.badge ? h('span', { className: 'fd-nav__badge' }, n.badge) : null);
          })),
        h('main', { className: 'fd-main' }, p.children)));
  }

  /* ---------- player profile ---------- */
  var FAMILIARITY = ['natural', 'accomplished', 'competent', 'unconvincing', 'awkward'];
  var FAM_LABEL = { natural: 'Natural', accomplished: 'Accomplished', competent: 'Competent', unconvincing: 'Unconvincing', awkward: 'Awkward' };

  function PositionChips(p) {
    var pos = p.positions || {};
    var keys = Object.keys(pos).sort(function (a, b) { return FAMILIARITY.indexOf(pos[a]) - FAMILIARITY.indexOf(pos[b]); });
    return h('div', { className: 'fd-poschips' }, keys.map(function (k) {
      return h('span', { key: k, className: 'fd-poschip fd-poschip--' + pos[k], title: k + ': ' + FAM_LABEL[pos[k]] }, k, h('span', { className: 'fd-poschip__lvl' }, FAM_LABEL[pos[k]]));
    }));
  }

  function Fact(label, value) {
    return h('div', { className: 'fd-fact' }, h('span', { className: 'fd-label' }, label), h('span', { className: 'fd-fact__val' }, value));
  }

  function PlayerProfile(p) {
    var pl = p.player || {};
    var currency = p.currency || 'EUR';
    var youth = isYouth(pl);
    var ca = typeof pl.ability === 'number' ? pl.ability : abilityFromAttributes(pl.attributes, pl.pos);
    var known = typeof pl.knowledge === 'number' ? pl.knowledge : 100;
    var pa = typeof pl.potential === 'number' ? pl.potential : ca;
    var paLo = known >= 100 ? pa : Math.max(ca, pa - Math.round((100 - known) * 0.6));
    var paHi = known >= 100 ? pa : Math.min(200, pa + Math.round((100 - known) * 0.4));
    var report = pl.report || {};
    return h('article', { className: cx('fd-profile', p.className) },
      h('header', { className: 'fd-profile__head' },
        h('span', { className: 'fd-profile__num' }, pl.number != null ? pl.number : '–'),
        h('div', { className: 'fd-profile__id' },
          h('h2', { className: 'fd-profile__name' }, pl.name),
          h('div', { className: 'fd-profile__sub' }, [pl.pos, pl.age != null ? pl.age + ' yrs' : null, pl.nationality, pl.club].filter(Boolean).join(' · ')),
          h(PositionChips, { positions: pl.positions })),
        h('div', { className: 'fd-profile__ratings' },
          h('div', { className: 'fd-profile__rating' }, h('span', { className: 'fd-label' }, 'Ability'), h(StarRating, { value: starScore(ca, p.scale), size: 22, youth: youth })),
          h('div', { className: 'fd-profile__rating' }, h('span', { className: 'fd-label' }, 'Potential'),
            h(StarRating, { range: [starScore(paLo, p.scale), starScore(paHi, p.scale)], size: 22, potential: true, youth: youth })),
          known < 100 ? h('span', { className: 'fd-muted fd-profile__known' }, h(Icon, { name: 'scouting', size: 14 }), 'Scouting knowledge ' + known + '%') : null),
        p.actions ? h('div', { className: 'fd-profile__actions' }, p.actions) : null),
      h('div', { className: 'fd-profile__facts' },
        pl.value != null ? Fact('Value', h(Money, { amount: pl.value, currency: currency })) : null,
        pl.wage != null ? Fact('Wage', h(Money, { amount: pl.wage, currency: currency, perWeek: true })) : null,
        pl.contractEnd ? Fact('Contract', 'Until ' + pl.contractEnd) : null,
        pl.morale ? Fact('Morale', h('span', { className: MORALE[pl.morale][2] }, h(Icon, { name: MORALE[pl.morale][0], size: 16 }), ' ' + MORALE[pl.morale][1].replace(' morale', ''))) : null,
        pl.foot ? Fact('Preferred foot', pl.foot) : null,
        pl.height ? Fact('Height', pl.height) : null),
      h('div', { className: 'fd-profile__body' },
        h('section', { className: 'fd-profile__attrs' }, h(AttributePanel, { attributes: pl.attributes, position: pl.pos, knowledge: known })),
        h('aside', { className: 'fd-profile__side' },
          h('section', { className: 'fd-panel' },
            h('h3', { className: 'fd-panel__title' }, h(Icon, { name: 'scouting', size: 16 }), 'Scout report'),
            report.summary ? h('p', { className: 'fd-panel__text' }, report.summary) : null,
            report.pros ? h('ul', { className: 'fd-list fd-list--pro' }, report.pros.map(function (t, i) { return h('li', { key: i }, h(Icon, { name: 'trend-up', size: 14 }), t); })) : null,
            report.cons ? h('ul', { className: 'fd-list fd-list--con' }, report.cons.map(function (t, i) { return h('li', { key: i }, h(Icon, { name: 'trend-down', size: 14 }), t); })) : null,
            report.traits ? h('div', { className: 'fd-traits' }, report.traits.map(function (t, i) { return h('span', { key: i, className: 'fd-trait' }, t); })) : null),
          pl.history ? h('section', { className: 'fd-panel' },
            h('h3', { className: 'fd-panel__title' }, h(Icon, { name: 'trophy', size: 16 }), 'Career'),
            h('table', { className: 'fd-mini' },
              h('thead', null, h('tr', null, ['Season', 'Club', 'Apps', 'Gls', 'Avg'].map(function (c, i) { return h('th', { key: c, className: i > 1 ? 'fd-num' : undefined }, c); }))),
              h('tbody', null, pl.history.map(function (r, i) {
                return h('tr', { key: i }, h('td', null, r.season), h('td', null, r.club, r.honour ? h(Icon, { name: 'trophy', size: 12, className: 'fd-gold', label: r.honour }) : null),
                  h('td', { className: 'fd-num' }, r.apps), h('td', { className: 'fd-num' }, r.goals), h('td', { className: 'fd-num' }, r.rating != null ? r.rating.toFixed(2) : '–'));
              })))) : null)));
  }

  /* ---------- formation board ---------- */
  var FORMATIONS = {
    '4-3-3': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 75], ['CB', 63, 75], ['RB', 86, 70], ['CM', 28, 49], ['CM', 50, 54], ['CM', 72, 49], ['LW', 17, 23], ['ST', 50, 16], ['RW', 83, 23]],
    '4-4-2': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 75], ['CB', 63, 75], ['RB', 86, 70], ['LM', 14, 45], ['CM', 38, 50], ['CM', 62, 50], ['RM', 86, 45], ['ST', 38, 18], ['ST', 62, 18]],
    '4-2-3-1': [['GK', 50, 90], ['LB', 14, 70], ['CB', 37, 75], ['CB', 63, 75], ['RB', 86, 70], ['DM', 37, 57], ['DM', 63, 57], ['LW', 17, 35], ['AM', 50, 37], ['RW', 83, 35], ['ST', 50, 14]],
    '3-5-2': [['GK', 50, 90], ['CB', 28, 74], ['CB', 50, 77], ['CB', 72, 74], ['LWB', 10, 47], ['CM', 33, 47], ['DM', 50, 58], ['CM', 67, 47], ['RWB', 90, 47], ['ST', 38, 18], ['ST', 62, 18]]
  };

  function fits(player, slot) {
    if (!player) return 'empty';
    var pos = player.positions;
    if (pos && pos[slot]) return pos[slot];
    if (player.pos === slot) return 'natural';
    return pos ? 'awkward' : 'competent';
  }

  function surname(n) { var s = String(n || ''), i = s.indexOf(' '); return i < 0 ? s : s.slice(i + 1); }

  function FormationBoard(p) {
    var fs = useState(p.formation || '4-3-3'), formation = p.onFormationChange ? (p.formation || '4-3-3') : fs[0];
    var ls = useState(p.lineup || []), bs = useState(p.bench || []);
    var lineup = p.onChange ? (p.lineup || []) : ls[0], bench = p.onChange ? (p.bench || []) : bs[0];
    var sel = useState(null), selected = sel[0], setSelected = sel[1];
    var slots = FORMATIONS[formation] || FORMATIONS['4-3-3'];
    function commit(l, b) { if (p.onChange) p.onChange(l, b); else { ls[1](l); bs[1](b); } }
    function pick(where, i) {
      if (!selected) { setSelected({ where: where, i: i }); return; }
      if (selected.where === where && selected.i === i) { setSelected(null); return; }
      var l = lineup.slice(), b = bench.slice();
      var get = function (s) { return s.where === 'xi' ? l[s.i] : b[s.i]; };
      var set = function (s, v) { if (s.where === 'xi') l[s.i] = v; else b[s.i] = v; };
      var a = get(selected), c = get({ where: where, i: i });
      set(selected, c); set({ where: where, i: i }, a);
      commit(l, b.filter(Boolean)); setSelected(null);
    }
    function changeFormation(f) { if (p.onFormationChange) p.onFormationChange(f); else fs[1](f); }
    return h('div', { className: cx('fd-formation', p.className) },
      h('div', { className: 'fd-formation__bar' },
        h('span', { className: 'fd-label' }, 'Formation'),
        h('div', { className: 'fd-seg', role: 'radiogroup', 'aria-label': 'Formation' }, Object.keys(FORMATIONS).map(function (f) {
          return h('button', { key: f, type: 'button', role: 'radio', 'aria-checked': f === formation, className: cx('fd-seg__opt', f === formation && 'is-on'), onClick: function () { changeFormation(f); } }, f);
        })),
        h('span', { className: 'fd-muted fd-formation__hint' }, selected ? 'Now pick a player to swap with' : 'Pick two players to swap them')),
      h('div', { className: 'fd-formation__main' },
        h('div', { className: 'fd-pitch', role: 'group', 'aria-label': 'Starting eleven, ' + formation },
          h('svg', { className: 'fd-pitch__lines', viewBox: '0 0 100 140', preserveAspectRatio: 'none', 'aria-hidden': true },
            h('rect', { x: 3, y: 3, width: 94, height: 134 }), h('line', { x1: 3, y1: 70, x2: 97, y2: 70 }), h('circle', { cx: 50, cy: 70, r: 11 }),
            h('rect', { x: 24, y: 3, width: 52, height: 20 }), h('rect', { x: 38, y: 3, width: 24, height: 7 }),
            h('rect', { x: 24, y: 117, width: 52, height: 20 }), h('rect', { x: 38, y: 130, width: 24, height: 7 })),
          slots.map(function (s, i) {
            var pl = lineup[i], fit = fits(pl, s[0]), on = selected && selected.where === 'xi' && selected.i === i;
            return h('button', { key: i, type: 'button', className: cx('fd-slot', 'fd-slot--' + fit, on && 'is-selected'), style: { left: s[1] + '%', top: s[2] + '%' },
              onClick: function () { pick('xi', i); }, 'aria-pressed': !!on,
              'aria-label': s[0] + ': ' + (pl ? pl.name + (fit !== 'natural' && fit !== 'accomplished' ? ', ' + FAM_LABEL[fit] + ' here' : '') : 'empty') },
              h('span', { className: 'fd-slot__disc' }, pl ? pl.number : '+'),
              h('span', { className: 'fd-slot__name' }, pl ? surname(pl.name) : s[0]),
              h('span', { className: 'fd-slot__pos' }, s[0], fit === 'unconvincing' || fit === 'awkward' ? ' · ' + FAM_LABEL[fit] : ''));
          })),
        h('div', { className: 'fd-bench' },
          h('h4', { className: 'fd-label' }, 'Substitutes'),
          bench.map(function (pl, i) {
            var on = selected && selected.where === 'bench' && selected.i === i;
            return h('button', { key: pl.name, type: 'button', className: cx('fd-bench__row', on && 'is-selected'), onClick: function () { pick('bench', i); }, 'aria-pressed': !!on },
              h('span', { className: 'fd-bench__num' }, pl.number), h('span', { className: 'fd-bench__name' }, pl.name), h('span', { className: 'fd-pos' }, pl.pos));
          }))));
  }

  /* ---------- league table ---------- */
  function LeagueTable(p) {
    var z = p.zones || {};
    var rows = (p.rows || []).map(function (r) { return Object.assign({ gd: r.gf - r.ga }, r); });
    rows.sort(function (a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || String(a.club).localeCompare(b.club); });
    var n = rows.length;
    function zone(i) {
      var pos = i + 1;
      if (z.champions && pos <= z.champions) return 'champ';
      if (z.promotion && pos <= z.promotion) return 'promo';
      if (z.playoff && pos >= z.playoff[0] && pos <= z.playoff[1]) return 'playoff';
      if (z.relegation && pos > n - z.relegation) return 'releg';
      return '';
    }
    var legend = [];
    if (z.champions) legend.push(['champ', z.championsLabel || 'Continental cup']);
    if (z.promotion) legend.push(['promo', z.promotionLabel || 'Promotion']);
    if (z.playoff) legend.push(['playoff', z.playoffLabel || 'Play-offs']);
    if (z.relegation) legend.push(['releg', z.relegationLabel || 'Relegation']);
    return h('div', { className: cx('fd-league', p.className) },
      h('div', { className: 'fd-table-wrap' },
        h('table', { className: 'fd-table fd-table--league' },
          p.title ? h('caption', { className: 'fd-league__cap' }, p.title) : null,
          h('thead', null, h('tr', null,
            ['Pos', 'Club', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts', 'Form'].map(function (c, i) {
              if (p.compact && (c === 'GF' || c === 'GA' || c === 'Form')) return null;
              return h('th', { key: c, scope: 'col', className: i !== 1 && i !== 10 ? 'fd-num' : undefined }, h('span', { className: 'fd-th' }, c));
            }))),
          h('tbody', null, rows.map(function (r, i) {
            var zz = zone(i);
            return h('tr', { key: r.club, className: cx(zz && 'fd-zone fd-zone--' + zz, r.isUser && 'is-user') },
              h('td', { className: 'fd-num fd-league__pos' }, i + 1),
              h('td', null, h('span', { className: 'fd-league__club' }, r.club)),
              h('td', { className: 'fd-num' }, r.p), h('td', { className: 'fd-num' }, r.w), h('td', { className: 'fd-num' }, r.d), h('td', { className: 'fd-num' }, r.l),
              p.compact ? null : h('td', { className: 'fd-num fd-muted' }, r.gf), p.compact ? null : h('td', { className: 'fd-num fd-muted' }, r.ga),
              h('td', { className: 'fd-num' }, (r.gd > 0 ? '+' : r.gd < 0 ? '−' : '') + Math.abs(r.gd)),
              h('td', { className: 'fd-num fd-league__pts' }, r.pts),
              p.compact ? null : h('td', null, r.form ? h('span', { className: 'fd-league__form', 'aria-label': 'Form: ' + r.form.join(' ') }, r.form.map(function (f, k) { return h('span', { key: k, className: 'fd-form fd-form--' + f }, f); })) : null));
          })))),
      legend.length ? h('ul', { className: 'fd-legend' }, legend.map(function (l) { return h('li', { key: l[0] }, h('span', { className: 'fd-legend__key fd-zone--' + l[0] }), l[1]); })) : null);
  }

  /* ---------- form fields ---------- */
  /** "45M", "38.5k", "1,200,000" → number (in the current currency). */
  function parseMoney(text) {
    var s = String(text == null ? '' : text).replace(/[€$£,\s]/g, '').toUpperCase();
    var m = /^(-?\d*\.?\d+)([KMB])?$/.exec(s);
    if (!m) return NaN;
    var n = parseFloat(m[1]);
    return Math.round(n * (m[2] === 'K' ? 1e3 : m[2] === 'M' ? 1e6 : m[2] === 'B' ? 1e9 : 1));
  }

  function Field(p) {
    return h('label', { className: cx('fd-field', p.className) },
      h('span', { className: 'fd-field__label' }, p.label),
      p.children,
      p.hint ? h('span', { className: cx('fd-field__hint', p.tone && 'fd-field__hint--' + p.tone) }, p.hint) : null);
  }

  function MoneyInput(p) {
    var currency = p.currency || 'EUR';
    var st = useState(null), draft = st[0], setDraft = st[1];
    var shown = draft != null ? draft : (p.value != null ? formatMoney(p.value, currency).replace(/^[^\d−-]+/, '') : '');
    var bad = draft != null && draft !== '' && isNaN(parseMoney(draft));
    return h('div', { className: cx('fd-input', 'fd-input--money', bad && 'is-invalid') },
      h('span', { className: 'fd-input__affix' }, CURRENCIES[currency].symbol),
      h('input', { type: 'text', inputMode: 'decimal', value: shown, 'aria-label': p.label, 'aria-invalid': bad || undefined,
        onChange: function (e) { setDraft(e.target.value); var n = parseMoney(e.target.value); if (!isNaN(n) && p.onChange) p.onChange(n); },
        onBlur: function () { setDraft(null); } }),
      p.perWeek ? h('span', { className: 'fd-input__affix' }, '/wk') : null);
  }

  function Select(p) {
    return h('div', { className: 'fd-input fd-input--select' },
      h('select', { value: p.value, onChange: function (e) { if (p.onChange) p.onChange(e.target.value); }, 'aria-label': p.label },
        p.options.map(function (o) { var v = typeof o === 'string' ? o : o.value; return h('option', { key: v, value: v }, typeof o === 'string' ? o : o.label); })));
  }

  function NumberInput(p) {
    return h('div', { className: 'fd-input' },
      h('input', { type: 'number', min: p.min, max: p.max, step: p.step || 1, value: p.value, 'aria-label': p.label,
        onChange: function (e) { if (p.onChange) p.onChange(e.target.value === '' ? 0 : Number(e.target.value)); } }),
      p.suffix ? h('span', { className: 'fd-input__affix' }, p.suffix) : null);
  }

  /* ---------- transfer offer ---------- */
  var SQUAD_ROLES = ['Star player', 'Important player', 'Regular starter', 'Squad player', 'Fringe player', 'Hot prospect', 'Youngster'];
  var CONTRACT_TYPES = [{ value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' }, { value: 'youth', label: 'Youth' }];

  function TransferOffer(p) {
    var pl = p.player || {};
    var currency = p.currency || 'EUR';
    var init = Object.assign({ fee: pl.askingPrice || pl.value || 0, upfront: 100, months: 24, appearanceFee: 0, goalBonus: 0, sellOn: 0,
      wage: pl.wage || 0, years: 4, signingBonus: 0, releaseClause: 0, role: 'Regular starter', contractType: 'full-time', agentFee: 0 }, p.initial || {});
    var st = useState(init), o = st[0], setO = st[1];
    function set(k) { return function (v) { var n = Object.assign({}, o); n[k] = v; setO(n); }; }
    var feeNow = Math.round(o.fee * o.upfront / 100);
    var wageTotal = o.wage * 52 * o.years;
    var totalCost = o.fee + wageTotal + o.signingBonus + o.agentFee;
    var transferLeft = (p.transferBudget || 0) - feeNow - o.signingBonus - o.agentFee;
    var wageLeft = (p.wageBudget || 0) - o.wage;
    var asking = pl.askingPrice;
    var feeTone = asking ? (o.fee >= asking ? 'ok' : o.fee >= asking * 0.85 ? 'warn' : 'loss') : null;
    var feeHint = asking ? (o.fee >= asking ? 'Meets the asking price' : o.fee >= asking * 0.85 ? 'Slightly under the asking price' : 'Well under the asking price: likely rejected') : null;
    var resp = p.response;
    var ca = typeof pl.ability === 'number' ? pl.ability : null;
    return h('article', { className: cx('fd-offer', p.className) },
      h('header', { className: 'fd-offer__head' },
        h('div', { className: 'fd-offer__who' },
          h('span', { className: 'fd-label' }, 'Transfer offer'),
          h('h2', { className: 'fd-offer__name' }, pl.name),
          h('span', { className: 'fd-offer__sub' }, [pl.pos, pl.age != null ? pl.age + ' yrs' : null, pl.club].filter(Boolean).join(' · '))),
        ca != null ? h('div', { className: 'fd-offer__stat' }, h('span', { className: 'fd-label' }, 'Ability'), h(StarRating, { ability: ca, scale: p.scale, size: 18, youth: isYouth(pl) })) : null,
        pl.value != null ? h('div', { className: 'fd-offer__stat' }, h('span', { className: 'fd-label' }, 'Value'), h(Money, { amount: pl.value, currency: currency })) : null,
        asking != null ? h('div', { className: 'fd-offer__stat' }, h('span', { className: 'fd-label' }, 'Asking price'), h(Money, { amount: asking, currency: currency })) : null),
      resp ? h('div', { className: 'fd-offer__resp fd-offer__resp--' + resp.status, role: 'status' },
        h(Icon, { name: resp.status === 'accepted' ? 'contract' : resp.status === 'rejected' ? 'injury' : 'transfers', size: 18 }),
        h('div', null, h('strong', null, resp.status === 'accepted' ? 'Offer accepted' : resp.status === 'rejected' ? 'Offer rejected' : 'Counter-offer'), resp.message ? ' — ' + resp.message : null),
        resp.counter != null ? h('span', { className: 'fd-offer__counter' }, h(Money, { amount: resp.counter, currency: currency })) : null) : null,
      h('div', { className: 'fd-offer__cols' },
        h('section', { className: 'fd-offer__sec' },
          h('h3', { className: 'fd-offer__title' }, h(Icon, { name: 'transfers', size: 16 }), 'Club deal', pl.club ? h('span', { className: 'fd-muted' }, ' with ' + pl.club) : null),
          h(Field, { label: 'Transfer fee', hint: feeHint, tone: feeTone }, h(MoneyInput, { value: o.fee, currency: currency, onChange: set('fee'), label: 'Transfer fee' })),
          h('div', { className: 'fd-grid2' },
            h(Field, { label: 'Paid up front' }, h(NumberInput, { value: o.upfront, min: 0, max: 100, step: 5, suffix: '%', onChange: set('upfront'), label: 'Paid up front' })),
            h(Field, { label: 'Rest over' }, h(NumberInput, { value: o.months, min: 0, max: 48, step: 6, suffix: 'months', onChange: set('months'), label: 'Rest paid over' }))),
          h('div', { className: 'fd-grid2' },
            h(Field, { label: 'After 25 appearances' }, h(MoneyInput, { value: o.appearanceFee, currency: currency, onChange: set('appearanceFee'), label: 'Appearance add-on' })),
            h(Field, { label: 'After 15 goals' }, h(MoneyInput, { value: o.goalBonus, currency: currency, onChange: set('goalBonus'), label: 'Goals add-on' }))),
          h(Field, { label: 'Sell-on clause' }, h(NumberInput, { value: o.sellOn, min: 0, max: 50, step: 5, suffix: '% of next fee', onChange: set('sellOn'), label: 'Sell-on clause' }))),
        h('section', { className: 'fd-offer__sec' },
          h('h3', { className: 'fd-offer__title' }, h(Icon, { name: 'contract', size: 16 }), 'Player contract'),
          h('div', { className: 'fd-grid2' },
            h(Field, { label: 'Wage', hint: pl.wantsWage ? 'Agent wants ' + formatMoney(pl.wantsWage, currency, { perWeek: true }) : null, tone: pl.wantsWage ? (o.wage >= pl.wantsWage ? 'ok' : 'warn') : null },
              h(MoneyInput, { value: o.wage, currency: currency, perWeek: true, onChange: set('wage'), label: 'Weekly wage' })),
            h(Field, { label: 'Length' }, h(NumberInput, { value: o.years, min: 1, max: 5, suffix: o.years === 1 ? 'year' : 'years', onChange: set('years'), label: 'Contract length' }))),
          h('div', { className: 'fd-grid2' },
            h(Field, { label: 'Squad role' }, h(Select, { value: o.role, options: SQUAD_ROLES, onChange: set('role'), label: 'Squad role' })),
            h(Field, { label: 'Contract type', hint: o.contractType === 'youth' ? 'Silver stars: counts as a youth player' : null },
              h(Select, { value: o.contractType, options: CONTRACT_TYPES, onChange: set('contractType'), label: 'Contract type' }))),
          h('div', { className: 'fd-grid2' },
            h(Field, { label: 'Signing-on fee' }, h(MoneyInput, { value: o.signingBonus, currency: currency, onChange: set('signingBonus'), label: 'Signing-on fee' })),
            h(Field, { label: 'Release clause', hint: o.releaseClause ? null : 'None' }, h(MoneyInput, { value: o.releaseClause, currency: currency, onChange: set('releaseClause'), label: 'Release clause' }))),
          h(Field, { label: 'Agent fee' }, h(MoneyInput, { value: o.agentFee, currency: currency, onChange: set('agentFee'), label: 'Agent fee' })))),
      h('footer', { className: 'fd-offer__foot' },
        h('div', { className: 'fd-offer__sum' },
          Fact('Due now', h(Money, { amount: feeNow + o.signingBonus + o.agentFee, currency: currency })),
          Fact('Total cost', h(Money, { amount: totalCost, currency: currency })),
          Fact('Transfer budget left', h(Money, { amount: transferLeft, currency: currency, signed: transferLeft < 0 })),
          Fact('Wage budget left', h(Money, { amount: wageLeft, currency: currency, perWeek: true, signed: wageLeft < 0 }))),
        (transferLeft < 0 || wageLeft < 0) ? h('p', { className: 'fd-offer__warn', role: 'alert' }, h(Icon, { name: 'finances', size: 16 }), 'Over budget: the board must approve this deal.') : null,
        h('div', { className: 'fd-offer__actions' },
          p.onCancel ? h(Button, { variant: 'ghost', onClick: p.onCancel }, 'Cancel') : null,
          h(Button, { variant: 'secondary', onClick: function () { setO(init); } }, 'Reset'),
          h(Button, { icon: 'transfers', onClick: function () { if (p.onSubmit) p.onSubmit(o); } }, transferLeft < 0 || wageLeft < 0 ? 'Ask the board' : 'Submit offer'))));
  }

  /* ---------- inbox ---------- */
  var CATEGORY = {
    board: ['crown', 'Board'], transfers: ['transfers', 'Transfers'], scouting: ['scouting', 'Scouting'], medical: ['injury', 'Medical'],
    media: ['inbox', 'Media'], training: ['training', 'Training'], youth: ['youth', 'Academy'], match: ['fixtures', 'Matches'], finance: ['finances', 'Finances']
  };

  function Inbox(p) {
    var msgs = p.messages || [];
    var fs = useState('all'), filter = fs[0];
    var ss = useState(p.selectedId || (msgs[0] && msgs[0].id)), sel = ss[0];
    var rs = useState(function () { var r = {}; if (sel != null) r[sel] = true; return r; }), read = rs[0];
    var cats = ['all'].concat(Object.keys(CATEGORY).filter(function (c) { return msgs.some(function (m) { return m.category === c; }); }));
    var list = msgs.filter(function (m) { return filter === 'all' || m.category === filter; });
    var cur = msgs.filter(function (m) { return m.id === sel; })[0];
    function open(m) { ss[1](m.id); var r = Object.assign({}, read); r[m.id] = true; rs[1](r); if (p.onOpen) p.onOpen(m); }
    function unread(m) { return m.unread && !read[m.id]; }
    return h('div', { className: cx('fd-inbox', p.className) },
      h('div', { className: 'fd-inbox__list' },
        h('div', { className: 'fd-chips', role: 'tablist', 'aria-label': 'Filter messages' }, cats.map(function (c) {
          var n = msgs.filter(function (m) { return (c === 'all' || m.category === c) && unread(m); }).length;
          return h('button', { key: c, type: 'button', role: 'tab', 'aria-selected': filter === c, className: cx('fd-chip', filter === c && 'is-on'), onClick: function () { fs[1](c); } },
            c === 'all' ? 'All' : CATEGORY[c][1], n ? h('span', { className: 'fd-chip__n' }, n) : null);
        })),
        h('ul', { className: 'fd-msgs' }, list.map(function (m) {
          var c = CATEGORY[m.category] || CATEGORY.media;
          return h('li', { key: m.id },
            h('button', { type: 'button', className: cx('fd-msg', m.id === sel && 'is-on', unread(m) && 'is-unread'), onClick: function () { open(m); }, 'aria-current': m.id === sel || undefined },
              h('span', { className: 'fd-msg__icon' }, h(Icon, { name: c[0], size: 18 })),
              h('span', { className: 'fd-msg__main' },
                h('span', { className: 'fd-msg__top' }, h('span', { className: 'fd-msg__from' }, m.from), h('span', { className: 'fd-msg__date' }, m.date)),
                h('span', { className: 'fd-msg__subject' }, unread(m) ? h('span', { className: 'fd-dot', 'aria-label': 'Unread' }) : null, m.subject),
                m.needsReply ? h('span', { className: 'fd-tag fd-tag--warn' }, 'Needs a decision') : null)));
        }))),
      h('section', { className: 'fd-inbox__read', 'aria-live': 'polite' },
        cur ? [
          h('header', { key: 'h', className: 'fd-read__head' },
            h('span', { className: 'fd-label' }, h(Icon, { name: (CATEGORY[cur.category] || CATEGORY.media)[0], size: 14 }), ' ', (CATEGORY[cur.category] || CATEGORY.media)[1]),
            h('h2', { className: 'fd-read__subject' }, cur.subject),
            h('span', { className: 'fd-read__meta' }, cur.from + (cur.role ? ', ' + cur.role : '') + ' · ' + cur.date)),
          h('div', { key: 'b', className: 'fd-read__body' }, (cur.body || []).map(function (para, i) { return typeof para === 'string' ? h('p', { key: i }, para) : h('div', { key: i }, para); })),
          cur.actions ? h('footer', { key: 'f', className: 'fd-read__actions' }, cur.actions) : null
        ] : h('p', { className: 'fd-muted' }, 'No message selected')));
  }

  /* ---------- match day ---------- */
  var EVENT = {
    goal: ['ball', 'Goal', 'fd-ev--goal'], penalty: ['ball', 'Penalty goal', 'fd-ev--goal'], owngoal: ['ball', 'Own goal', 'fd-ev--goal'],
    yellow: ['booking', 'Yellow card', 'fd-ev--yellow'], red: ['booking', 'Red card', 'fd-ev--red'], sub: ['transfers', 'Substitution', 'fd-ev--sub'],
    injury: ['injury', 'Injury', 'fd-ev--red'], chance: ['play', 'Chance', ''], save: ['scouting', 'Save', ''], whistle: ['fixtures', '', 'fd-ev--whistle'], var: ['search', 'VAR check', '']
  };
  ICONS.ball = '<circle cx="12" cy="12" r="9"/><path d="m12 8.8 3 2.2-1.1 3.6h-3.8L9 11l3-2.2Z"/><path d="M12 8.8V3.2M15 11l5.3-1.7M13.9 14.6l3.3 4.6M10.1 14.6l-3.3 4.6M9 11 3.7 9.3"/>';

  function ratingBand(r) { return r >= 8 ? 'elite' : r >= 7 ? 'good' : r >= 6 ? 'average' : 'poor'; }

  function MatchScoreboard(p) {
    var goals = (p.events || []).filter(function (e) { return e.type === 'goal' || e.type === 'penalty' || e.type === 'owngoal' || e.type === 'red'; });
    function side(s) {
      return h('ul', { className: 'fd-sb__events fd-sb__events--' + s }, goals.filter(function (e) { return e.side === s; }).map(function (e, i) {
        return h('li', { key: i }, e.type === 'red' ? h('span', { className: 'fd-card fd-card--red', 'aria-label': 'Red card' }) : h(Icon, { name: 'ball', size: 12 }),
          ' ' + e.player + ' ' + e.minute + '′' + (e.type === 'penalty' ? ' (pen)' : e.type === 'owngoal' ? ' (og)' : ''));
      }));
    }
    var status = p.status === 'FT' ? 'Full time' : p.status === 'HT' ? 'Half time' : p.minute != null ? p.minute + '′' : 'Kick-off';
    return h('header', { className: cx('fd-sb', p.className) },
      h('div', { className: 'fd-sb__meta' }, h('span', null, p.competition), h('span', { className: cx('fd-sb__status', p.status === 'live' && 'is-live') }, status), h('span', null, p.venue)),
      h('div', { className: 'fd-sb__main' },
        h('div', { className: cx('fd-sb__team', p.home.isUser && 'is-user') }, h('span', { className: 'fd-sb__name' }, p.home.name)),
        h('div', { className: 'fd-sb__score', 'aria-label': p.home.name + ' ' + p.score[0] + ', ' + p.away.name + ' ' + p.score[1] },
          h('span', null, p.score[0]), h('span', { className: 'fd-sb__dash' }, '–'), h('span', null, p.score[1])),
        h('div', { className: cx('fd-sb__team', 'fd-sb__team--away', p.away.isUser && 'is-user') }, h('span', { className: 'fd-sb__name' }, p.away.name))),
      h('div', { className: 'fd-sb__scorers' }, side('home'), h('span'), side('away')),
      p.minute != null && p.status !== 'FT' ? h('div', { className: 'fd-sb__clock', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 90, 'aria-valuenow': Math.min(90, p.minute), 'aria-label': 'Match time' },
        h('span', { style: { width: Math.min(100, p.minute / 90 * 100) + '%' } })) : null);
  }

  function Commentary(p) {
    var evs = (p.events || []).slice().sort(function (a, b) { return b.minute - a.minute || (b.order || 0) - (a.order || 0); });
    return h('ol', { className: cx('fd-comm', p.className), 'aria-live': 'polite', 'aria-label': 'Match commentary' }, evs.map(function (e, i) {
      var ev = EVENT[e.type] || EVENT.chance;
      var big = e.type === 'goal' || e.type === 'penalty' || e.type === 'owngoal';
      return h('li', { key: i, className: cx('fd-comm__row', ev[2], big && 'is-big', e.side && 'fd-comm__row--' + e.side, e.isUser && 'is-user') },
        h('span', { className: 'fd-comm__min' }, e.minute + '′'),
        h('span', { className: 'fd-comm__icon' }, e.type === 'yellow' || e.type === 'red' ? h('span', { className: 'fd-card fd-card--' + e.type, 'aria-label': ev[1] }) : h(Icon, { name: ev[0], size: 16, label: ev[1] || undefined })),
        h('span', { className: 'fd-comm__text' }, big ? h('strong', { className: 'fd-comm__goal' }, ev[1].toUpperCase() + (e.score ? ' ' + e.score[0] + '–' + e.score[1] : '') + '. ') : null, e.text));
    }));
  }

  var STAT_ROWS = [['possession', 'Possession', '%'], ['shots', 'Shots'], ['onTarget', 'On target'], ['xg', 'Expected goals (xG)'], ['corners', 'Corners'], ['fouls', 'Fouls'], ['yellow', 'Yellow cards'], ['red', 'Red cards'], ['passAcc', 'Pass accuracy', '%']];

  function MatchStats(p) {
    var st = p.stats || {};
    return h('div', { className: cx('fd-mstats', p.className) },
      p.home || p.away ? h('div', { className: 'fd-mstats__teams' }, h('span', null, p.home), h('span', null, p.away)) : null,
      STAT_ROWS.filter(function (r) { return st[r[0]]; }).map(function (r) {
        var v = st[r[0]], a = v[0], b = v[1], tot = a + b || 1, fmt = function (n) { return r[0] === 'xg' ? n.toFixed(2) : n + (r[2] || ''); };
        var lead = a > b ? 'home' : b > a ? 'away' : '';
        return h('div', { key: r[0], className: 'fd-mstat' },
          h('div', { className: 'fd-mstat__row' }, h('span', { className: cx('fd-mstat__v', lead === 'home' && 'is-lead') }, fmt(a)), h('span', { className: 'fd-mstat__label' }, r[1]), h('span', { className: cx('fd-mstat__v', lead === 'away' && 'is-lead') }, fmt(b))),
          h('div', { className: 'fd-mstat__bar', 'aria-hidden': true }, h('span', { className: p.userSide === 'away' ? 'fd-mstat__them' : 'fd-mstat__us', style: { width: (a / tot * 100) + '%' } }), h('span', { className: p.userSide === 'away' ? 'fd-mstat__us' : 'fd-mstat__them', style: { width: (b / tot * 100) + '%' } })));
      }));
  }

  function MatchRatings(p) {
    var players = (p.players || []).slice();
    var best = players.reduce(function (m, x) { return x.rating > (m ? m.rating : -1) ? x : m; }, null);
    return h('div', { className: cx('fd-mratings', p.className) },
      p.title ? h('h4', { className: 'fd-label fd-mratings__title' }, p.title) : null,
      h('ul', { className: 'fd-mratings__list' }, players.map(function (x) {
        var motm = p.final && best && x === best;
        return h('li', { key: x.name, className: cx('fd-mrating', x.subbedOff && 'is-off') },
          h('span', { className: 'fd-mrating__num' }, x.number),
          h('span', { className: 'fd-mrating__name' }, x.name,
            x.goals ? h('span', { className: 'fd-mrating__ev' }, Array.apply(null, Array(x.goals)).map(function (_, k) { return h(Icon, { key: k, name: 'ball', size: 12, label: 'Goal' }); })) : null,
            x.card ? h('span', { className: 'fd-card fd-card--' + x.card, 'aria-label': x.card === 'red' ? 'Red card' : 'Yellow card' }) : null,
            x.subbedOff ? h('span', { className: 'fd-mrating__sub' }, h(Icon, { name: 'transfers', size: 12 }), x.subbedOff + '′') : null,
            x.injured ? h('span', { className: 'fd-tag fd-tag--loss' }, 'Injured') : null,
            motm ? h('span', { className: 'fd-tag fd-tag--gold' }, h(Icon, { name: 'star', size: 12 }), 'Player of the match') : null),
          h('span', { className: 'fd-mrating__pos' }, x.pos),
          x.condition != null && !p.final ? h('span', { className: 'fd-cond', title: 'Condition ' + x.condition + '%' }, h('span', { className: cx('fd-cond__bar', x.condition < 60 && 'is-low'), style: { width: x.condition + '%' } })) : null,
          h('span', { className: 'fd-mrating__r fd-mrating__r--' + ratingBand(x.rating) }, x.rating.toFixed(1)));
      })));
  }

  var SPEEDS = [['pause', 'Pause'], ['1', '1×'], ['2', '2×'], ['4', '4×']];

  function MatchDay(p) {
    var ss = useState(p.speed || '1'), speed = p.onSpeedChange ? p.speed : ss[0];
    var ts = useState('stats'), tab = ts[0];
    var final = p.match.status === 'FT';
    function setSpeed(s) { if (p.onSpeedChange) p.onSpeedChange(s); else ss[1](s); }
    return h('div', { className: cx('fd-matchday', p.className) },
      h(MatchScoreboard, p.match),
      h('div', { className: 'fd-matchday__bar' },
        !final ? h('div', { className: 'fd-seg', role: 'radiogroup', 'aria-label': 'Match speed' }, SPEEDS.map(function (s) {
          return h('button', { key: s[0], type: 'button', role: 'radio', 'aria-checked': speed === s[0], className: cx('fd-seg__opt', speed === s[0] && 'is-on'), onClick: function () { setSpeed(s[0]); } }, s[1]);
        })) : null,
        !final ? h(Button, { size: 'sm', variant: 'secondary', icon: 'sim', onClick: p.onSimToEnd }, 'Sim to end') : null,
        h('span', { className: 'fd-matchday__spacer' }),
        !final && p.subsLeft != null ? h('span', { className: 'fd-muted fd-matchday__subs' }, p.subsLeft + ' of 5 subs left') : null,
        !final ? h(Button, { size: 'sm', variant: 'secondary', icon: 'tactics', onClick: p.onTactics }, 'Tactics') : null,
        !final ? h(Button, { size: 'sm', icon: 'transfers', onClick: p.onSubstitute, disabled: p.subsLeft === 0 }, 'Make substitution') : h(Button, { size: 'sm', icon: 'play', onClick: p.onContinue }, 'Continue')),
      h('div', { className: 'fd-matchday__grid' },
        h('section', { className: 'fd-matchday__feed' }, h('h3', { className: 'fd-panel__title' }, 'Commentary'), h(Commentary, { events: p.match.events })),
        h('section', { className: 'fd-matchday__side' },
          h('div', { className: 'fd-tabs', role: 'tablist' }, [['stats', 'Stats'], ['ratings', 'Ratings']].map(function (t) {
            return h('button', { key: t[0], type: 'button', role: 'tab', 'aria-selected': tab === t[0], className: cx('fd-tab', tab === t[0] && 'is-on'), onClick: function () { ts[1](t[0]); } }, t[1]);
          })),
          tab === 'stats' ? h(MatchStats, { stats: p.stats, home: p.match.home.short || p.match.home.name, away: p.match.away.short || p.match.away.name, userSide: p.match.away.isUser ? 'away' : 'home' })
            : h(MatchRatings, { players: p.ratings, final: final, title: (p.match.home.isUser ? p.match.home.name : p.match.away.name) + ' ratings' }))));
  }

  /* ---------- training ---------- */
  var SESSION = {
    fitness: ['Fitness', 'training'], tactical: ['Tactical', 'tactics'], technical: ['Technical', 'ball'], setpieces: ['Set pieces', 'pitch'],
    matchprep: ['Match prep', 'fixtures'], recovery: ['Recovery', 'morale'], rest: ['Rest', 'home'], match: ['Match', 'stadium']
  };
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var INTENSITY = [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']];

  function TrainingSchedule(p) {
    var week = p.week || {};
    var is = useState(p.intensity || 'normal'), intensity = p.onIntensityChange ? p.intensity : is[0];
    function setI(v) { if (p.onIntensityChange) p.onIntensityChange(v); else is[1](v); }
    var load = 0;
    DAYS.forEach(function (d) { (week[d] || []).forEach(function (s) { load += s === 'rest' || s === 'recovery' ? 0 : s === 'match' ? 3 : s === 'fitness' ? 2 : 1; }); });
    load = Math.round(load * (intensity === 'high' ? 1.3 : intensity === 'low' ? 0.7 : 1));
    var risk = load >= 16 ? 'high' : load >= 11 ? 'medium' : 'low';
    return h('div', { className: cx('fd-training', p.className) },
      h('div', { className: 'fd-training__bar' },
        h('span', { className: 'fd-label' }, 'Intensity'),
        h('div', { className: 'fd-seg', role: 'radiogroup', 'aria-label': 'Training intensity' }, INTENSITY.map(function (x) {
          return h('button', { key: x[0], type: 'button', role: 'radio', 'aria-checked': intensity === x[0], className: cx('fd-seg__opt', intensity === x[0] && 'is-on'), onClick: function () { setI(x[0]); } }, x[1]);
        })),
        h('span', { className: 'fd-training__load' }, h('span', { className: 'fd-label' }, 'Workload'),
          h('span', { className: 'fd-meter', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 20, 'aria-valuenow': load, 'aria-label': 'Workload' },
            h('span', { className: 'fd-meter__bar fd-meter__bar--' + risk, style: { width: Math.min(100, load / 20 * 100) + '%' } })),
          h('span', { className: 'fd-risk fd-risk--' + risk }, risk === 'high' ? 'High injury risk' : risk === 'medium' ? 'Some injury risk' : 'Low injury risk'))),
      h('div', { className: 'fd-week' }, DAYS.map(function (d) {
        var ss = week[d] || [];
        return h('div', { key: d, className: cx('fd-day', ss.indexOf('match') >= 0 && 'is-match') },
          h('span', { className: 'fd-day__name' }, d),
          ss.length ? ss.map(function (s, i) {
            var x = SESSION[s] || SESSION.rest;
            return h('button', { key: i, type: 'button', className: 'fd-session fd-session--' + s, onClick: p.onEditSession ? function () { p.onEditSession(d, i); } : undefined },
              h(Icon, { name: x[1], size: 14 }), x[0]);
          }) : h('span', { className: 'fd-session fd-session--rest' }, 'Rest'));
      })),
      p.focus ? h('p', { className: 'fd-training__focus fd-muted' }, h(Icon, { name: 'tactics', size: 14 }), ' Focus this week: ', h('strong', null, p.focus)) : null);
  }

  /* ---------- development ---------- */
  function DevelopmentCard(p) {
    var pl = p.player || {};
    var youth = isYouth(pl);
    var ca = pl.ability, pa = pl.potential;
    var pct = Math.max(0, Math.min(100, Math.round(ca / pa * 100)));
    var changes = (pl.changes || []).slice().sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
    return h('article', { className: cx('fd-dev', p.className) },
      h('header', { className: 'fd-dev__head' },
        h('div', null, h('h3', { className: 'fd-dev__name' }, pl.name), h('span', { className: 'fd-muted fd-dev__sub' }, [pl.pos, pl.age != null ? pl.age + ' yrs' : null, pl.squad].filter(Boolean).join(' · '))),
        h('div', { className: 'fd-dev__stars' },
          h('span', { className: 'fd-dev__star' }, h('span', { className: 'fd-label' }, 'Ability'), h(StarRating, { ability: ca, scale: p.scale, youth: youth, size: 16 })),
          h('span', { className: 'fd-dev__star' }, h('span', { className: 'fd-label' }, 'Potential'), h(StarRating, { ability: pa, scale: p.scale, youth: youth, size: 16, potential: true })))),
      h('div', { className: 'fd-dev__progress' },
        h('div', { className: 'fd-dev__row' }, h('span', { className: 'fd-label' }, 'Progress to potential'), h('strong', null, pct >= 100 && pl.trend === 'down' ? 'Past peak' : pct + '%')),
        h('div', { className: 'fd-meter fd-meter--wide', role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct, 'aria-label': 'Progress to potential' },
          h('span', { className: 'fd-meter__bar fd-meter__bar--' + (youth ? 'silver' : 'gold'), style: { width: pct + '%' } })),
        pl.trend ? h('span', { className: cx('fd-dev__trend', pl.trend === 'up' ? 'fd-ok' : pl.trend === 'down' ? 'fd-money--neg' : 'fd-muted') },
          h(Icon, { name: pl.trend === 'up' ? 'trend-up' : pl.trend === 'down' ? 'trend-down' : 'morale-ok', size: 14 }),
          pl.trend === 'up' ? ' Improving' : pl.trend === 'down' ? ' Declining' : ' Steady', pl.period ? ' over the ' + pl.period : '') : null),
      changes.length ? h('ul', { className: 'fd-dev__changes' }, changes.map(function (c) {
        return h('li', { key: c.attr },
          h('span', null, c.attr),
          h('span', { className: 'fd-dev__delta ' + (c.delta > 0 ? 'fd-ok' : 'fd-money--neg') }, (c.delta > 0 ? '+' : '−') + Math.abs(c.delta)),
          h(AttributeRating, { value: c.value }));
      })) : null,
      h('footer', { className: 'fd-dev__foot' },
        pl.focus ? h('span', { className: 'fd-muted' }, 'Individual focus: ', h('strong', { className: 'fd-dev__focus' }, pl.focus)) : null,
        pl.mentor ? h('span', { className: 'fd-muted' }, 'Mentor: ', h('strong', { className: 'fd-dev__focus' }, pl.mentor)) : null,
        p.action || null));
  }

  /* ---------- youth academy ---------- */
  var READY = { ready: ['Ready for the first team', 'fd-ok'], soon: ['Ready within a season', 'fd-gold'], not: ['Needs more time', 'fd-muted'] };

  function YouthAcademy(p) {
    var squads = p.squads || { U18: [], U21: [] };
    var names = Object.keys(squads);
    var ts = useState(names[0]), tab = ts[0];
    var ps = useState(null), promoting = ps[0];
    var players = squads[tab] || [];
    return h('div', { className: cx('fd-academy', p.className) },
      h('div', { className: 'fd-academy__bar' },
        h('div', { className: 'fd-seg', role: 'tablist', 'aria-label': 'Youth squad' }, names.map(function (n) {
          return h('button', { key: n, type: 'button', role: 'tab', 'aria-selected': tab === n, className: cx('fd-seg__opt', tab === n && 'is-on'), onClick: function () { ts[1](n); ps[1](null); } }, n + ' (' + squads[n].length + ')');
        })),
        p.intake ? h('span', { className: 'fd-muted fd-academy__intake' }, h(Icon, { name: 'youth', size: 14 }), ' Next youth intake: ', h('strong', null, p.intake.date), p.intake.outlook ? ' · ' + p.intake.outlook : '') : null),
      promoting ? h('div', { className: 'fd-promote', role: 'dialog', 'aria-label': 'Promote ' + promoting.name },
        h('div', { className: 'fd-promote__text' },
          h('strong', null, 'Promote ' + promoting.name + ' to the first team?'),
          h('span', { className: 'fd-muted' }, 'Joins the senior squad on a professional contract, so the stars change from silver to gold.')),
        h('div', { className: 'fd-promote__stars' },
          h(StarRating, { ability: promoting.ability, scale: p.scale, youth: true, size: 18 }), h(Icon, { name: 'transfers', size: 16 }),
          h(StarRating, { ability: promoting.ability, scale: p.scale, size: 18 })),
        h('div', { className: 'fd-promote__actions' },
          h(Button, { size: 'sm', variant: 'ghost', onClick: function () { ps[1](null); } }, 'Not yet'),
          h(Button, { size: 'sm', icon: 'contract', onClick: function () { if (p.onPromote) p.onPromote(promoting); ps[1](null); } }, 'Promote and offer contract'))) : null,
      h('div', { className: 'fd-table-wrap' },
        h('table', { className: 'fd-table' },
          h('thead', null, h('tr', null, ['Player', 'Pos', 'Age', 'Ability', 'Potential', 'Coach says', ''].map(function (c, i) {
            return h('th', { key: i, scope: 'col', className: i === 2 ? 'fd-num' : undefined }, h('span', { className: 'fd-th' }, c));
          }))),
          h('tbody', null, players.map(function (pl) {
            var y = Object.assign({ squad: tab }, pl);
            var known = typeof pl.knowledge === 'number' ? pl.knowledge : 80;
            var lo = Math.max(pl.ability, pl.potential - Math.round((100 - known) * 0.6)), hi = Math.min(200, pl.potential + Math.round((100 - known) * 0.4));
            var r = READY[pl.readiness] || READY.not;
            return h('tr', { key: pl.name },
              h('td', null, h('span', { className: 'fd-player__name' }, pl.name)),
              h('td', null, h('span', { className: 'fd-pos' }, pl.pos)),
              h('td', { className: 'fd-num' }, pl.age),
              h('td', null, h(StarRating, { ability: pl.ability, scale: p.scale, youth: isYouth(y), size: 14 })),
              h('td', null, h(StarRating, { range: [starScore(lo, p.scale), starScore(hi, p.scale)], youth: isYouth(y), potential: true, size: 14 })),
              h('td', null, h('span', { className: r[1] }, r[0])),
              h('td', { className: 'fd-num' }, pl.readiness === 'ready' || pl.readiness === 'soon' ? h(Button, { size: 'sm', variant: pl.readiness === 'ready' ? 'secondary' : 'ghost', icon: 'youth', onClick: function () { ps[1](pl); } }, 'Promote') : null));
          })))));
  }

  /* ---------- club history & dynasty ---------- */
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function TrophyCabinet(p) {
    var trophies = p.trophies || [];
    var total = trophies.reduce(function (s, t) { return s + (t.seasons ? t.seasons.length : 0); }, 0);
    return h('section', { className: cx('fd-cabinet', p.className) },
      h('header', { className: 'fd-cabinet__head' },
        h('h3', { className: 'fd-cabinet__title' }, p.title || 'Trophy cabinet'),
        h('span', { className: 'fd-cabinet__total' }, h('strong', null, total), total === 1 ? ' major honour' : ' major honours')),
      h('div', { className: 'fd-cabinet__grid' }, trophies.map(function (t) {
        var n = t.seasons ? t.seasons.length : 0;
        return h('article', { key: t.name, className: cx('fd-trophy', n === 0 && 'is-empty', t.tier && 'fd-trophy--' + t.tier) },
          h('span', { className: 'fd-trophy__icon' }, h(Icon, { name: t.tier === 'league' ? 'crown' : 'trophy', size: 28 })),
          h('span', { className: 'fd-trophy__count' }, n),
          h('span', { className: 'fd-trophy__name' }, t.name),
          h('span', { className: 'fd-trophy__seasons' }, n ? t.seasons.join(', ') : 'Not yet won'));
      })));
  }

  function SeasonHistory(p) {
    var rows = p.seasons || [];
    return h('div', { className: cx('fd-table-wrap', p.className) },
      h('table', { className: 'fd-table fd-history' },
        h('thead', null, h('tr', null, ['Season', 'Division', 'Finish', 'Pts', 'Cup', 'Europe', 'Top scorer', 'Manager'].map(function (c, i) {
          return h('th', { key: c, scope: 'col', className: i === 3 ? 'fd-num' : undefined }, h('span', { className: 'fd-th' }, c));
        }))),
        h('tbody', null, rows.map(function (r) {
          var champ = r.pos === 1;
          var move = r.movement === 'promoted' ? ['trend-up', 'Promoted', 'fd-ok'] : r.movement === 'relegated' ? ['trend-down', 'Relegated', 'fd-money--neg'] : null;
          return h('tr', { key: r.season, className: champ ? 'is-champ' : undefined },
            h('td', null, h('strong', null, r.season)),
            h('td', null, r.division),
            h('td', null, h('span', { className: 'fd-history__finish' },
              champ ? h(Icon, { name: 'crown', size: 14, className: 'fd-gold' }) : null,
              h('span', { className: champ ? 'fd-gold' : undefined }, champ ? 'Champions' : ord(r.pos)),
              move ? h('span', { className: 'fd-history__move ' + move[2] }, h(Icon, { name: move[0], size: 12 }), move[1]) : null)),
            h('td', { className: 'fd-num' }, r.pts),
            h('td', null, h('span', { className: r.cup === 'Winners' ? 'fd-gold fd-history__win' : 'fd-muted' }, r.cup === 'Winners' ? h(Icon, { name: 'trophy', size: 12 }) : null, r.cup || '–')),
            h('td', null, h('span', { className: r.europe === 'Winners' ? 'fd-gold fd-history__win' : 'fd-muted' }, r.europe === 'Winners' ? h(Icon, { name: 'trophy', size: 12 }) : null, r.europe || '–')),
            h('td', null, r.topScorer ? [r.topScorer.name, h('span', { key: 'g', className: 'fd-muted' }, ' ' + r.topScorer.goals)] : '–'),
            h('td', null, h('span', { className: r.isYou ? 'fd-history__you' : undefined }, r.manager, r.isYou ? h('span', { className: 'fd-tag fd-tag--gold' }, 'You') : null)));
        }))));
  }

  function initials(n) { return String(n || '').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }

  function HallOfFame(p) {
    var legends = p.legends || [];
    return h('div', { className: cx('fd-hof', p.className) }, legends.map(function (l) {
      return h('article', { key: l.name, className: 'fd-hofcard' },
        h('header', { className: 'fd-hofcard__head' },
          h('span', { className: 'fd-hofcard__badge', 'aria-hidden': true }, l.number != null ? l.number : initials(l.name)),
          h('div', { className: 'fd-hofcard__id' },
            h('h3', { className: 'fd-hofcard__name' }, l.name),
            h('span', { className: 'fd-hofcard__sub' }, [l.pos, l.years].filter(Boolean).join(' · ')),
            l.nickname ? h('span', { className: 'fd-hofcard__nick' }, '“' + l.nickname + '”') : null)),
        h('div', { className: 'fd-hofcard__peak' }, h('span', { className: 'fd-label' }, 'Peak ability'), h(StarRating, { ability: l.peakAbility, scale: p.scale, size: 16 })),
        h('dl', { className: 'fd-hofcard__stats' },
          h('div', null, h('dt', null, 'Apps'), h('dd', null, l.apps)),
          h('div', null, h('dt', null, 'Goals'), h('dd', null, l.goals)),
          h('div', null, h('dt', null, 'Trophies'), h('dd', { className: 'fd-gold' }, l.trophies || 0))),
        l.inducted ? h('footer', { className: 'fd-hofcard__foot' }, h(Icon, { name: 'star', size: 14, className: 'fd-gold' }), 'Inducted ' + l.inducted) : null);
    }));
  }

  function ClubRecords(p) {
    var groups = p.groups || [];
    return h('div', { className: cx('fd-records', p.className) }, groups.map(function (g) {
      return h('section', { key: g.title, className: 'fd-panel fd-records__group' },
        h('h3', { className: 'fd-panel__title' }, h(Icon, { name: g.icon || 'trophy', size: 16 }), g.title),
        h('dl', { className: 'fd-records__list' }, g.records.map(function (r) {
          return h('div', { key: r.label, className: cx('fd-record', r.isNew && 'is-new') },
            h('dt', null, r.label, r.isNew ? h('span', { className: 'fd-tag fd-tag--gold' }, 'New record') : null),
            h('dd', null, h('span', { className: 'fd-record__value' }, r.value), r.holder ? h('span', { className: 'fd-record__holder' }, r.holder) : null, r.detail ? h('span', { className: 'fd-muted fd-record__detail' }, r.detail) : null));
        })));
    }));
  }

  function ManagerCareer(p) {
    var m = p.manager || {};
    var clubs = m.clubs || [];
    var tot = clubs.reduce(function (a, c) { a.g += c.w + c.d + c.l; a.w += c.w; a.d += c.d; a.l += c.l; a.t += (c.trophies || []).length; return a; }, { g: 0, w: 0, d: 0, l: 0, t: 0 });
    var winPct = tot.g ? Math.round(tot.w / tot.g * 100) : 0;
    return h('section', { className: cx('fd-career', p.className) },
      h('header', { className: 'fd-career__head' },
        h('div', null, h('span', { className: 'fd-label' }, 'Manager career'), h('h2', { className: 'fd-career__name' }, m.name), m.reputation ? h('span', { className: 'fd-career__rep' }, m.reputation) : null),
        h('div', { className: 'fd-career__totals' },
          Fact('Matches', tot.g), Fact('Won–Drawn–Lost', tot.w + '–' + tot.d + '–' + tot.l), Fact('Win rate', winPct + '%'),
          Fact('Trophies', h('span', { className: 'fd-gold' }, tot.t)))),
      h('ol', { className: 'fd-career__clubs' }, clubs.map(function (c, i) {
        var g = c.w + c.d + c.l;
        return h('li', { key: i, className: cx('fd-stint', !c.to && 'is-current') },
          h('div', { className: 'fd-stint__when' }, c.from + '–' + (c.to || 'now')),
          h('div', { className: 'fd-stint__club' }, h('strong', null, c.club), h('span', { className: 'fd-muted' }, c.division + ' · ' + g + ' matches · ' + (g ? Math.round(c.w / g * 100) : 0) + '% won'), c.left ? h('span', { className: 'fd-muted fd-stint__left' }, c.left) : null),
          h('div', { className: 'fd-stint__trophies' }, (c.trophies || []).map(function (t, k) { return h('span', { key: k, className: 'fd-stint__trophy' }, h(Icon, { name: 'trophy', size: 12 }), t); })));
      })));
  }

  window.FootballDynasty = {
    AppFrame: AppFrame, Button: Button, CurrencyToggle: CurrencyToggle, Money: Money,
    StarRating: StarRating, AttributeRating: AttributeRating, AttributePanel: AttributePanel, SquadTable: SquadTable,
    FixtureCard: FixtureCard, Icon: Icon, PlayerProfile: PlayerProfile, FormationBoard: FormationBoard, LeagueTable: LeagueTable, PositionChips: PositionChips,
    TransferOffer: TransferOffer, Inbox: Inbox, MatchDay: MatchDay, TrainingSchedule: TrainingSchedule, DevelopmentCard: DevelopmentCard, YouthAcademy: YouthAcademy, TrophyCabinet: TrophyCabinet, SeasonHistory: SeasonHistory, HallOfFame: HallOfFame, ClubRecords: ClubRecords, ManagerCareer: ManagerCareer, MatchScoreboard: MatchScoreboard, Commentary: Commentary, MatchStats: MatchStats, MatchRatings: MatchRatings, ratingBand: ratingBand, MoneyInput: MoneyInput, Field: Field, Select: Select, NumberInput: NumberInput, parseMoney: parseMoney, SQUAD_ROLES: SQUAD_ROLES,
    FORMATIONS: FORMATIONS, YOUTH_SQUADS: YOUTH_SQUADS,
    formatMoney: formatMoney, starScore: starScore, isYouth: isYouth, attrBand: attrBand,
    abilityFromAttributes: abilityFromAttributes, attributeWeight: attributeWeight, ATTRIBUTE_GROUPS: ATTRIBUTE_GROUPS, POSITION_WEIGHTS: POSITION_WEIGHTS,
    CURRENCIES: CURRENCIES, ICONS: ICONS
  };
})();
