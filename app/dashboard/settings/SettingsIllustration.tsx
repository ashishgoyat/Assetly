"use client"

export default function SettingsIllustration({ dark }: { dark: boolean }) {
  const card       = dark ? "#211d19" : "#ffffff"
  const cardBorder = dark ? "#302820" : "#e8e8ec"
  const rowBg      = dark ? "#181410" : "#f5f5f7"
  const line       = dark ? "#28211a" : "#f0f0f2"
  const bar        = dark ? "#342c24" : "#e2e2e6"
  const barShort   = dark ? "#29221b" : "#ebebed"
  const accent     = "#ffb763"
  const dot        = dark ? "#302820" : "#dedee2"
  const ringStroke = dark ? "rgba(255,183,99,0.16)" : "rgba(255,183,99,0.2)"
  const toggleOff  = dark ? "#342c24" : "#d1d1d6"
  const shadowOp   = dark ? "0.35" : "0.07"

  return (
    <svg width="420" height="480" viewBox="0 0 420 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="si-shadow" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="4" stdDeviation="14" floodColor="#000" floodOpacity={shadowOp} />
        </filter>
        <filter id="si-shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="7" floodColor="#000" floodOpacity={shadowOp} />
        </filter>
      </defs>

      {/* Background rings */}
      <circle cx="400" cy="46"  r="160" stroke={ringStroke} strokeWidth="1.5" />
      <circle cx="400" cy="46"  r="118" stroke={ringStroke} strokeWidth="1"   />
      <circle cx="400" cy="46"  r="76"  stroke={ringStroke} strokeWidth="0.8" />
      <circle cx="18"  cy="428" r="88"  stroke={ringStroke} strokeWidth="1"   strokeOpacity="0.6" />
      <circle cx="18"  cy="428" r="52"  stroke={ringStroke} strokeWidth="0.8" strokeOpacity="0.4" />

      {/* ── Main settings card ── */}
      <rect x="14" y="58" width="290" height="356" rx="20"
        fill={card} stroke={cardBorder} strokeWidth="1" filter="url(#si-shadow)" />

      {/* Avatar */}
      <circle cx="64" cy="112" r="28" fill={accent} fillOpacity="0.14" />
      <circle cx="64" cy="104" r="12" fill={accent} />
      <circle cx="64" cy="133" r="15" fill={accent} />

      {/* Name / email */}
      <rect x="106" y="100" width="132" height="11" rx="5.5" fill={bar} />
      <rect x="106" y="118" width="88"  height="8"  rx="4"   fill={barShort} />

      {/* Divider */}
      <rect x="14" y="155" width="290" height="1" fill={line} />

      {/* Row 1 — ON */}
      <rect x="36" y="171" width="120" height="9"  rx="4.5" fill={bar} />
      <rect x="36" y="185" width="80"  height="7"  rx="3.5" fill={barShort} />
      <rect x="244" y="174" width="44" height="22" rx="11"  fill={accent} />
      <circle cx="277" cy="185" r="9" fill="white" />

      {/* Row 2 — OFF */}
      <rect x="36" y="216" width="138" height="9"  rx="4.5" fill={bar} />
      <rect x="36" y="230" width="96"  height="7"  rx="3.5" fill={barShort} />
      <rect x="244" y="219" width="44" height="22" rx="11"  fill={toggleOff} />
      <circle cx="255" cy="230" r="9" fill="white" />

      {/* Row 3 — ON */}
      <rect x="36" y="261" width="106" height="9"  rx="4.5" fill={bar} />
      <rect x="36" y="275" width="74"  height="7"  rx="3.5" fill={barShort} />
      <rect x="244" y="264" width="44" height="22" rx="11"  fill={accent} />
      <circle cx="277" cy="275" r="9" fill="white" />

      {/* Row 4 — OFF */}
      <rect x="36" y="306" width="90"  height="9"  rx="4.5" fill={bar} />
      <rect x="36" y="320" width="120" height="7"  rx="3.5" fill={barShort} />
      <rect x="244" y="309" width="44" height="22" rx="11"  fill={toggleOff} />
      <circle cx="255" cy="320" r="9" fill="white" />

      {/* Divider */}
      <rect x="14" y="348" width="290" height="1" fill={line} />

      {/* Buttons */}
      <rect x="36"  y="362" width="110" height="34" rx="10"
        fill={rowBg} stroke={cardBorder} strokeWidth="1" />
      <rect x="57"  y="373" width="68"  height="10" rx="5" fill={bar} />
      <rect x="160" y="362" width="124" height="34" rx="10" fill={accent} />
      <rect x="181" y="373" width="82"  height="10" rx="5" fill="white" fillOpacity="0.42" />

      {/* ── Floating mini card ── */}
      <rect x="250" y="20" width="158" height="98" rx="16"
        fill={card} stroke={cardBorder} strokeWidth="1" filter="url(#si-shadow-sm)" />

      {/* Settings icon */}
      <circle cx="282" cy="63" r="20" fill={accent} fillOpacity="0.13" />
      <circle cx="282" cy="63" r="20" stroke={accent} strokeWidth="1.5" fill="none" />
      <line x1="272" y1="57" x2="292" y2="57" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="272" y1="63" x2="292" y2="63" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="272" y1="69" x2="286" y2="69" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />

      <rect x="314" y="47" width="80" height="9"  rx="4.5" fill={bar} />
      <rect x="314" y="62" width="58" height="7"  rx="3.5" fill={barShort} />
      <rect x="314" y="75" width="70" height="7"  rx="3.5" fill={barShort} />

      {/* ── Decorative dots — right ── */}
      <circle cx="348" cy="182" r="7"   fill={accent} fillOpacity="0.28" />
      <circle cx="368" cy="202" r="4.5" fill={accent} fillOpacity="0.16" />
      <circle cx="388" cy="184" r="3.5" fill={dot} />
      <circle cx="344" cy="284" r="5"   fill={dot} />
      <circle cx="368" cy="302" r="3"   fill={accent} fillOpacity="0.18" />
      <circle cx="384" cy="276" r="4"   fill={dot} />

      {/* Decorative dots — left */}
      <circle cx="8"  cy="226" r="5"   fill={accent} fillOpacity="0.18" />
      <circle cx="6"  cy="246" r="3.5" fill={dot} />

      {/* Bottom accent cluster */}
      <circle cx="186" cy="454" r="26" fill={accent} fillOpacity="0.07" />
      <circle cx="186" cy="454" r="13" fill={accent} fillOpacity="0.11" />
      <circle cx="186" cy="454" r="5"  fill={accent} fillOpacity="0.45" />
    </svg>
  )
}
