import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1680 775" width="1680" height="775" style="background:#ffffff; font-family: Arial, Helvetica, sans-serif;">
  <defs>
    <style>
      .title-text { font-family: Arial, Helvetica, sans-serif; font-size: 21px; font-weight: bold; fill: #ffffff; text-anchor: middle; }
      .purpose-text { font-family: Arial, Helvetica, sans-serif; font-size: 13.5px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .phase-head { font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; text-anchor: middle; }
      .card-title { font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; fill: #0f172a; }
      .body-bold { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; font-weight: bold; fill: #1e293b; }
      .body-reg { font-family: Arial, Helvetica, sans-serif; font-size: 9px; fill: #334155; }
      .badge-text { font-family: 'Courier New', Courier, monospace; font-size: 8.2px; font-weight: bold; }
    </style>
    <!-- Arrow Marker -->
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#283747" />
    </marker>
    <marker id="arrow-orange" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ea580c" />
    </marker>
    <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
    </marker>
  </defs>

  <!-- Outer Border Container -->
  <rect x="10" y="10" width="1660" height="755" rx="16" fill="#ffffff" stroke="#1e293b" stroke-width="3" />

  <!-- ==================== HEADER ==================== -->
  <g id="header-group">
    <rect x="360" y="24" width="960" height="42" rx="9" fill="#243542" stroke="#111e26" stroke-width="1.5" />
    <text x="840" y="52" class="title-text">NaviFreight AI – Updated High-Level System Architecture &amp; Operational Workflow</text>
    
    <text x="840" y="85" class="purpose-text">Purpose: To clearly show how updated data flows and user inputs enable optimized dry-bulk freight forecasting &amp; vessel routing on the Indian East Coast</text>
  </g>

  <!-- ==================== 4 COLUMNS ==================== -->
  <!-- Col 1: Phase 1 (Revised) -->
  <g id="phase-1-column">
    <rect x="25" y="102" width="480" height="615" rx="12" fill="#e8f2f8" stroke="#283747" stroke-width="2" />
    
    <!-- Header Pill -->
    <rect x="35" y="112" width="460" height="32" rx="7" fill="#649bb5" stroke="#283747" stroke-width="1.5" />
    <text x="265" y="133" class="phase-head" fill="#041b29">PHASE 1 (REVISED)</text>

    <!-- Subgrid: Logistics Manager (Left) -->
    <rect x="35" y="152" width="225" height="205" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="45" y="172" class="card-title" fill="#0284c7">Logistics Manager</text>
    <text x="45" y="186" style="font-size: 8px; fill: #64748b; font-weight: bold;">(Website User Input)</text>
    
    <text x="45" y="206" class="body-bold">• Global Source Port</text>
    <text x="53" y="218" style="font-size: 8px; fill: #64748b;">(e.g., Australia / Gladstone)</text>
    
    <text x="45" y="235" class="body-bold">• Indian Destination Port</text>
    <text x="53" y="247" style="font-size: 8px; fill: #64748b;">(e.g., Paradip, Vizag, Haldia)</text>
    
    <text x="45" y="264" class="body-bold">• Total Quantity to Order (MT)</text>
    <text x="45" y="281" class="body-bold">• Contract Term (1, 3, 6 Months)</text>

    <!-- Stockpile Sub-banner -->
    <rect x="42" y="294" width="211" height="52" rx="4" fill="#f1f5f9" stroke="#64748b" stroke-width="1" stroke-dasharray="3 2" />
    <text x="48" y="308" style="font-size: 7.8px; font-weight: bold; fill: #0369a1;">[SIMPLIFIED DOMESTIC STOCKPILES]</text>
    <text x="48" y="322" style="font-size: 7.5px; fill: #334155;">Target inventory based on steel plant (SAIL)</text>
    <text x="48" y="334" style="font-size: 7.5px; fill: #334155;">planned sheet rolling &amp; production schedule.</text>

    <!-- Subgrid: Ingestion Pipeline (Right) -->
    <rect x="270" y="152" width="225" height="205" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="280" y="172" class="card-title" fill="#0284c7">Simplified Data</text>
    <text x="280" y="186" style="font-size: 8px; fill: #64748b; font-weight: bold;">Ingestion Pipeline</text>

    <!-- Ingestion Badges -->
    <rect x="280" y="200" width="70" height="18" rx="3" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1" />
    <text x="285" y="213" class="badge-text" fill="#0369a1">[BDI-INDEX]</text>
    <text x="358" y="213" style="font-size: 8.5px; font-weight: bold; fill: #1e293b;">(Baltic Dry)</text>

    <rect x="280" y="226" width="75" height="18" rx="3" fill="#ffedd5" stroke="#fdba74" stroke-width="1" />
    <text x="285" y="239" class="badge-text" fill="#c2410c">[BDRY-INDEX]</text>
    <text x="363" y="239" style="font-size: 8.5px; font-weight: bold; fill: #1e293b;">(Bulk Index)</text>

    <rect x="280" y="252" width="82" height="18" rx="3" fill="#f3e8ff" stroke="#d8b4fe" stroke-width="1" />
    <text x="285" y="265" class="badge-text" fill="#7e22ce">[YAHOO-FIN]</text>
    <text x="370" y="265" style="font-size: 8.5px; font-weight: bold; fill: #1e293b;">(Fuel/Macro)</text>

    <rect x="280" y="278" width="72" height="18" rx="3" fill="#fef3c7" stroke="#fcd34d" stroke-width="1" />
    <text x="285" y="291" class="badge-text" fill="#b45309">[BUNKER-P]</text>
    <text x="360" y="291" style="font-size: 8.5px; font-weight: bold; fill: #1e293b;">Global Fuel</text>

    <rect x="280" y="304" width="65" height="18" rx="3" fill="#fee2e2" stroke="#fca5a5" stroke-width="1" />
    <text x="285" y="317" class="badge-text" fill="#b91c1c">[PORT-T]</text>
    <text x="353" y="317" style="font-size: 8.5px; font-weight: bold; fill: #1e293b;">Port Tariffs</text>

    <!-- Connector line -->
    <line x1="265" y1="360" x2="265" y2="378" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- CORE TENDER PREPARATION BOX (USER VALUE UPDATE) -->
    <rect x="35" y="380" width="460" height="205" rx="8" fill="#ffffff" stroke="#0284c7" stroke-width="2.2" />
    <text x="50" y="402" style="font-size: 11.5px; font-weight: bold; fill: #0369a1;">📜 Tender Preparation &amp; Charter-Party Rolling Analysis</text>
    <rect x="380" y="388" width="105" height="18" rx="3" fill="#0284c7" />
    <text x="386" y="401" style="font-size: 8px; font-weight: bold; fill: #ffffff;">PSU / GFR COMPLIANT</text>

    <!-- Tender Key Value 1: Minimum 21 Days -->
    <rect x="50" y="415" width="430" height="34" rx="4" fill="#eff6ff" stroke="#0284c7" stroke-width="1" />
    <text x="60" y="430" style="font-size: 9.8px; font-weight: bold; fill: #0369a1;">🗓️ Minimum 21 Days Statutory Tender Notice:</text>
    <text x="60" y="443" style="font-size: 8.8px; fill: #1e293b;">Mandatory compliance under GFR 2017 Rule 161 prior to cargo laycan window.</text>

    <!-- Tender Key Value 2: 70/30 COA-to-Spot Ratio -->
    <rect x="50" y="455" width="430" height="34" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="1" />
    <text x="60" y="470" style="font-size: 9.8px; font-weight: bold; fill: #047857;">⚖️ 70/30 COA-to-Spot Hedging Ratio:</text>
    <text x="60" y="483" style="font-size: 8.8px; fill: #1e293b;">70% volume in quarterly COA for basestock safety, 30% spot charter to capture price dips.</text>

    <!-- Tender Key Value 3: Rolling Analysis -->
    <text x="50" y="508" style="font-size: 9px; font-weight: bold; fill: #0f172a;">• Charter-Party Rolling Analysis:</text>
    <text x="50" y="522" style="font-size: 8.5px; fill: #475569;">Dynamically calculates required vessel tonnage &amp; ship delivery rolling based on plant</text>
    <text x="50" y="534" style="font-size: 8.5px; fill: #475569;">minimum stockpile buffers, preventing costly demurrage and blast furnace starvation.</text>

    <!-- Connector line -->
    <line x1="265" y1="588" x2="265" y2="602" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Early Global Volatility Radar -->
    <rect x="35" y="605" width="460" height="100" rx="7" fill="#629bb5" stroke="#283747" stroke-width="1.8" />
    <text x="265" y="626" style="font-size: 11.5px; font-weight: bold; fill: #031b2c; text-anchor: middle;">🌐 Early Global Volatility Radar</text>
    <text x="55" y="648" style="font-size: 9.5px; font-weight: bold; fill: #072133;">• Captures Capesize spot rate surges 14 days early</text>
    <text x="55" y="666" style="font-size: 9.5px; font-weight: bold; fill: #072133;">• Tracks Bay of Bengal cyclones, weather depressions &amp; canal choke points</text>

    <!-- Outbound connector circle -->
    <circle cx="505" cy="254" r="12" fill="#0284c7" stroke="#ffffff" stroke-width="2" />
    <text x="505" y="258" style="font-size: 12px; font-weight: bold; fill: #ffffff; text-anchor: middle;">➔</text>
  </g>


  <!-- Col 2: Phase 2 (Preserved) -->
  <g id="phase-2-column">
    <rect x="520" y="102" width="365" height="615" rx="12" fill="#fbf0d8" stroke="#283747" stroke-width="2" />

    <!-- Header Pill -->
    <rect x="530" y="112" width="345" height="32" rx="7" fill="#e99547" stroke="#283747" stroke-width="1.5" />
    <text x="702" y="133" class="phase-head" fill="#2b1402">PHASE 2 (PRESERVED)</text>

    <!-- Tier-1 Arrival ETA -->
    <rect x="530" y="152" width="345" height="85" rx="7" fill="#fde6c4" stroke="#283747" stroke-width="1.5" />
    <text x="702" y="174" style="font-size: 11px; font-weight: bold; fill: #1e293b; text-anchor: middle;">⏱️ Tier-1 Arrival ETA (48h–72h / 2–3 Days Out)</text>
    <text x="702" y="196" style="font-size: 9.2px; fill: #475569; text-anchor: middle;">Simulate long-range arrival bunching to queue inbound</text>
    <text x="702" y="212" style="font-size: 9.2px; fill: #475569; text-anchor: middle;">coal vessels reliably at outer anchorage</text>

    <!-- Connector -->
    <line x1="702" y1="240" x2="702" y2="258" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Congestion Alert -->
    <rect x="530" y="260" width="345" height="65" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="702" y="284" style="font-size: 11px; font-weight: bold; fill: #0f172a; text-anchor: middle;">⚠️ Tier-1 Congestion Alert</text>
    <text x="702" y="304" style="font-size: 10px; font-weight: bold; fill: #ea580c; text-anchor: middle;">(Anchorage wait &gt; 24–48 hours)</text>

    <!-- Connector with No label -->
    <text x="712" y="338" style="font-size: 8.5px; font-weight: bold; fill: #475569;">No</text>
    <line x1="702" y1="327" x2="702" y2="348" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Emergency Coal Priority Factor Container -->
    <rect x="530" y="352" width="345" height="350" rx="8" fill="#fadca6" stroke="#283747" stroke-width="1.8" />
    <text x="702" y="376" style="font-size: 12px; font-weight: bold; fill: #0f172a; text-anchor: middle;">Emergency Coal Priority Factor</text>

    <!-- Decision Diamond: Critical Stockpile -->
    <polygon points="702,392 815,442 702,492 589,442" fill="#ef4444" stroke="#283747" stroke-width="2" />
    <text x="702" y="438" style="font-size: 9.8px; font-weight: bold; fill: #ffffff; text-anchor: middle;">Critical Stockpile</text>
    <text x="702" y="453" style="font-size: 10.2px; font-weight: bold; fill: #ffffff; text-anchor: middle;">&lt; 4.2 days / CEA Red Flag</text>

    <!-- Yes Branch -->
    <text x="712" y="510" style="font-size: 9px; font-weight: bold; fill: #ea580c;">Yes</text>
    <line x1="702" y1="494" x2="702" y2="520" stroke="#ea580c" stroke-width="2" marker-end="url(#arrow-orange)" />

    <!-- Action 1: Emergency Coal Priority -->
    <rect x="545" y="525" width="315" height="52" rx="7" fill="#ea580c" stroke="#283747" stroke-width="1.5" />
    <text x="702" y="556" style="font-size: 12px; font-weight: bold; fill: #ffffff; text-anchor: middle;">🚨 Emergency Coal Priority</text>

    <!-- No Branch -->
    <text x="712" y="600" style="font-size: 9px; font-weight: bold; fill: #475569;">No</text>
    <line x1="702" y1="580" x2="702" y2="615" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Action 2: Maintain FIFO -->
    <rect x="545" y="620" width="315" height="52" rx="7" fill="#f59e0b" stroke="#283747" stroke-width="1.5" />
    <text x="702" y="651" style="font-size: 12px; font-weight: bold; fill: #1e1b4b; text-anchor: middle;">Maintain FIFO Berthing</text>

    <!-- Outbound connector from Emergency Coal Priority -->
    <circle cx="885" cy="551" r="12" fill="#ea580c" stroke="#ffffff" stroke-width="2" />
    <text x="885" y="555" style="font-size: 12px; font-weight: bold; fill: #ffffff; text-anchor: middle;">➔</text>
  </g>


  <!-- Col 3: Phase 3 (Preserved) -->
  <g id="phase-3-column">
    <rect x="900" y="102" width="395" height="615" rx="12" fill="#fbf2ea" stroke="#283747" stroke-width="2" />

    <!-- Header Pill -->
    <rect x="910" y="112" width="375" height="42" rx="7" fill="#e2615a" stroke="#283747" stroke-width="1.5" />
    <text x="1097" y="128" class="phase-head" fill="#2b0404">PHASE 3. (PRESERVED)</text>
    <text x="1097" y="145" style="font-size: 9px; font-weight: bold; fill: #ffe4e6; text-anchor: middle;">CRITICAL DECISION GATE &amp; MULTIMODAL DIVERSION (6h Threshold)</text>

    <!-- 3-Way Optimization Equation -->
    <rect x="910" y="162" width="375" height="230" rx="8" fill="#fbe69e" stroke="#283747" stroke-width="1.8" />
    <text x="1097" y="186" style="font-size: 12px; font-weight: bold; fill: #1e293b; text-anchor: middle;">⚖️ 3-Way Optimization Equation</text>

    <!-- Cost B Box -->
    <rect x="1000" y="198" width="275" height="60" rx="6" fill="#f6c875" stroke="#283747" stroke-width="1.2" />
    <text x="1010" y="220" style="font-size: 10.8px; font-weight: bold; fill: #78350f;">Cost B</text>
    <text x="1010" y="238" style="font-size: 9.5px; fill: #0f172a;">(Port Diversion Bunker Fuel)</text>

    <!-- Funnel Graphic Box -->
    <rect x="920" y="198" width="70" height="60" rx="6" fill="#ffffff" stroke="#283747" stroke-width="1.2" />
    <polygon points="930,206 980,206 960,228 960,248 950,248 950,228" fill="#ea580c" />

    <!-- Cost C Box -->
    <rect x="920" y="268" width="355" height="110" rx="6" fill="#f6c875" stroke="#283747" stroke-width="1.2" />
    <text x="930" y="290" style="font-size: 10.8px; font-weight: bold; fill: #78350f;">Cost C</text>
    <text x="930" y="310" style="font-size: 9.2px; fill: #0f172a;">(Multimodal Inland Evacuation – Indian Railways FOIS</text>
    <text x="930" y="326" style="font-size: 9.2px; fill: #0f172a;">48 hr rake indent freight tariff vs</text>
    <text x="930" y="342" style="font-size: 9.2px; fill: #0f172a;">Emergency Road Trucking freight to plant)</text>

    <!-- Connector line -->
    <line x1="1097" y1="395" x2="1097" y2="420" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Optimization Verdict Diamond -->
    <polygon points="1097,425 1205,465 1097,505 989,465" fill="#ffffff" stroke="#283747" stroke-width="2" />
    <text x="1097" y="469" style="font-size: 11px; font-weight: bold; fill: #0f172a; text-anchor: middle;">⚖️ Optimization Verdict</text>

    <!-- Connector line -->
    <line x1="1097" y1="507" x2="1097" y2="538" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Decision Split Row -->
    <!-- Left: Execute Diversion -->
    <rect x="910" y="542" width="170" height="158" rx="7" fill="#fde047" stroke="#283747" stroke-width="1.5" />
    <text x="995" y="568" style="font-size: 9.8px; font-weight: bold; fill: #0f172a; text-anchor: middle;">EXECUTE MULTIMODAL</text>
    <text x="995" y="582" style="font-size: 9.8px; font-weight: bold; fill: #0f172a; text-anchor: middle;">DIVERSION</text>
    <text x="995" y="625" style="font-size: 26px; text-anchor: middle;">🚂</text>
    <text x="995" y="665" style="font-size: 8.8px; font-weight: bold; fill: #334155; text-anchor: middle;">Maintain Verdict</text>

    <!-- OR text -->
    <text x="1097" y="625" style="font-size: 11px; font-weight: bold; fill: #475569; text-anchor: middle;">OR</text>

    <!-- Right: Proceed to Anchorage -->
    <rect x="1115" y="542" width="170" height="158" rx="7" fill="#a7f3d0" stroke="#283747" stroke-width="1.5" />
    <text x="1200" y="568" style="font-size: 9.8px; font-weight: bold; fill: #064e3b; text-anchor: middle;">PROCEED TO CURRENT</text>
    <text x="1200" y="582" style="font-size: 9.8px; font-weight: bold; fill: #064e3b; text-anchor: middle;">ANCHORAGE</text>
    <text x="1200" y="625" style="font-size: 26px; text-anchor: middle;">⚓</text>
    <text x="1200" y="665" style="font-size: 8.5px; font-weight: bold; fill: #064e3b; text-anchor: middle;">Virtual arrival speed opt.</text>

    <!-- Outbound connector to Phase 4 -->
    <circle cx="1295" cy="275" r="12" fill="#10b981" stroke="#ffffff" stroke-width="2" />
    <text x="1295" y="279" style="font-size: 12px; font-weight: bold; fill: #ffffff; text-anchor: middle;">➔</text>
  </g>


  <!-- Col 4: Phase 4 (Preserved) -->
  <g id="phase-4-column">
    <rect x="1310" y="102" width="345" height="615" rx="12" fill="#eef7ee" stroke="#283747" stroke-width="2" />

    <!-- Header Pill -->
    <rect x="1320" y="112" width="325" height="32" rx="7" fill="#73b378" stroke="#283747" stroke-width="1.5" />
    <text x="1482" y="133" class="phase-head" fill="#08260b">PHASE 4 (PRESERVED)</text>

    <!-- Berth Discharge -->
    <rect x="1320" y="152" width="325" height="75" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="1482" y="174" style="font-size: 10.8px; font-weight: bold; fill: #0f172a; text-anchor: middle;">Berth Discharge &amp; Demurrage Clock Stop</text>
    <text x="1482" y="200" style="font-size: 11px; font-weight: bold; fill: #059669; text-anchor: middle;">🏗️ 2,000 MT/hr speed</text>

    <!-- Connector -->
    <line x1="1482" y1="230" x2="1482" y2="242" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Cargo-to-Port Matcher -->
    <rect x="1320" y="245" width="325" height="145" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="1332" y="266" style="font-size: 10.8px; font-weight: bold; fill: #0f172a;">Cargo-to-Port Matcher</text>
    <text x="1560" y="266" style="font-size: 8.5px; fill: #64748b; font-weight: bold;">(coal to plant)</text>

    <text x="1332" y="295" style="font-size: 9.5px; font-weight: bold; fill: #1e293b;">➔ RINL Vizag</text>
    <text x="1332" y="315" style="font-size: 9.5px; font-weight: bold; fill: #1e293b;">➔ SAIL Rourkela</text>
    <text x="1332" y="335" style="font-size: 9.5px; font-weight: bold; fill: #1e293b;">➔ TATA Kalinganagar</text>
    <text x="1332" y="355" style="font-size: 9.5px; font-weight: bold; fill: #1e293b;">➔ NTPC Power Stations</text>
    <text x="1575" y="330" style="font-size: 32px; text-anchor: middle;">🚢</text>

    <!-- Connector -->
    <line x1="1482" y1="392" x2="1482" y2="405" stroke="#283747" stroke-width="2" marker-end="url(#arrow)" />

    <!-- Coastal Hop Triangulation Engine -->
    <rect x="1320" y="408" width="325" height="65" rx="7" fill="#ffffff" stroke="#283747" stroke-width="1.5" />
    <text x="1482" y="432" style="font-size: 10.5px; font-weight: bold; fill: #0f172a; text-anchor: middle;">Coastal Hop Triangulation Engine</text>
    <text x="1482" y="452" style="font-size: 8.8px; fill: #475569; text-anchor: middle;">(Wetzel &amp; Tierney 2020 - Zero Ballast Loss)</text>

    <!-- Commercial Impact Banner -->
    <rect x="1320" y="485" width="325" height="34" rx="6" fill="#a3d9a5" stroke="#283747" stroke-width="1.5" />
    <text x="1482" y="507" style="font-size: 11px; font-weight: bold; fill: #0c3311; text-anchor: middle; letter-spacing: 0.5px;">COMMERCIAL IMPACT</text>

    <!-- Production Scaling Box -->
    <rect x="1320" y="530" width="325" height="170" rx="8" fill="#2b3942" stroke="#1a242b" stroke-width="2" />
    <text x="1482" y="558" style="font-size: 10.5px; font-weight: bold; fill: #7dd3fc; text-anchor: middle;">Production Scaling:</text>
    <text x="1482" y="576" style="font-size: 10.5px; font-weight: bold; fill: #7dd3fc; text-anchor: middle;">Jetson Nano ➔ AGX ➔ DGX</text>
    
    <!-- Server cluster graphic -->
    <g transform="translate(1380, 595)">
      <rect x="0" y="0" width="60" height="35" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1" />
      <line x1="8" y1="10" x2="52" y2="10" stroke="#38bdf8" stroke-width="2" />
      <line x1="8" y1="18" x2="52" y2="18" stroke="#38bdf8" stroke-width="2" />
      <line x1="8" y1="26" x2="52" y2="26" stroke="#38bdf8" stroke-width="2" />

      <rect x="70" y="0" width="60" height="35" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1" />
      <line x1="78" y1="10" x2="122" y2="10" stroke="#818cf8" stroke-width="2" />
      <line x1="78" y1="18" x2="122" y2="18" stroke="#818cf8" stroke-width="2" />
      <line x1="78" y1="26" x2="122" y2="26" stroke="#818cf8" stroke-width="2" />

      <rect x="140" y="0" width="60" height="35" rx="3" fill="#1e293b" stroke="#64748b" stroke-width="1" />
      <line x1="148" y1="10" x2="192" y2="10" stroke="#34d399" stroke-width="2" />
      <line x1="148" y1="18" x2="192" y2="18" stroke="#34d399" stroke-width="2" />
      <line x1="148" y1="26" x2="192" y2="26" stroke="#34d399" stroke-width="2" />
    </g>

    <text x="1482" y="675" style="font-size: 8.8px; font-weight: bold; fill: #cbd5e1; text-anchor: middle;">(Same code, scalable hardware)</text>
  </g>

  <!-- ==================== BOTTOM BAR ==================== -->
  <g id="bottom-bar">
    <rect x="25" y="726" width="1630" height="36" rx="8" fill="#243542" stroke="#16222b" stroke-width="1.8" />
    
    <rect x="35" y="732" width="165" height="24" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <text x="45" y="748" style="font-size: 10px; font-weight: bold; fill: #e2e8f0;">📄 Optional Deployment Note</text>
    
    <rect x="215" y="732" width="135" height="24" rx="4" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
    <text x="225" y="748" style="font-size: 10px; font-weight: bold; fill: #e2e8f0;">💻 Edge Demo Device</text>
    
    <text x="1640" y="749" style="font-size: 11px; font-weight: bold; fill: #38bdf8; text-anchor: end;">Optimized Tender, Predictive Routing, &amp; 360° Profitability across the entire logistics chain.</text>
  </g>
</svg>
"""

out_dir = r"C:\Users\Manthan\OneDrive\Desktop\sih26006"
svg_path = os.path.join(out_dir, "NaviFreight_Architecture_Workflow_Canva_Editable.svg")
with open(svg_path, "w", encoding="utf-8") as f:
    f.write(svg_content)

print(f"Created SVG successfully at: {svg_path}")
