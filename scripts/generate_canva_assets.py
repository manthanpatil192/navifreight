import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_editable_pptx(output_path):
    prs = Presentation()
    # 16:9 Widescreen slide dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6] # blank
    slide = prs.slides.add_slide(blank_slide_layout)

    # Background canvas
    bg_shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(0.2), Inches(0.2), Inches(12.933), Inches(7.1)
    )
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = RGBColor(255, 255, 255)
    bg_shape.line.color.rgb = RGBColor(30, 41, 59) # #1e293b
    bg_shape.line.width = Pt(2.5)

    # 1. Top Header Pill
    title_box = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Inches(2.5), Inches(0.32), Inches(8.333), Inches(0.48)
    )
    title_box.fill.solid()
    title_box.fill.fore_color.rgb = RGBColor(36, 53, 66) # #243542
    title_box.line.color.rgb = RGBColor(17, 30, 38)
    title_box.line.width = Pt(1)

    tf = title_box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.text = "NaviFreight AI – Updated High-Level System Architecture & Operational Workflow"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    # Subtitle / Purpose
    sub_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.82), Inches(12.333), Inches(0.28))
    tf_sub = sub_box.text_frame
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "Purpose: To clearly show how updated data flows and user inputs enable optimized dry-bulk freight forecasting & vessel routing on the Indian East Coast"
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.font.name = "Arial"
    p_sub.font.size = Pt(9.5)
    p_sub.font.bold = True
    p_sub.font.color.rgb = RGBColor(15, 23, 42)

    # 4 Main Columns Configuration
    # Total width available: 12.5 inches. Left start: 0.4 inches.
    col_w = [Inches(3.7), Inches(2.8), Inches(3.1), Inches(2.9)]
    col_x = [Inches(0.4), Inches(4.2), Inches(7.1), Inches(10.3)]
    col_y = Inches(1.15)
    col_h = Inches(5.35)

    # =========================================================================
    # COLUMN 1: PHASE 1 (REVISED)
    # =========================================================================
    p1_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0], col_y, col_w[0], col_h)
    p1_bg.fill.solid()
    p1_bg.fill.fore_color.rgb = RGBColor(232, 242, 248) # #E8F2F8
    p1_bg.line.color.rgb = RGBColor(40, 55, 71)
    p1_bg.line.width = Pt(1.5)

    # Column 1 Header Pill
    p1_head = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0] + Inches(0.1), col_y + Inches(0.08), col_w[0] - Inches(0.2), Inches(0.32))
    p1_head.fill.solid()
    p1_head.fill.fore_color.rgb = RGBColor(100, 155, 181) # #649BB5
    p1_head.line.color.rgb = RGBColor(40, 55, 71)
    p = p1_head.text_frame.paragraphs[0]
    p.text = "PHASE 1 (REVISED)"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(4, 27, 41)

    # Sub-card 1: Logistics Manager Inputs (Left half)
    sub1_w = Inches(1.7)
    sub1_h = Inches(1.85)
    sub1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0] + Inches(0.1), col_y + Inches(0.45), sub1_w, sub1_h)
    sub1.fill.solid()
    sub1.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sub1.line.color.rgb = RGBColor(40, 55, 71)
    sub1.line.width = Pt(1)
    tf1 = sub1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "Logistics Manager (User Input)"
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(2, 132, 199)

    bullets1 = [
        "• Global Source Port (AU/ID)",
        "• Indian Destination Port (PPT/VTZ)",
        "• Total Order Quantity (MT)",
        "• Contract Term (1, 3, 6 Months)",
        "[SIMPLIFIED STOCKPILES]: Target inventory based on steel plant sheet rolling schedule."
    ]
    for b in bullets1:
        p = tf1.add_paragraph()
        p.text = b
        p.font.name = "Arial"
        p.font.size = Pt(6.8)
        p.font.color.rgb = RGBColor(30, 41, 59)

    # Sub-card 2: Data Ingestion (Right half)
    sub2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0] + Inches(1.9), col_y + Inches(0.45), Inches(1.7), sub1_h)
    sub2.fill.solid()
    sub2.fill.fore_color.rgb = RGBColor(255, 255, 255)
    sub2.line.color.rgb = RGBColor(40, 55, 71)
    sub2.line.width = Pt(1)
    tf2 = sub2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "Data Ingestion Pipeline"
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(2, 132, 199)

    ingest_items = [
        "[BDI-INDEX] (Baltic Dry Index)",
        "[BDRY-INDEX] (Baltic Bulk Index)",
        "[YAHOO-MARKET] (Financial Data)",
        "[BUNKER-P] Global Fuel Prices",
        "[PORT-T] Port Physical Constraints"
    ]
    for item in ingest_items:
        p = tf2.add_paragraph()
        p.text = item
        p.font.name = "Arial"
        p.font.size = Pt(6.8)
        p.font.bold = True
        p.font.color.rgb = RGBColor(30, 41, 59)

    # Core Tender Preparation Box (USER REQUEST VALUE UPDATE)
    tender_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0] + Inches(0.1), col_y + Inches(2.38), col_w[0] - Inches(0.2), Inches(1.85))
    tender_box.fill.solid()
    tender_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    tender_box.line.color.rgb = RGBColor(2, 132, 199)
    tender_box.line.width = Pt(2)
    tf_t = tender_box.text_frame
    tf_t.word_wrap = True

    p = tf_t.paragraphs[0]
    p.text = "📜 Tender Preparation & Charter-Party Rolling Analysis [PSU/GFR COMPLIANT]"
    p.font.name = "Arial"
    p.font.size = Pt(8.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(3, 105, 161)

    tender_points = [
        "🗓️ Minimum 21 Days Statutory Tender Notice: Mandatory compliance under GFR 2017 Rule 161 prior to cargo laycan window.",
        "⚖️ 70/30 COA-to-Spot Ratio: 70% volume locked via quarterly COA for basestock safety, 30% spot chartering to capture freight dips.",
        "• Charter-Party Rolling: Dynamically calculates required vessel tonnage & ship delivery rolling based on plant minimum stockpile buffers."
    ]
    for tp in tender_points:
        p = tf_t.add_paragraph()
        p.text = tp
        p.font.name = "Arial"
        p.font.size = Pt(7.4)
        p.font.color.rgb = RGBColor(15, 23, 42)

    # Sub-card 4: Early Global Volatility Radar
    radar_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[0] + Inches(0.1), col_y + Inches(4.32), col_w[0] - Inches(0.2), Inches(0.92))
    radar_box.fill.solid()
    radar_box.fill.fore_color.rgb = RGBColor(98, 155, 181)
    radar_box.line.color.rgb = RGBColor(40, 55, 71)
    radar_box.line.width = Pt(1.5)
    tf_r = radar_box.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "🌐 Early Global Volatility Radar"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = RGBColor(3, 27, 44)

    r_items = [
        "• Captures Capesize spot surges 14 days early",
        "• Tracks Bay of Bengal cyclones, weather depressions & canal choke points"
    ]
    for ri in r_items:
        p = tf_r.add_paragraph()
        p.text = ri
        p.font.name = "Arial"
        p.font.size = Pt(7.2)
        p.font.bold = True
        p.font.color.rgb = RGBColor(7, 33, 51)


    # =========================================================================
    # COLUMN 2: PHASE 2 (PRESERVED)
    # =========================================================================
    p2_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1], col_y, col_w[1], col_h)
    p2_bg.fill.solid()
    p2_bg.fill.fore_color.rgb = RGBColor(251, 240, 216) # #FBF0D8
    p2_bg.line.color.rgb = RGBColor(40, 55, 71)
    p2_bg.line.width = Pt(1.5)

    p2_head = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.1), col_y + Inches(0.08), col_w[1] - Inches(0.2), Inches(0.32))
    p2_head.fill.solid()
    p2_head.fill.fore_color.rgb = RGBColor(233, 149, 71) # #E99547
    p2_head.line.color.rgb = RGBColor(40, 55, 71)
    p = p2_head.text_frame.paragraphs[0]
    p.text = "PHASE 2 (PRESERVED)"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(43, 20, 2)

    # Tier-1 Arrival ETA
    eta_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.1), col_y + Inches(0.5), col_w[1] - Inches(0.2), Inches(0.95))
    eta_box.fill.solid()
    eta_box.fill.fore_color.rgb = RGBColor(253, 230, 196)
    eta_box.line.color.rgb = RGBColor(40, 55, 71)
    eta_box.line.width = Pt(1)
    tf_eta = eta_box.text_frame
    tf_eta.word_wrap = True
    p = tf_eta.paragraphs[0]
    p.text = "⏱️ Tier-1 Arrival ETA (48h–72h / 2–3 Days Out)"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(30, 41, 59)
    p2 = tf_eta.add_paragraph()
    p2.text = "Simulate long-range arrival bunching to queue inbound coal vessels reliably at outer anchorage"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7.2)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Congestion Alert
    alert_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.1), col_y + Inches(1.58), col_w[1] - Inches(0.2), Inches(0.72))
    alert_box.fill.solid()
    alert_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    alert_box.line.color.rgb = RGBColor(40, 55, 71)
    alert_box.line.width = Pt(1)
    tf_al = alert_box.text_frame
    tf_al.word_wrap = True
    p = tf_al.paragraphs[0]
    p.text = "⚠️ Tier-1 Congestion Alert"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)
    p2 = tf_al.add_paragraph()
    p2.text = "(Anchorage wait > 24–48 hours)"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(8)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(234, 88, 12)

    # Priority Factor Box
    prio_cont = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.1), col_y + Inches(2.45), col_w[1] - Inches(0.2), Inches(2.78))
    prio_cont.fill.solid()
    prio_cont.fill.fore_color.rgb = RGBColor(250, 220, 166)
    prio_cont.line.color.rgb = RGBColor(40, 55, 71)
    prio_cont.line.width = Pt(1.5)
    tf_pc = prio_cont.text_frame
    tf_pc.word_wrap = True
    p = tf_pc.paragraphs[0]
    p.text = "Emergency Coal Priority Factor"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)

    # Diamond: Critical Stockpile
    dia = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, col_x[1] + Inches(0.35), col_y + Inches(2.85), col_w[1] - Inches(0.7), Inches(0.95))
    dia.fill.solid()
    dia.fill.fore_color.rgb = RGBColor(239, 68, 68)
    dia.line.color.rgb = RGBColor(40, 55, 71)
    dia.line.width = Pt(1.5)
    tf_d = dia.text_frame
    tf_d.word_wrap = True
    p = tf_d.paragraphs[0]
    p.text = "Critical Stockpile\n< 4.2 days / CEA Red Flag"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(7.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    # Yes -> Emergency Coal Priority
    act1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.2), col_y + Inches(3.95), col_w[1] - Inches(0.4), Inches(0.48))
    act1.fill.solid()
    act1.fill.fore_color.rgb = RGBColor(234, 88, 12)
    act1.line.color.rgb = RGBColor(40, 55, 71)
    p = act1.text_frame.paragraphs[0]
    p.text = "🚨 Emergency Coal Priority"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    # No -> Maintain FIFO
    act2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[1] + Inches(0.2), col_y + Inches(4.55), col_w[1] - Inches(0.4), Inches(0.48))
    act2.fill.solid()
    act2.fill.fore_color.rgb = RGBColor(245, 158, 11)
    act2.line.color.rgb = RGBColor(40, 55, 71)
    p = act2.text_frame.paragraphs[0]
    p.text = "Maintain FIFO Berthing"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(30, 27, 75)


    # =========================================================================
    # COLUMN 3: PHASE 3 (PRESERVED)
    # =========================================================================
    p3_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[2], col_y, col_w[2], col_h)
    p3_bg.fill.solid()
    p3_bg.fill.fore_color.rgb = RGBColor(251, 242, 234) # #FBF2EA
    p3_bg.line.color.rgb = RGBColor(40, 55, 71)
    p3_bg.line.width = Pt(1.5)

    p3_head = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[2] + Inches(0.1), col_y + Inches(0.08), col_w[2] - Inches(0.2), Inches(0.45))
    p3_head.fill.solid()
    p3_head.fill.fore_color.rgb = RGBColor(226, 97, 90) # #E2615A
    p3_head.line.color.rgb = RGBColor(40, 55, 71)
    p = p3_head.text_frame.paragraphs[0]
    p.text = "PHASE 3 (PRESERVED) - DECISION GATE & MULTIMODAL DIVERSION (6h Threshold)"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.2)
    p.font.bold = True
    p.font.color.rgb = RGBColor(43, 4, 4)

    # 3-Way Optimization Equation
    opt_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[2] + Inches(0.1), col_y + Inches(0.6), col_w[2] - Inches(0.2), Inches(2.2))
    opt_box.fill.solid()
    opt_box.fill.fore_color.rgb = RGBColor(251, 230, 158)
    opt_box.line.color.rgb = RGBColor(40, 55, 71)
    opt_box.line.width = Pt(1.5)
    tf_opt = opt_box.text_frame
    tf_opt.word_wrap = True
    p = tf_opt.paragraphs[0]
    p.text = "⚖️ 3-Way Optimization Equation"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(30, 41, 59)

    p_cb = tf_opt.add_paragraph()
    p_cb.text = "\nCost B: Port Diversion Bunker Fuel (Vizag ➔ Dhamra)"
    p_cb.font.name = "Arial"
    p_cb.font.size = Pt(8)
    p_cb.font.bold = True
    p_cb.font.color.rgb = RGBColor(120, 53, 15)

    p_cc = tf_opt.add_paragraph()
    p_cc.text = "\nCost C: Multimodal Inland Evacuation – Indian Railways FOIS 48 hr rake indent freight tariff vs Emergency Road Trucking freight"
    p_cc.font.name = "Arial"
    p_cc.font.size = Pt(7.5)
    p_cc.font.color.rgb = RGBColor(15, 23, 42)

    # Verdict Diamond
    verdict = slide.shapes.add_shape(MSO_SHAPE.DIAMOND, col_x[2] + Inches(0.6), col_y + Inches(2.95), col_w[2] - Inches(1.2), Inches(0.95))
    verdict.fill.solid()
    verdict.fill.fore_color.rgb = RGBColor(255, 255, 255)
    verdict.line.color.rgb = RGBColor(40, 55, 71)
    verdict.line.width = Pt(1.5)
    p = verdict.text_frame.paragraphs[0]
    p.text = "Optimization\nVerdict"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)

    # Branch 1: Multimodal Diversion (Left)
    b1_w = (col_w[2] - Inches(0.35)) / 2
    b1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[2] + Inches(0.1), col_y + Inches(4.05), b1_w, Inches(1.15))
    b1.fill.solid()
    b1.fill.fore_color.rgb = RGBColor(253, 224, 71) # #FDE047
    b1.line.color.rgb = RGBColor(40, 55, 71)
    tf_b1 = b1.text_frame
    tf_b1.word_wrap = True
    p = tf_b1.paragraphs[0]
    p.text = "🚂 EXECUTE MULTIMODAL DIVERSION"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)
    p2 = tf_b1.add_paragraph()
    p2.text = "Maintain Verdict & Pre-book FOIS rakes"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7)
    p2.font.color.rgb = RGBColor(51, 65, 85)

    # Branch 2: Proceed to Anchorage (Right)
    b2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[2] + Inches(0.1) + b1_w + Inches(0.15), col_y + Inches(4.05), b1_w, Inches(1.15))
    b2.fill.solid()
    b2.fill.fore_color.rgb = RGBColor(167, 243, 208) # #A7F3D0
    b2.line.color.rgb = RGBColor(40, 55, 71)
    tf_b2 = b2.text_frame
    tf_b2.word_wrap = True
    p = tf_b2.paragraphs[0]
    p.text = "⚓ PROCEED TO CURRENT ANCHORAGE"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(7.8)
    p.font.bold = True
    p.font.color.rgb = RGBColor(6, 78, 59)
    p2 = tf_b2.add_paragraph()
    p2.text = "Virtual arrival speed eco-optimization"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7)
    p2.font.color.rgb = RGBColor(51, 65, 85)


    # =========================================================================
    # COLUMN 4: PHASE 4 (PRESERVED)
    # =========================================================================
    p4_bg = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3], col_y, col_w[3], col_h)
    p4_bg.fill.solid()
    p4_bg.fill.fore_color.rgb = RGBColor(238, 247, 238) # #EEF7EE
    p4_bg.line.color.rgb = RGBColor(40, 55, 71)
    p4_bg.line.width = Pt(1.5)

    p4_head = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(0.08), col_w[3] - Inches(0.2), Inches(0.32))
    p4_head.fill.solid()
    p4_head.fill.fore_color.rgb = RGBColor(115, 179, 120) # #73B378
    p4_head.line.color.rgb = RGBColor(40, 55, 71)
    p = p4_head.text_frame.paragraphs[0]
    p.text = "PHASE 4 (PRESERVED)"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(8, 38, 11)

    # Berth Discharge
    berth_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(0.5), col_w[3] - Inches(0.2), Inches(0.78))
    berth_box.fill.solid()
    berth_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    berth_box.line.color.rgb = RGBColor(40, 55, 71)
    tf_b = berth_box.text_frame
    tf_b.word_wrap = True
    p = tf_b.paragraphs[0]
    p.text = "🏗️ Berth Discharge & Demurrage Clock Stop"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)
    p2 = tf_b.add_paragraph()
    p2.text = "⚡ 2,000 MT/hr continuous grab unloader discharge"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7.5)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(5, 150, 105)

    # Cargo-to-Port Matcher
    match_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(1.38), col_w[3] - Inches(0.2), Inches(1.4))
    match_box.fill.solid()
    match_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    match_box.line.color.rgb = RGBColor(40, 55, 71)
    tf_m = match_box.text_frame
    tf_m.word_wrap = True
    p = tf_m.paragraphs[0]
    p.text = "🚢 Cargo-to-Port Matcher (Coal to Plant)"
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)

    plants = [
        "➔ RINL Vizag (Coking Coal / Ash < 10%)",
        "➔ SAIL Rourkela (High-GCV Metallurgical)",
        "➔ TATA Kalinganagar (Low VM Blend)",
        "➔ NTPC Power Stations (Non-Coking Thermal)"
    ]
    for pl in plants:
        p = tf_m.add_paragraph()
        p.text = pl
        p.font.name = "Arial"
        p.font.size = Pt(7)
        p.font.bold = True
        p.font.color.rgb = RGBColor(30, 41, 59)

    # Coastal Hop Triangulation
    hop_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(2.88), col_w[3] - Inches(0.2), Inches(0.72))
    hop_box.fill.solid()
    hop_box.fill.fore_color.rgb = RGBColor(255, 255, 255)
    hop_box.line.color.rgb = RGBColor(40, 55, 71)
    tf_h = hop_box.text_frame
    tf_h.word_wrap = True
    p = tf_h.paragraphs[0]
    p.text = "🔄 Coastal Hop Triangulation Engine"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(15, 23, 42)
    p2 = tf_h.add_paragraph()
    p2.text = "(Wetzel & Tierney 2020 Model - Eliminates Deadhead Ballast)"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7)
    p2.font.color.rgb = RGBColor(71, 85, 105)

    # Commercial Impact Banner
    comm_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(3.68), col_w[3] - Inches(0.2), Inches(0.35))
    comm_box.fill.solid()
    comm_box.fill.fore_color.rgb = RGBColor(163, 217, 165)
    comm_box.line.color.rgb = RGBColor(40, 55, 71)
    p = comm_box.text_frame.paragraphs[0]
    p.text = "COMMERCIAL IMPACT"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(12, 51, 17)

    # Production Scaling (Edge & Cloud)
    scale_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_x[3] + Inches(0.1), col_y + Inches(4.12), col_w[3] - Inches(0.2), Inches(1.12))
    scale_box.fill.solid()
    scale_box.fill.fore_color.rgb = RGBColor(43, 57, 66)
    scale_box.line.color.rgb = RGBColor(26, 36, 43)
    tf_s = scale_box.text_frame
    tf_s.word_wrap = True
    p = tf_s.paragraphs[0]
    p.text = "🖥️ Production Scaling:\nJetson Nano ➔ AGX ➔ DGX"
    p.alignment = PP_ALIGN.CENTER
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(125, 211, 252)

    p2 = tf_s.add_paragraph()
    p2.text = "(Same containerized code, scalable hardware)"
    p2.alignment = PP_ALIGN.CENTER
    p2.font.name = "Arial"
    p2.font.size = Pt(7.2)
    p2.font.color.rgb = RGBColor(203, 213, 225)


    # =========================================================================
    # BOTTOM SUMMARY BAR
    # =========================================================================
    bot_bar = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.4), Inches(6.6), Inches(12.533), Inches(0.45))
    bot_bar.fill.solid()
    bot_bar.fill.fore_color.rgb = RGBColor(36, 53, 66)
    bot_bar.line.color.rgb = RGBColor(22, 34, 43)
    tf_b = bot_bar.text_frame
    tf_b.word_wrap = True
    p = tf_b.paragraphs[0]
    p.text = "📄 Optional Deployment Note     💻 Edge Demo Device                           Optimized Tender, Predictive Routing, & 360° Profitability across the entire logistics chain."
    p.font.name = "Arial"
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)

    prs.save(output_path)
    print(f"Created PPTX successfully at: {output_path}")

if __name__ == '__main__':
    out_dir = r"C:\Users\Manthan\OneDrive\Desktop\sih26006"
    pptx_path = os.path.join(out_dir, "NaviFreight_Architecture_Workflow_Canva_Editable.pptx")
    create_editable_pptx(pptx_path)
