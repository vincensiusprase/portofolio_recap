import os
import json
import random
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Master Kriteria
RELEVANT_MAJORS = ["Statistika", "Matematika", "Teknik Informatika", "Ilmu Komputer", "Sistem Informasi"]
IRRELEVANT_MAJORS = ["Sastra Inggris", "Manajemen Hotel", "Seni Rupa", "Ilmu Hukum", "Pertanian"]

QUALIFIED_DEGREES = ["S1", "S2"]
UNQUALIFIED_DEGREES = ["D3", "SMA/SMK"]

TARGET_SKILLS = [
    "Python (Pandas, NumPy)", "SQL (BigQuery, PostgreSQL)", "Tableau & Power BI", 
    "Looker Studio", "Advanced Excel & Google Sheets", "ETL/ELT Data Pipelines", 
    "Data Modeling & Dataform", "Statistik & Machine Learning", "Google Cloud Platform (GCP)"
]
IRRELEVANT_SKILLS = ["Photoshop", "SEO & Marketing", "Copywriting", "Servis Hardware", "Data Entry Manual", "Adobe Illustrator"]

TARGET_JOB_DESCS = [
    "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
    "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
    "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
    "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
]

IRRELEVANT_JOB_DESCS = [
    "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
    "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
    "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
]

# --- BANK PROYEK BERVARIASI ---
HIGH_PROJECTS = [
    ("End-to-End Recruitment Automation System", "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."),
    ("Enterprise Data Architecture & Pipeline", "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."),
    ("Automated Production & Inventory Optimization", "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."),
    ("Automated Lead Scraper & CRM Integration", "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."),
    ("Conversational Analytics Dashboard", "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen.")
]

MEDIUM_PROJECTS = [
    ("Academic Data Analysis & Reporting", "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."),
    ("E-Commerce Sales Performance Dashboard", "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."),
    ("Customer Feedback Sentiment Analysis", "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."),
    ("Operational Inventory Tracker", "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang.")
]

LOW_PROJECTS = [
    ("Redesain Banner Media Sosial", "Membuat template desain promosi harian menggunakan Adobe Photoshop."),
    ("Pencatatan Administrasi Kasir", "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."),
    ("Maintenance Jaringan Kantor", "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf.")
]

os.makedirs("output_cvs", exist_ok=True)

def generate_person():
    first = random.choice(["Budi", "Siti", "Rian", "Dewi", "Agus", "Anisa", "Eko", "Maya", "Rizky", "Fitri"])
    last = random.choice(["Santoso", "Wijaya", "Saputra", "Lestari", "Kusuma", "Utami", "Hidayat", "Nugroho"])
    name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}@gmail.com"
    phone = f"08{random.randint(11,99)}{random.randint(1000,9999)}"
    city = random.choice(["Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Semarang", "Tangerang"])
    return name, email, phone, city

def generate_cv_data(tier):
    name, email, phone, city = generate_person()

    if tier == "High":
        major = random.choice(RELEVANT_MAJORS)
        degree = random.choice(QUALIFIED_DEGREES)
        exp_years = random.choice([2, 3, 4, 5])
        target_job = "DATA ANALYST"
        tech_skills = random.sample(TARGET_SKILLS, 6)
        job_descs = random.sample(TARGET_JOB_DESCS, 3)
        headline = f"{exp_years}+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION"
        certifications = ["BNSP Data Analyst Certified", "Google Cloud Data Engineer"]
        # Ambil 2 proyek acak dari variasi High
        projects = random.sample(HIGH_PROJECTS, 2)

    elif tier == "Medium":
        major = random.choice(RELEVANT_MAJORS + IRRELEVANT_MAJORS[:2])
        degree = random.choice(["S1", "D3"])
        exp_years = random.choice([0, 1])
        target_job = "JUNIOR DATA ANALYST"
        tech_skills = random.sample(TARGET_SKILLS, 3) + random.sample(IRRELEVANT_SKILLS, 2)
        job_descs = random.sample(TARGET_JOB_DESCS, 1) + random.sample(IRRELEVANT_JOB_DESCS, 2)
        headline = f"DATA ANALYTICS ENTHUSIAST | GRADUATE IN {major.upper()}"
        certifications = ["Basic Excel Certification"]
        # Ambil 2 proyek acak dari variasi Medium
        projects = random.sample(MEDIUM_PROJECTS, 2)

    else:  # Low Quality
        major = random.choice(IRRELEVANT_MAJORS)
        degree = random.choice(UNQUALIFIED_DEGREES)
        exp_years = 0
        target_job = "ADMINISTRATIVE STAFF"
        tech_skills = random.sample(IRRELEVANT_SKILLS, 4)
        job_descs = random.sample(IRRELEVANT_JOB_DESCS, 2)
        headline = "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES"
        certifications = ["Sertifikat Seminar Nasional"]
        # Ambil 1-2 proyek acak dari variasi Low
        projects = random.sample(LOW_PROJECTS, 1)

    return {
        "tier": tier, "name": name, "email": email, "phone": phone, "city": city,
        "target_job": target_job, "headline": headline, "degree": degree, "major": major,
        "exp_years": exp_years, "tech_skills": tech_skills, "job_descs": job_descs,
        "certifications": certifications, "projects": projects
    }

def create_professional_cv(filename, cv_data):
    doc = SimpleDocTemplate(
        filename, pagesize=letter,
        rightMargin=18, leftMargin=18, topMargin=18, bottomMargin=18
    )
    story = []
    styles = getSampleStyleSheet()

    PRIMARY_COLOR = colors.HexColor("#1A365D")
    SECONDARY_COLOR = colors.HexColor("#2B6CB0")
    TEXT_COLOR = colors.HexColor("#2D3748")

    name_style = ParagraphStyle('NameStyle', parent=styles['Heading1'], fontSize=16, leading=18, textColor=PRIMARY_COLOR, fontName="Helvetica-Bold")
    headline_style = ParagraphStyle('HeadlineStyle', parent=styles['Normal'], fontSize=8, leading=10, textColor=SECONDARY_COLOR, fontName="Helvetica-Bold", spaceAfter=8)
    
    sidebar_title = ParagraphStyle('SidebarTitle', parent=styles['Heading2'], fontSize=9, leading=11, textColor=PRIMARY_COLOR, fontName="Helvetica-Bold", spaceBefore=6, spaceAfter=4)
    sidebar_text = ParagraphStyle('SidebarText', parent=styles['Normal'], fontSize=7.5, leading=9.5, textColor=TEXT_COLOR)
    
    main_title = ParagraphStyle('MainTitle', parent=styles['Heading2'], fontSize=10, leading=12, textColor=PRIMARY_COLOR, fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=4)
    main_body = ParagraphStyle('MainBody', parent=styles['Normal'], fontSize=7.5, leading=9.5, textColor=TEXT_COLOR)

    # 1. HEADER SECTION
    story.append(Paragraph(cv_data['name'].upper(), name_style))
    story.append(Paragraph(cv_data['headline'], headline_style))

    # 2. SIDEBAR (KOLOM KIRI)
    left_flowables = []
    left_flowables.append(Paragraph("<b>CONTACT</b>", sidebar_title))
    left_flowables.append(Paragraph(f"• Phone: {cv_data['phone']}", sidebar_text))
    left_flowables.append(Paragraph(f"• Email: {cv_data['email']}", sidebar_text))
    left_flowables.append(Paragraph(f"• Location: {cv_data['city']}", sidebar_text))
    left_flowables.append(Spacer(1, 6))

    left_flowables.append(Paragraph("<b>SKILLS & COMPETENCIES</b>", sidebar_title))
    for skill in cv_data['tech_skills']:
        left_flowables.append(Paragraph(f"• {skill}", sidebar_text))
    left_flowables.append(Spacer(1, 6))

    left_flowables.append(Paragraph("<b>CERTIFICATIONS</b>", sidebar_title))
    for cert in cv_data['certifications']:
        left_flowables.append(Paragraph(f"• {cert}", sidebar_text))
    left_flowables.append(Spacer(1, 6))

    left_flowables.append(Paragraph("<b>LANGUAGES</b>", sidebar_title))
    left_flowables.append(Paragraph("• English (Intermediate)", sidebar_text))
    left_flowables.append(Paragraph("• Bahasa Indonesia (Native)", sidebar_text))

    # 3. MAIN CONTENT (KOLOM KANAN)
    right_flowables = []

    # Work Experience
    right_flowables.append(Paragraph("<b>WORK EXPERIENCE</b>", main_title))
    if cv_data['exp_years'] > 0:
        company = f"PT {random.choice(['Karya Data', 'Solusi Digital', 'Nusantara Tech', 'Inovasi Bersama'])}"
        level_label = "Senior" if cv_data['exp_years'] >= 3 else "Junior"
        role_title = f"{cv_data['target_job']} ({level_label})" if cv_data['tier'] == "High" else cv_data['target_job']
        start_year = 2026 - cv_data['exp_years']
        
        right_flowables.append(Paragraph(f"<b>{role_title}</b> - <i>{company}</i>", main_body))
        right_flowables.append(Paragraph(f"<font color='#718096'><i>Jan {start_year} - Present ({cv_data['exp_years']} Years)</i></font>", main_body))
        right_flowables.append(Spacer(1, 2))
        for desc in cv_data['job_descs']:
            right_flowables.append(Paragraph(f"• {desc}", main_body))
    else:
        right_flowables.append(Paragraph("<b>ENTRY LEVEL / FRESH GRADUATE</b>", main_body))
        for desc in cv_data['job_descs']:
            right_flowables.append(Paragraph(f"• {desc}", main_body))
    
    right_flowables.append(Spacer(1, 8))

    # Key Projects (Dinamis dari List Proyek Acak)
    right_flowables.append(Paragraph("<b>KEY PROJECTS</b>", main_title))
    for proj_title, proj_desc in cv_data['projects']:
        right_flowables.append(Paragraph(f"<b>{proj_title}</b>", main_body))
        right_flowables.append(Paragraph(f"• {proj_desc}", main_body))

    right_flowables.append(Spacer(1, 8))

    # Education
    right_flowables.append(Paragraph("<b>EDUCATION</b>", main_title))
    univ = f"Universitas {cv_data['city']}" if "SMA" not in cv_data['degree'] else f"SMA Negeri 1 {cv_data['city']}"
    right_flowables.append(Paragraph(f"<b>BACHELOR OF {cv_data['major'].upper()}</b>", main_body))
    right_flowables.append(Paragraph(f"{univ} | Graduated {random.randint(2019, 2024)}", main_body))

    # Tabel Utama Dua Kolom
    table_data = [[left_flowables, right_flowables]]
    main_table = Table(table_data, colWidths=[185, 391])
    main_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 10),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
        ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LINEAFTER', (0, 0), (0, 0), 0.5, colors.HexColor("#CBD5E0")),
    ]))

    story.append(main_table)
    doc.build(story)

# Run Generator
tiers = ["High"] * 40 + ["Medium"] * 35 + ["Low"] * 25
random.shuffle(tiers)

dataset_metadata = []

for idx, tier in enumerate(tiers, start=1):
    cv_data = generate_cv_data(tier)
    filename = f"output_cvs/CV_{idx:03d}_{tier}.pdf"
    create_professional_cv(filename, cv_data)
    
    cv_data["file_path"] = filename
    dataset_metadata.append(cv_data)

with open("output_cvs/dataset_ground_truth.json", "w", encoding="utf-8") as f:
    json.dump(dataset_metadata, f, indent=2, ensure_ascii=False)

print("Selesai! 100 PDF CV dengan proyek yang bervariasi berhasil di-generate.")