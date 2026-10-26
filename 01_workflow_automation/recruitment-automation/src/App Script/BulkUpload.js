function processBulkUpload() {
  var folderId = "1mj6bqcsaGcGS3cS1fxUpEd_gRN8mlIF8e6-yEjY_ouWsByocnrTa3msDOYustj8BMr_447DU";
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var folder = DriveApp.getFolderById(folderId);
  
  // Data JSON Anda (bisa ditempel langsung atau di-fetch dari URL/Drive)
  var jsonString = `[
  {
    "tier": "High",
    "name": "Dewi Hidayat",
    "email": "dewi.hidayat@gmail.com",
    "phone": "08539427",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Sistem Informasi",
    "exp_years": 5,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "Looker Studio"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_001_High.pdf"
  },
  {
    "tier": "High",
    "name": "Agus Utami",
    "email": "agus.utami@gmail.com",
    "phone": "08731550",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 3,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "SQL (BigQuery, PostgreSQL)",
      "Tableau & Power BI",
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_002_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Rizky Santoso",
    "email": "rizky.santoso@gmail.com",
    "phone": "08271576",
    "city": "Surabaya",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Seni Rupa",
    "exp_years": 0,
    "tech_skills": [
      "Copywriting",
      "Data Entry Manual",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_003_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Dewi Kusuma",
    "email": "dewi.kusuma@gmail.com",
    "phone": "08542482",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Copywriting",
      "Servis Hardware",
      "Photoshop"
    ],
    "job_descs": [
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_004_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Siti Lestari",
    "email": "siti.lestari@gmail.com",
    "phone": "08619859",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Statistika",
    "exp_years": 2,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Statistik & Machine Learning",
      "Looker Studio",
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_005_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Siti Santoso",
    "email": "siti.santoso@gmail.com",
    "phone": "08981751",
    "city": "Yogyakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Ilmu Hukum",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "Copywriting",
      "Adobe Illustrator",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_006_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Fitri Nugroho",
    "email": "fitri.nugroho@gmail.com",
    "phone": "08976008",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "S1",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Looker Studio",
      "Data Modeling & Dataform",
      "Google Cloud Platform (GCP)",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_007_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Dewi Lestari",
    "email": "dewi.lestari@gmail.com",
    "phone": "08651144",
    "city": "Semarang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 0,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "SEO & Marketing",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_008_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Maya Lestari",
    "email": "maya.lestari@gmail.com",
    "phone": "08644992",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 2,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Python (Pandas, NumPy)",
      "Advanced Excel & Google Sheets",
      "SQL (BigQuery, PostgreSQL)",
      "Looker Studio"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_009_High.pdf"
  },
  {
    "tier": "High",
    "name": "Budi Utami",
    "email": "budi.utami@gmail.com",
    "phone": "08763905",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Matematika",
    "exp_years": 3,
    "tech_skills": [
      "Looker Studio",
      "ETL/ELT Data Pipelines",
      "Advanced Excel & Google Sheets",
      "Data Modeling & Dataform",
      "Python (Pandas, NumPy)",
      "SQL (BigQuery, PostgreSQL)"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_010_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Maya Nugroho",
    "email": "maya.nugroho@gmail.com",
    "phone": "08936537",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Servis Hardware",
      "Adobe Illustrator",
      "Copywriting",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_011_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Fitri Hidayat",
    "email": "fitri.hidayat@gmail.com",
    "phone": "08634171",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 1,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "Tableau & Power BI",
      "Statistik & Machine Learning",
      "Copywriting",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_012_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Hidayat",
    "email": "anisa.hidayat@gmail.com",
    "phone": "08613185",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Sistem Informasi",
    "exp_years": 3,
    "tech_skills": [
      "Tableau & Power BI",
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Google Cloud Platform (GCP)",
      "Looker Studio",
      "Statistik & Machine Learning"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_013_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Maya Lestari",
    "email": "maya.lestari@gmail.com",
    "phone": "08404943",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "D3",
    "major": "Matematika",
    "exp_years": 0,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)",
      "Copywriting",
      "Photoshop"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_014_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Siti Hidayat",
    "email": "siti.hidayat@gmail.com",
    "phone": "08723825",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 2,
    "tech_skills": [
      "Tableau & Power BI",
      "Looker Studio",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)",
      "Google Cloud Platform (GCP)",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_015_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Fitri Wijaya",
    "email": "fitri.wijaya@gmail.com",
    "phone": "08242219",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Ilmu Hukum",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Copywriting",
      "Servis Hardware",
      "Photoshop"
    ],
    "job_descs": [
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_016_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rizky Saputra",
    "email": "rizky.saputra@gmail.com",
    "phone": "08784126",
    "city": "Bandung",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN STATISTIKA",
    "degree": "D3",
    "major": "Statistika",
    "exp_years": 1,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "Tableau & Power BI",
      "Data Modeling & Dataform",
      "Copywriting",
      "Photoshop"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_017_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Rizky Wijaya",
    "email": "rizky.wijaya@gmail.com",
    "phone": "08397928",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 2,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning",
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_018_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Eko Saputra",
    "email": "eko.saputra@gmail.com",
    "phone": "08956381",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "Data Entry Manual",
      "Copywriting",
      "Servis Hardware"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_019_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Rizky Wijaya",
    "email": "rizky.wijaya@gmail.com",
    "phone": "08765900",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Ilmu Hukum",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Servis Hardware",
      "Data Entry Manual",
      "Photoshop"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_020_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Siti Utami",
    "email": "siti.utami@gmail.com",
    "phone": "08767063",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 2,
    "tech_skills": [
      "Data Modeling & Dataform",
      "ETL/ELT Data Pipelines",
      "Advanced Excel & Google Sheets",
      "Tableau & Power BI",
      "Looker Studio",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_021_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Maya Nugroho",
    "email": "maya.nugroho@gmail.com",
    "phone": "08788974",
    "city": "Bandung",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN ILMU KOMPUTER",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 0,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "Tableau & Power BI",
      "ETL/ELT Data Pipelines",
      "Photoshop",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_022_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Budi Saputra",
    "email": "budi.saputra@gmail.com",
    "phone": "08223778",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 5,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Looker Studio",
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "Statistik & Machine Learning",
      "Data Modeling & Dataform"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_023_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Fitri Wijaya",
    "email": "fitri.wijaya@gmail.com",
    "phone": "08589587",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN STATISTIKA",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 0,
    "tech_skills": [
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)",
      "Google Cloud Platform (GCP)",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_024_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Rizky Utami",
    "email": "rizky.utami@gmail.com",
    "phone": "08248999",
    "city": "Bandung",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Seni Rupa",
    "exp_years": 0,
    "tech_skills": [
      "Servis Hardware",
      "Photoshop",
      "Data Entry Manual",
      "Copywriting"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_025_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Rizky Hidayat",
    "email": "rizky.hidayat@gmail.com",
    "phone": "08727507",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 3,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Looker Studio"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_026_High.pdf"
  },
  {
    "tier": "High",
    "name": "Rian Nugroho",
    "email": "rian.nugroho@gmail.com",
    "phone": "08248812",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Sistem Informasi",
    "exp_years": 2,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Tableau & Power BI",
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_027_High.pdf"
  },
  {
    "tier": "High",
    "name": "Dewi Santoso",
    "email": "dewi.santoso@gmail.com",
    "phone": "08166122",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Sistem Informasi",
    "exp_years": 4,
    "tech_skills": [
      "Statistik & Machine Learning",
      "Looker Studio",
      "Advanced Excel & Google Sheets",
      "Google Cloud Platform (GCP)",
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_028_High.pdf"
  },
  {
    "tier": "High",
    "name": "Maya Nugroho",
    "email": "maya.nugroho@gmail.com",
    "phone": "08896531",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 4,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Advanced Excel & Google Sheets",
      "Statistik & Machine Learning",
      "Python (Pandas, NumPy)",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_029_High.pdf"
  },
  {
    "tier": "High",
    "name": "Agus Nugroho",
    "email": "agus.nugroho@gmail.com",
    "phone": "08259294",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 2,
    "tech_skills": [
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)",
      "Python (Pandas, NumPy)",
      "Tableau & Power BI",
      "Statistik & Machine Learning",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_030_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Hidayat",
    "email": "budi.hidayat@gmail.com",
    "phone": "08368230",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN ILMU KOMPUTER",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 1,
    "tech_skills": [
      "Tableau & Power BI",
      "Advanced Excel & Google Sheets",
      "Statistik & Machine Learning",
      "Servis Hardware",
      "Copywriting"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_031_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Maya Kusuma",
    "email": "maya.kusuma@gmail.com",
    "phone": "08864847",
    "city": "Yogyakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Photoshop",
      "Copywriting",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_032_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Eko Kusuma",
    "email": "eko.kusuma@gmail.com",
    "phone": "08888900",
    "city": "Bandung",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 4,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Looker Studio",
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Google Cloud Platform (GCP)",
      "Tableau & Power BI"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_033_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Siti Lestari",
    "email": "siti.lestari@gmail.com",
    "phone": "08735413",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MANAJEMEN HOTEL",
    "degree": "S1",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform",
      "Photoshop",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_034_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Kusuma",
    "email": "anisa.kusuma@gmail.com",
    "phone": "08723630",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Teknik Informatika",
    "exp_years": 5,
    "tech_skills": [
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Looker Studio",
      "Tableau & Power BI"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_035_High.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Lestari",
    "email": "anisa.lestari@gmail.com",
    "phone": "08279987",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 3,
    "tech_skills": [
      "Looker Studio",
      "Data Modeling & Dataform",
      "Advanced Excel & Google Sheets",
      "SQL (BigQuery, PostgreSQL)",
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_036_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Fitri Wijaya",
    "email": "fitri.wijaya@gmail.com",
    "phone": "08968752",
    "city": "Yogyakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Data Entry Manual",
      "SEO & Marketing",
      "Adobe Illustrator",
      "Copywriting"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_037_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Siti Wijaya",
    "email": "siti.wijaya@gmail.com",
    "phone": "08931443",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 5,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_038_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Agus Wijaya",
    "email": "agus.wijaya@gmail.com",
    "phone": "08995048",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 1,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "Copywriting",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_039_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Eko Lestari",
    "email": "eko.lestari@gmail.com",
    "phone": "08248348",
    "city": "Semarang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN STATISTIKA",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 0,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Tableau & Power BI",
      "Data Modeling & Dataform",
      "Adobe Illustrator",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_040_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Rizky Hidayat",
    "email": "rizky.hidayat@gmail.com",
    "phone": "08329578",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Data Entry Manual",
      "Adobe Illustrator",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_041_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Anisa Lestari",
    "email": "anisa.lestari@gmail.com",
    "phone": "08284533",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Copywriting",
      "Photoshop",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_042_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Dewi Utami",
    "email": "dewi.utami@gmail.com",
    "phone": "08771014",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Statistika",
    "exp_years": 3,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Tableau & Power BI",
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_043_High.pdf"
  },
  {
    "tier": "High",
    "name": "Agus Kusuma",
    "email": "agus.kusuma@gmail.com",
    "phone": "08996977",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 4,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Looker Studio"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_044_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Eko Hidayat",
    "email": "eko.hidayat@gmail.com",
    "phone": "08544798",
    "city": "Surabaya",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Servis Hardware",
      "Adobe Illustrator",
      "SEO & Marketing",
      "Copywriting"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_045_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Anisa Nugroho",
    "email": "anisa.nugroho@gmail.com",
    "phone": "08909261",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Ilmu Hukum",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Servis Hardware",
      "Copywriting",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_046_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rizky Saputra",
    "email": "rizky.saputra@gmail.com",
    "phone": "08589016",
    "city": "Bandung",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "S1",
    "major": "Sastra Inggris",
    "exp_years": 1,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning",
      "Data Modeling & Dataform",
      "Photoshop",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_047_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Agus Utami",
    "email": "agus.utami@gmail.com",
    "phone": "08907326",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MANAJEMEN HOTEL",
    "degree": "D3",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Python (Pandas, NumPy)",
      "Tableau & Power BI",
      "Data Entry Manual",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_048_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Siti Nugroho",
    "email": "siti.nugroho@gmail.com",
    "phone": "08443202",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN TEKNIK INFORMATIKA",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 1,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets",
      "Photoshop",
      "Servis Hardware"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_049_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Budi Santoso",
    "email": "budi.santoso@gmail.com",
    "phone": "08837624",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 3,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Tableau & Power BI",
      "Statistik & Machine Learning",
      "Looker Studio",
      "Advanced Excel & Google Sheets",
      "SQL (BigQuery, PostgreSQL)"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_050_High.pdf"
  },
  {
    "tier": "High",
    "name": "Rian Nugroho",
    "email": "rian.nugroho@gmail.com",
    "phone": "08121604",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Ilmu Komputer",
    "exp_years": 5,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_051_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Maya Wijaya",
    "email": "maya.wijaya@gmail.com",
    "phone": "08967759",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Data Entry Manual",
      "Photoshop",
      "Copywriting",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_052_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Santoso",
    "email": "budi.santoso@gmail.com",
    "phone": "08316193",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 1,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Tableau & Power BI",
      "Python (Pandas, NumPy)",
      "Copywriting",
      "Photoshop"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_053_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Dewi Wijaya",
    "email": "dewi.wijaya@gmail.com",
    "phone": "08885981",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 4,
    "tech_skills": [
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform",
      "Python (Pandas, NumPy)",
      "Looker Studio",
      "Tableau & Power BI",
      "SQL (BigQuery, PostgreSQL)"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_054_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Rizky Santoso",
    "email": "rizky.santoso@gmail.com",
    "phone": "08203184",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Copywriting",
      "Photoshop",
      "Data Entry Manual",
      "Servis Hardware"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_055_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Agus Utami",
    "email": "agus.utami@gmail.com",
    "phone": "08837594",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Matematika",
    "exp_years": 4,
    "tech_skills": [
      "Statistik & Machine Learning",
      "Tableau & Power BI",
      "Google Cloud Platform (GCP)",
      "ETL/ELT Data Pipelines",
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_056_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Siti Wijaya",
    "email": "siti.wijaya@gmail.com",
    "phone": "08686652",
    "city": "Yogyakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN STATISTIKA",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 0,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Data Entry Manual",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_057_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rian Nugroho",
    "email": "rian.nugroho@gmail.com",
    "phone": "08384710",
    "city": "Semarang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "D3",
    "major": "Matematika",
    "exp_years": 0,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Looker Studio",
      "Photoshop",
      "SEO & Marketing"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_058_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Anisa Lestari",
    "email": "anisa.lestari@gmail.com",
    "phone": "08624308",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "SEO & Marketing",
      "Adobe Illustrator",
      "Servis Hardware",
      "Copywriting"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_059_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Eko Santoso",
    "email": "eko.santoso@gmail.com",
    "phone": "08973833",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 1,
    "tech_skills": [
      "Tableau & Power BI",
      "Python (Pandas, NumPy)",
      "SQL (BigQuery, PostgreSQL)",
      "Servis Hardware",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_060_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Fitri Utami",
    "email": "fitri.utami@gmail.com",
    "phone": "08397787",
    "city": "Semarang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "D3",
    "major": "Matematika",
    "exp_years": 1,
    "tech_skills": [
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets",
      "Adobe Illustrator",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_061_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Eko Wijaya",
    "email": "eko.wijaya@gmail.com",
    "phone": "08853816",
    "city": "Bandung",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 5,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "SQL (BigQuery, PostgreSQL)",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)",
      "Looker Studio",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ]
    ],
    "file_path": "output_cvs/CV_062_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Fitri Saputra",
    "email": "fitri.saputra@gmail.com",
    "phone": "08353285",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 0,
    "tech_skills": [
      "Looker Studio",
      "Google Cloud Platform (GCP)",
      "Advanced Excel & Google Sheets",
      "Data Entry Manual",
      "Photoshop"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_063_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Rian Utami",
    "email": "rian.utami@gmail.com",
    "phone": "08111673",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "3+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Statistika",
    "exp_years": 3,
    "tech_skills": [
      "Google Cloud Platform (GCP)",
      "Python (Pandas, NumPy)",
      "SQL (BigQuery, PostgreSQL)",
      "Data Modeling & Dataform",
      "Looker Studio",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Lead Scraper & CRM Integration",
        "Mengembangkan web scraper otomatis berbasis Maps API dan Apps Script untuk menangkap leads penjualan."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_064_High.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Hidayat",
    "email": "anisa.hidayat@gmail.com",
    "phone": "08278118",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 2,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)",
      "ETL/ELT Data Pipelines",
      "Python (Pandas, NumPy)",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_065_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Anisa Saputra",
    "email": "anisa.saputra@gmail.com",
    "phone": "08163216",
    "city": "Yogyakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MATEMATIKA",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 1,
    "tech_skills": [
      "Statistik & Machine Learning",
      "Looker Studio",
      "ETL/ELT Data Pipelines",
      "Servis Hardware",
      "Copywriting"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_066_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Dewi Lestari",
    "email": "dewi.lestari@gmail.com",
    "phone": "08377482",
    "city": "Tangerang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "Data Entry Manual",
      "SEO & Marketing",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_067_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Rian Santoso",
    "email": "rian.santoso@gmail.com",
    "phone": "08975016",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Sistem Informasi",
    "exp_years": 5,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)",
      "Statistik & Machine Learning",
      "ETL/ELT Data Pipelines",
      "Advanced Excel & Google Sheets"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_068_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Agus Hidayat",
    "email": "agus.hidayat@gmail.com",
    "phone": "08917522",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Copywriting",
      "Data Entry Manual",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_069_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Agus Santoso",
    "email": "agus.santoso@gmail.com",
    "phone": "08307101",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Adobe Illustrator",
      "Servis Hardware",
      "Copywriting",
      "Photoshop"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_070_Low.pdf"
  },
  {
    "tier": "High",
    "name": "Fitri Nugroho",
    "email": "fitri.nugroho@gmail.com",
    "phone": "08733926",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Matematika",
    "exp_years": 2,
    "tech_skills": [
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "Tableau & Power BI"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_071_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Rian Santoso",
    "email": "rian.santoso@gmail.com",
    "phone": "08801718",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "SEO & Marketing",
      "Servis Hardware",
      "Photoshop",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_072_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rizky Saputra",
    "email": "rizky.saputra@gmail.com",
    "phone": "08984830",
    "city": "Semarang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN STATISTIKA",
    "degree": "D3",
    "major": "Statistika",
    "exp_years": 1,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Copywriting",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_073_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Dewi Santoso",
    "email": "dewi.santoso@gmail.com",
    "phone": "08427344",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "Adobe Illustrator",
      "SEO & Marketing",
      "Copywriting"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Maintenance Jaringan Kantor",
        "Melakukan perbaikan kabel LAN dan instalasi ulang sistem operasi PC staf."
      ]
    ],
    "file_path": "output_cvs/CV_074_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Anisa Lestari",
    "email": "anisa.lestari@gmail.com",
    "phone": "08498592",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 1,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Statistik & Machine Learning",
      "Photoshop",
      "Data Entry Manual"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_075_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Utami",
    "email": "budi.utami@gmail.com",
    "phone": "08702969",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "D3",
    "major": "Sistem Informasi",
    "exp_years": 1,
    "tech_skills": [
      "Tableau & Power BI",
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "Data Entry Manual",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_076_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Budi Kusuma",
    "email": "budi.kusuma@gmail.com",
    "phone": "08806078",
    "city": "Yogyakarta",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Statistika",
    "exp_years": 5,
    "tech_skills": [
      "Looker Studio",
      "SQL (BigQuery, PostgreSQL)",
      "Data Modeling & Dataform",
      "Python (Pandas, NumPy)",
      "ETL/ELT Data Pipelines",
      "Google Cloud Platform (GCP)"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_077_High.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Saputra",
    "email": "anisa.saputra@gmail.com",
    "phone": "08773608",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Matematika",
    "exp_years": 2,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "Tableau & Power BI",
      "SQL (BigQuery, PostgreSQL)",
      "Python (Pandas, NumPy)"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_078_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Eko Santoso",
    "email": "eko.santoso@gmail.com",
    "phone": "08444554",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 0,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "SQL (BigQuery, PostgreSQL)",
      "Data Entry Manual",
      "Copywriting"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_079_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Nugroho",
    "email": "anisa.nugroho@gmail.com",
    "phone": "08327703",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 5,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Advanced Excel & Google Sheets",
      "SQL (BigQuery, PostgreSQL)",
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_080_High.pdf"
  },
  {
    "tier": "Low",
    "name": "Maya Lestari",
    "email": "maya.lestari@gmail.com",
    "phone": "08421039",
    "city": "Semarang",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "SMA/SMK",
    "major": "Seni Rupa",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "SEO & Marketing",
      "Data Entry Manual",
      "Adobe Illustrator"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_081_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Santoso",
    "email": "budi.santoso@gmail.com",
    "phone": "08924393",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN TEKNIK INFORMATIKA",
    "degree": "D3",
    "major": "Teknik Informatika",
    "exp_years": 0,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "ETL/ELT Data Pipelines",
      "Data Modeling & Dataform",
      "Servis Hardware",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_082_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Dewi Santoso",
    "email": "dewi.santoso@gmail.com",
    "phone": "08339301",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Teknik Informatika",
    "exp_years": 2,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_083_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Siti Nugroho",
    "email": "siti.nugroho@gmail.com",
    "phone": "08414710",
    "city": "Jakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 0,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "ETL/ELT Data Pipelines",
      "Tableau & Power BI",
      "SEO & Marketing",
      "Copywriting"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_084_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Saputra",
    "email": "budi.saputra@gmail.com",
    "phone": "08179299",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SISTEM INFORMASI",
    "degree": "D3",
    "major": "Sistem Informasi",
    "exp_years": 0,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Tableau & Power BI",
      "Advanced Excel & Google Sheets",
      "SEO & Marketing",
      "Servis Hardware"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_085_Medium.pdf"
  },
  {
    "tier": "Low",
    "name": "Anisa Utami",
    "email": "anisa.utami@gmail.com",
    "phone": "08774803",
    "city": "Jakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Pertanian",
    "exp_years": 0,
    "tech_skills": [
      "Photoshop",
      "Data Entry Manual",
      "Copywriting",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Redesain Banner Media Sosial",
        "Membuat template desain promosi harian menggunakan Adobe Photoshop."
      ]
    ],
    "file_path": "output_cvs/CV_086_Low.pdf"
  },
  {
    "tier": "Low",
    "name": "Budi Santoso",
    "email": "budi.santoso@gmail.com",
    "phone": "08516161",
    "city": "Yogyakarta",
    "target_job": "ADMINISTRATIVE STAFF",
    "headline": "MOTIVATED INDIVIDUAL LOOKING FOR ENTRY LEVEL OPPORTUNITIES",
    "degree": "D3",
    "major": "Ilmu Hukum",
    "exp_years": 0,
    "tech_skills": [
      "Copywriting",
      "Servis Hardware",
      "Data Entry Manual",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Sertifikat Seminar Nasional"
    ],
    "projects": [
      [
        "Pencatatan Administrasi Kasir",
        "Mengelola rekapitulasi data penjualan harian toko secara manual di MS Excel."
      ]
    ],
    "file_path": "output_cvs/CV_087_Low.pdf"
  },
  {
    "tier": "Medium",
    "name": "Dewi Kusuma",
    "email": "dewi.kusuma@gmail.com",
    "phone": "08265468",
    "city": "Bandung",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "S1",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Looker Studio",
      "Statistik & Machine Learning",
      "Adobe Illustrator",
      "Copywriting"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_088_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Maya Lestari",
    "email": "maya.lestari@gmail.com",
    "phone": "08837605",
    "city": "Surabaya",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Ilmu Komputer",
    "exp_years": 4,
    "tech_skills": [
      "Google Cloud Platform (GCP)",
      "Tableau & Power BI",
      "Advanced Excel & Google Sheets",
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "Python (Pandas, NumPy)"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_089_High.pdf"
  },
  {
    "tier": "High",
    "name": "Agus Saputra",
    "email": "agus.saputra@gmail.com",
    "phone": "08373507",
    "city": "Tangerang",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Teknik Informatika",
    "exp_years": 4,
    "tech_skills": [
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "Looker Studio",
      "Advanced Excel & Google Sheets",
      "Python (Pandas, NumPy)",
      "Data Modeling & Dataform"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_090_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rian Utami",
    "email": "rian.utami@gmail.com",
    "phone": "08497808",
    "city": "Yogyakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN MANAJEMEN HOTEL",
    "degree": "S1",
    "major": "Manajemen Hotel",
    "exp_years": 0,
    "tech_skills": [
      "Looker Studio",
      "ETL/ELT Data Pipelines",
      "Python (Pandas, NumPy)",
      "Data Entry Manual",
      "SEO & Marketing"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ],
      [
        "E-Commerce Sales Performance Dashboard",
        "Membuat laporan analisis penjualan bulanan dan visualisasi tren pelanggan menggunakan Tableau."
      ]
    ],
    "file_path": "output_cvs/CV_091_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rizky Santoso",
    "email": "rizky.santoso@gmail.com",
    "phone": "08809246",
    "city": "Yogyakarta",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN ILMU KOMPUTER",
    "degree": "S1",
    "major": "Ilmu Komputer",
    "exp_years": 0,
    "tech_skills": [
      "Data Modeling & Dataform",
      "Google Cloud Platform (GCP)",
      "ETL/ELT Data Pipelines",
      "Data Entry Manual",
      "Copywriting"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_092_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Rizky Hidayat",
    "email": "rizky.hidayat@gmail.com",
    "phone": "08201043",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "S1",
    "major": "Sastra Inggris",
    "exp_years": 1,
    "tech_skills": [
      "Tableau & Power BI",
      "Google Cloud Platform (GCP)",
      "Statistik & Machine Learning",
      "Photoshop",
      "Data Entry Manual"
    ],
    "job_descs": [
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ],
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ]
    ],
    "file_path": "output_cvs/CV_093_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Maya Utami",
    "email": "maya.utami@gmail.com",
    "phone": "08853251",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Matematika",
    "exp_years": 2,
    "tech_skills": [
      "SQL (BigQuery, PostgreSQL)",
      "Google Cloud Platform (GCP)",
      "Data Modeling & Dataform",
      "ETL/ELT Data Pipelines",
      "Python (Pandas, NumPy)",
      "Statistik & Machine Learning"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ]
    ],
    "file_path": "output_cvs/CV_094_High.pdf"
  },
  {
    "tier": "Medium",
    "name": "Budi Hidayat",
    "email": "budi.hidayat@gmail.com",
    "phone": "08875716",
    "city": "Tangerang",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "S1",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "Advanced Excel & Google Sheets",
      "Data Modeling & Dataform",
      "Python (Pandas, NumPy)",
      "Copywriting",
      "Servis Hardware"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Memperbaiki jaringan kabel LAN, printer, serta maintenance PC kantor.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_095_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Maya Nugroho",
    "email": "maya.nugroho@gmail.com",
    "phone": "08371059",
    "city": "Bandung",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 1,
    "tech_skills": [
      "Looker Studio",
      "Statistik & Machine Learning",
      "Google Cloud Platform (GCP)",
      "Photoshop",
      "Copywriting"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Operational Inventory Tracker",
        "Membuat skrip Google Apps Script untuk otomatisasi pencatatan stok barang di gudang."
      ]
    ],
    "file_path": "output_cvs/CV_096_Medium.pdf"
  },
  {
    "tier": "Medium",
    "name": "Siti Saputra",
    "email": "siti.saputra@gmail.com",
    "phone": "08295347",
    "city": "Surabaya",
    "target_job": "JUNIOR DATA ANALYST",
    "headline": "DATA ANALYTICS ENTHUSIAST | GRADUATE IN SASTRA INGGRIS",
    "degree": "D3",
    "major": "Sastra Inggris",
    "exp_years": 0,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Statistik & Machine Learning",
      "Advanced Excel & Google Sheets",
      "Photoshop",
      "Copywriting"
    ],
    "job_descs": [
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Membuat konten media sosial harian dan mengelola interaksi pengikut.",
      "Melayani pelanggan secara langsung di toko dan mengelola operasional kasir harian."
    ],
    "certifications": [
      "Basic Excel Certification"
    ],
    "projects": [
      [
        "Customer Feedback Sentiment Analysis",
        "Melakukan pembersihan data teks dan klasifikasi sederhana masukan pelanggan menggunakan Python."
      ],
      [
        "Academic Data Analysis & Reporting",
        "Melakukan analisis data eksploratif (EDA) dan visualisasi dasar menggunakan Google Sheets & Python."
      ]
    ],
    "file_path": "output_cvs/CV_097_Medium.pdf"
  },
  {
    "tier": "High",
    "name": "Eko Nugroho",
    "email": "eko.nugroho@gmail.com",
    "phone": "08772518",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "5+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Statistika",
    "exp_years": 5,
    "tech_skills": [
      "Statistik & Machine Learning",
      "Tableau & Power BI",
      "Python (Pandas, NumPy)",
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)",
      "ETL/ELT Data Pipelines"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage.",
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ],
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ]
    ],
    "file_path": "output_cvs/CV_098_High.pdf"
  },
  {
    "tier": "High",
    "name": "Anisa Kusuma",
    "email": "anisa.kusuma@gmail.com",
    "phone": "08286565",
    "city": "Jakarta",
    "target_job": "DATA ANALYST",
    "headline": "4+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S2",
    "major": "Ilmu Komputer",
    "exp_years": 4,
    "tech_skills": [
      "ETL/ELT Data Pipelines",
      "Advanced Excel & Google Sheets",
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)",
      "Tableau & Power BI",
      "Statistik & Machine Learning"
    ],
    "job_descs": [
      "Advanced Analytics: Mengembangkan model statistik & korelasi untuk memprediksi tren penjualan serta perilaku pelanggan.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "End-to-End Recruitment Automation System",
        "Mengembangkan parser CV dan model AI scoring kandidat menggunakan Python, Cloud Run, dan BigQuery."
      ],
      [
        "Conversational Analytics Dashboard",
        "Membangun dasbor BI interaktif menggunakan Looker Studio dan Python untuk mendukung analisis ad-hoc manajemen."
      ]
    ],
    "file_path": "output_cvs/CV_099_High.pdf"
  },
  {
    "tier": "High",
    "name": "Dewi Santoso",
    "email": "dewi.santoso@gmail.com",
    "phone": "08386942",
    "city": "Semarang",
    "target_job": "DATA ANALYST",
    "headline": "2+ YEARS COMBINED EXPERIENCE IN DATA, BI, & DIGITAL TRANSFORMATION",
    "degree": "S1",
    "major": "Sistem Informasi",
    "exp_years": 2,
    "tech_skills": [
      "Statistik & Machine Learning",
      "Data Modeling & Dataform",
      "SQL (BigQuery, PostgreSQL)",
      "Google Cloud Platform (GCP)",
      "ETL/ELT Data Pipelines",
      "Looker Studio"
    ],
    "job_descs": [
      "Business Intelligence: Membuat dasbor interaktif di Looker Studio & Power BI untuk pelaporan KPI eksekutif.",
      "End-to-End Data Pipeline: Merancang dan mengoptimalkan pipeline ETL/ELT otomatis dari berbagai sumber data ke BigQuery.",
      "Data Modeling & Governance: Menggunakan Dataform (SQLX) untuk pembersihan data, pengujian kualitas, dan data lineage."
    ],
    "certifications": [
      "BNSP Data Analyst Certified",
      "Google Cloud Data Engineer"
    ],
    "projects": [
      [
        "Automated Production & Inventory Optimization",
        "Membuat model dynamic safety stock, ROP, dan analisis ABC/RFM otomatis menggunakan SQLX dan Looker Studio."
      ],
      [
        "Enterprise Data Architecture & Pipeline",
        "Membangun data pipeline otomatis dari 50+ Google Sheets ke GCP BigQuery menggunakan Dataform & Cloud Scheduler."
      ]
    ],
    "file_path": "output_cvs/CV_100_High.pdf"
  }
]`;
  var candidates = JSON.parse(jsonString);
  
  // Map nama file ke URL Drive
  var fileMap = {};
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    fileMap[file.getName()] = file.getUrl();
  }
  
  var rows = [];
  var now = new Date();
  
  candidates.forEach(function(item) {
    var fileName = item.file_path.split('/').pop(); // Ambil nama file misal CV_001_High.pdf
    var fileUrl = fileMap[fileName] || "File Tidak Ditemukan";
    
    rows.push([
      now,                    // Timestamp
      item.name,              // Nama Lengkap
      "Data Analyst",         // Posisi
      "LinkedIn",             // Sumber Lowongan
      fileUrl,                // Link CV / Resume
      item.email              // Email Candidate
    ]);
  });
  
  // Tulis bulk ke sheet
  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
}