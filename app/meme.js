// Vice City Meme Maker — shared canvas renderer for the GTA 6 meme bounty.
// Draws the meme on a 1024x1024 canvas. Three original templates:
//   sick-day — Vice City sunset beach: "WAITED 13 YEARS. / SURVIVED 2 DELAYS.
//              / CALLED IN SICK TODAY. / WORTH IT." with make.fun's ghost
//              lounging on the beach.
//   wallet   — two-panel "MY WALLET: $0" vs "GTA 6: $100 — TAKE MY MONEY."
//   mom      — chat screenshot: explaining GTA 6 lore to Mom.
// Font: Anton (SIL OFL, shipped in app/fonts/). Ghost: make.fun's official
// mascot, ghost-only crop of the press-kit mark (app/assets/ghost.svg).
// No Rockstar logo, wordmark, artwork or game font is used anywhere.

(function (global) {
  'use strict';

  var SIZE = 1024;
  var INK = '#191419';
  var MAGENTA = '#C41C83';
  var PINK = '#FF88C4';

  var ghostImg = null;
  var ghostReady = false;
  var fontReady = false;

  function loadAssets() {
    var jobs = [];
    if (!fontReady) {
      var face = new FontFace('Anton', 'url(fonts/Anton-Regular.ttf)');
      jobs.push(face.load().then(function (f) {
        document.fonts.add(f);
        fontReady = true;
      }));
    }
    if (!ghostReady) {
      jobs.push(new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { ghostImg = img; ghostReady = true; resolve(); };
        img.onerror = function () { resolve(); };
        img.src = 'assets/ghost.svg';
      }));
    }
    return Promise.all(jobs);
  }

  // ---------- shared scene pieces ----------

  // The sunset sky gradient (canvas-space, so it can be reused for the
  // sun's slats: the slats are painted with the sky itself, like gaps).
  function skyGradient(ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, 660);
    g.addColorStop(0.00, '#1B0B3B');
    g.addColorStop(0.30, '#4A0E6E');
    g.addColorStop(0.55, '#C41C83');
    g.addColorStop(0.78, '#FF5E3A');
    g.addColorStop(1.00, '#FFB347');
    return g;
  }

  function drawSky(ctx) {
    var g = skyGradient(ctx);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, 660);
    // A few faint early stars in the purple top.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    var stars = [[80, 60, 2.2], [210, 38, 1.6], [330, 78, 2.0], [700, 48, 1.8],
      [830, 90, 2.4], [930, 40, 1.6], [150, 150, 1.5], [880, 170, 1.7],
      [420, 55, 1.4], [600, 110, 1.5]];
    for (var i = 0; i < stars.length; i++) {
      ctx.beginPath();
      ctx.arc(stars[i][0], stars[i][1], stars[i][2], 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSun(ctx) {
    var cx = 512, cy = 545, r = 145;
    var g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    g.addColorStop(0, '#FFD319');
    g.addColorStop(0.55, '#FF7A18');
    g.addColorStop(1, '#FF2E88');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    // Synthwave slats: horizontal bars of sky across the sun's lower half,
    // growing thicker toward the bottom.
    var sky = skyGradient(ctx);
    ctx.fillStyle = sky;
    var y = cy + 12, h = 5;
    while (y < cy + r) {
      ctx.fillRect(cx - r, y, r * 2, h);
      y += h + 16;
      h += 2.5;
    }
    ctx.restore();
  }

  function drawOcean(ctx) {
    var g = ctx.createLinearGradient(0, 655, 0, 748);
    g.addColorStop(0, '#FF9E4F');
    g.addColorStop(0.35, '#8A2A6E');
    g.addColorStop(1, '#2B1055');
    ctx.fillStyle = g;
    ctx.fillRect(0, 655, SIZE, 93);
    // Sun reflection: a soft vertical streak under the sun.
    var rg = ctx.createLinearGradient(0, 655, 0, 748);
    rg.addColorStop(0, 'rgba(255, 211, 25, 0.35)');
    rg.addColorStop(1, 'rgba(255, 211, 25, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(462, 655, 100, 93);
    // Horizon sparkle line.
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 653, SIZE, 3);
  }

  function drawSand(ctx) {
    var g = ctx.createLinearGradient(0, 748, 0, SIZE);
    g.addColorStop(0, '#F2C184');
    g.addColorStop(0.25, '#E8A87C');
    g.addColorStop(1, '#C97B4A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 748, SIZE, SIZE - 748);
    // Wet-sand band at the waterline.
    ctx.fillStyle = 'rgba(120, 60, 20, 0.25)';
    ctx.fillRect(0, 748, SIZE, 14);
  }

  // A palm silhouette. (x, y) is the base of the trunk; s scales it;
  // flip mirrors it. Trunk leans toward the centre of the picture.
  function drawPalm(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip ? -s : s, s);
    ctx.strokeStyle = '#160A33';
    ctx.fillStyle = '#160A33';
    ctx.lineCap = 'round';
    // Trunk: a tapering curved path.
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.quadraticCurveTo(-6, -260, 34, -470);
    ctx.lineTo(58, -462);
    ctx.quadraticCurveTo(22, -250, 16, 0);
    ctx.closePath();
    ctx.fill();
    // Crown at the top of the trunk.
    var cx = 46, cy = -466;
    var fronds = [
      [-150, -70], [-120, -150], [-40, -190], [50, -185],
      [130, -140], [165, -60], [110, 10], [10, 30], [-90, 10]
    ];
    ctx.lineWidth = 15;
    for (var i = 0; i < fronds.length; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(
        cx + fronds[i][0] * 0.55, cy + fronds[i][1] * 0.55 - 40,
        cx + fronds[i][0], cy + fronds[i][1]);
      ctx.stroke();
    }
    // Coconuts.
    ctx.beginPath(); ctx.arc(cx - 12, cy + 12, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 12, cy + 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Big meme text: white fill, thick dark outline, auto-shrunk to fit.
  function outlineText(ctx, text, cx, y, size, maxWidth, fill) {
    var s = size;
    ctx.font = s + 'px Anton, sans-serif';
    while (s > 36 && ctx.measureText(text).width > maxWidth) {
      s -= 4;
      ctx.font = s + 'px Anton, sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, s * 0.11);
    ctx.strokeStyle = INK;
    ctx.strokeText(text, cx, y);
    ctx.fillStyle = fill || '#FFFFFF';
    ctx.fillText(text, cx, y);
    return s;
  }

  function drawGhost(ctx, x, y, w, h) {
    if (ghostImg) ctx.drawImage(ghostImg, x, y, w, h);
  }

  // Striped beach towel the ghost lounges on.
  function drawTowel(ctx, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + w - 14, y);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.clip();
    var stripe = w / 7;
    for (var i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#FFF3D6' : MAGENTA;
      ctx.fillRect(x + i * stripe - 10, y, stripe + 10, h);
    }
    ctx.restore();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + w - 14, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  }

  // Wooden beach sign: "VICE CITY" over "make.fun".
  function drawSign(ctx, x, y, w, h) {
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(x + 26, y + h - 6, 14, 46);
    ctx.fillRect(x + w - 40, y + h - 6, 14, 46);
    ctx.fillStyle = '#8B5A2B';
    ctx.strokeStyle = '#5E3A17';
    ctx.lineWidth = 5;
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFF3D6';
    roundRect(ctx, x + 10, y + 10, w - 20, h - 20, 9);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = INK;
    ctx.font = '44px Anton, sans-serif';
    ctx.fillText('VICE CITY', x + w / 2, y + 38);
    ctx.fillStyle = MAGENTA;
    ctx.font = '46px Anton, sans-serif';
    ctx.fillText('make.fun', x + w / 2, y + 92);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- template 1: sick-day beach ----------

  function renderSickDay(ctx, lines) {
    drawSky(ctx);
    drawSun(ctx);
    drawOcean(ctx);
    drawSand(ctx);
    drawPalm(ctx, 30, 1024, 0.9, false);
    drawPalm(ctx, 994, 1024, 0.85, true);
    // Headline: three beats of the joke, huge and centred.
    outlineText(ctx, lines[0], 512, 118, 96, 940);
    outlineText(ctx, lines[1], 512, 224, 96, 940);
    outlineText(ctx, lines[2], 512, 330, 96, 940);
    // The ghost lounges on its towel, bottom right, in the scene:
    // ghost first, towel tucked under it, so it sits ON the towel.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(815, 958, 130, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    drawTowel(ctx, 660, 905, 290, 55);
    drawGhost(ctx, 700, 740, 230, 184);
    // Punchline on the sand, magenta drop-copy behind white type,
    // kept clear of both the ghost and the beach sign.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '120px Anton, sans-serif';
    ctx.fillStyle = MAGENTA;
    ctx.fillText(lines[3], 408, 828);
    outlineText(ctx, lines[3], 400, 820, 120, 560);
    // The beach sign carries make.fun's name, bottom left.
    drawSign(ctx, 48, 905, 280, 110);
  }

  // ---------- template 2: wallet vs pre-order ----------

  function renderWallet(ctx, lines) {
    // Left: the wallet. Right: GTA 6. Split down the middle.
    ctx.fillStyle = '#1B0B3B';
    ctx.fillRect(0, 0, 512, SIZE);
    var g = ctx.createLinearGradient(512, 0, SIZE, SIZE);
    g.addColorStop(0, '#C41C83');
    g.addColorStop(1, '#FF2E88');
    ctx.fillStyle = g;
    ctx.fillRect(512, 0, 512, SIZE);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(506, 0, 12, 850);
    // Top banner.
    outlineText(ctx, lines[0], 512, 92, 66, 940);
    // Left panel: an empty wallet.
    outlineText(ctx, 'MY WALLET', 256, 250, 76, 440);
    ctx.save();
    ctx.translate(256, 430);
    ctx.fillStyle = '#3A2B4A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    roundRect(ctx, -170, -90, 340, 190, 26);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#241633';
    ctx.fillRect(-170, -90, 340, 62);
    ctx.fillStyle = '#FFD319';
    ctx.beginPath();
    ctx.arc(96, 38, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '34px Anton, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$0', 96, 40);
    ctx.restore();
    outlineText(ctx, 'BALANCE: $0.00', 256, 620, 56, 440);
    // Right panel: the game, and the ghost paying with its coin.
    outlineText(ctx, 'GTA 6', 768, 250, 96, 440);
    outlineText(ctx, 'ULTIMATE EDITION', 768, 330, 52, 440);
    outlineText(ctx, '$100', 768, 470, 150, 440);
    drawGhost(ctx, 648, 560, 240, 192);
    // Punchline across the bottom.
    outlineText(ctx, lines[3], 512, 920, 92, 940);
  }

  // ---------- template 3: explaining GTA 6 to Mom ----------

  function renderMom(ctx, lines) {
    ctx.fillStyle = '#0E0E12';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Chat header with the ghost as the avatar.
    ctx.fillStyle = '#171B24';
    ctx.fillRect(0, 0, SIZE, 150);
    ctx.save();
    ctx.beginPath();
    ctx.arc(110, 75, 52, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = MAGENTA;
    ctx.fillRect(58, 23, 104, 104);
    drawGhost(ctx, 66, 30, 92, 74);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '52px Anton, sans-serif';
    ctx.fillText('Mom', 190, 66);
    ctx.fillStyle = '#8A8A96';
    ctx.font = '30px Anton, sans-serif';
    ctx.fillText('online', 190, 112);
    // Chat bubbles, big type so they read at 480 px.
    chatBubble(ctx, lines[0], 60, 220, '#2A2A32', '#FFFFFF', 'left');
    chatBubble(ctx, lines[1], 964, 470, MAGENTA, '#FFFFFF', 'right');
    chatBubble(ctx, lines[2], 60, 720, '#2A2A32', '#FFFFFF', 'left');
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8A8A96';
    ctx.font = '28px Anton, sans-serif';
    ctx.fillText('Seen 11:59 PM  ·  make.fun', 964, 950);
  }

  function chatBubble(ctx, text, x, y, bg, fg, side) {
    var maxW = 800;
    var size = 44;
    ctx.font = size + 'px Anton, sans-serif';
    var words = text.split(' ');
    var fitted = fitLines(ctx, words, maxW - 72, size);
    var lh = 58;
    var w = fitted.width + 72;
    var h = fitted.lines.length * lh + 40;
    var bx = side === 'left' ? x : x - w;
    ctx.fillStyle = bg;
    roundRect(ctx, bx, y, w, h, 28);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < fitted.lines.length; i++) {
      ctx.fillText(fitted.lines[i], bx + 36, y + 34 + i * lh + lh / 2 - 6);
    }
    return h;
  }

  function fitLines(ctx, words, maxW, size) {
    var lines = [];
    var cur = '';
    var widest = 0;
    ctx.font = size + 'px Anton, sans-serif';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        widest = Math.max(widest, ctx.measureText(cur).width);
        cur = words[i];
      } else {
        cur = test;
      }
    }
    if (cur) {
      lines.push(cur);
      widest = Math.max(widest, ctx.measureText(cur).width);
    }
    return { lines: lines, width: widest };
  }

  // ---------- public API ----------

  var TEMPLATES = {
    'sick-day': {
      name: 'Sick Day in Vice City',
      fields: ['Line 1', 'Line 2', 'Line 3', 'Punchline'],
      defaults: ['WAITED 13 YEARS.', 'SURVIVED 2 DELAYS.', 'CALLED IN SICK TODAY.', 'WORTH IT.'],
      render: renderSickDay
    },
    'wallet': {
      name: 'Wallet vs Pre-order',
      fields: ['Top line', '—', '—', 'Punchline'],
      defaults: ["ME: I CAN'T AFFORD GTA 6", '', '', 'TAKE MY MONEY.'],
      render: renderWallet
    },
    'mom': {
      name: 'Explaining GTA 6 to Mom',
      fields: ['Mom says', 'I say', 'Mom replies', '—'],
      defaults: ['so you just steal cars in this game?', "it's about Jason & Lucia, 13 years of waiting, and Florida. it's ART.", '...ok. have fun sweetie', ''],
      render: renderMom
    }
  };

  function renderMeme(ctx, template, lines) {
    var t = TEMPLATES[template] || TEMPLATES['sick-day'];
    var ls = [];
    for (var i = 0; i < 4; i++) ls.push(lines[i] || t.defaults[i] || '');
    ctx.clearRect(0, 0, SIZE, SIZE);
    t.render(ctx, ls);
  }

  global.MemeMaker = {
    SIZE: SIZE,
    TEMPLATES: TEMPLATES,
    loadAssets: loadAssets,
    renderMeme: renderMeme
  };
})(window);
