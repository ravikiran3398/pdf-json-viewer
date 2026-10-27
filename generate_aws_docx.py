import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, text, title="IMPORTANT NOTICE", border_color="2563EB", bg_color="EFF6FF"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    
    r_title = p.add_run(f"[{title}] ")
    r_title.bold = True
    r_title.font.size = Pt(10)
    r_title.font.name = "Arial"
    r_title.font.color.rgb = RGBColor.from_string(border_color)
    
    r_text = p.add_run(text)
    r_text.font.size = Pt(9.5)
    r_text.font.name = "Arial"
    r_text.font.color.rgb = RGBColor(30, 41, 59)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def add_code_block(doc, code_str):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    tbl.columns[0].width = Inches(6.5)
    
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>'
        f'<w:top w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>'
        f'<w:right w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>'
        f'<w:bottom w:val="single" w:sz="8" w:space="0" w:color="CBD5E1"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    run = p.add_run(code_str)
    run.font.name = "Consolas"
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(15, 23, 42)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def build_aws_docx():
    doc = docx.Document()
    
    # Page setup: Standard Letter with 0.8 in margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("AWS Cloud Production Hosting & Live Deployment Guide")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(22)
    run_title.bold = True
    run_title.font.color.rgb = RGBColor(30, 58, 138) # Navy Blue
    
    # Subtitle
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(16)
    run_sub = sub_p.add_run("DocuParse JSON — Enterprise PDF-to-JSON SaaS Platform (Node.js 20, PostgreSQL 16, Vite React SPA, Amazon S3, ECS/EC2, CloudFront)")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    add_callout(
        doc,
        "This document contains step-by-step instructions to take the PDF-to-JSON SaaS platform live on Amazon Web Services (AWS). It covers complete network topology, database provisioning, containerization, SSL certificates, custom domains, and zero-downtime CI/CD deployment.",
        title="EXECUTIVE OVERVIEW",
        border_color="059669",
        bg_color="ECFDF5"
    )
    
    # Helper for Headings
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(15)
        r.bold = True
        r.font.color.rgb = RGBColor(29, 78, 216)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_body(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix + ": ")
            r_pre.bold = True
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(9.5)
            r_pre.font.color.rgb = RGBColor(15, 23, 42)
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(51, 65, 85)
        return p

    # --- Section 1: Architecture ---
    add_h1("1. System Architecture Overview")
    add_body("The platform is engineered as a decoupled, cloud-native architecture optimized for sub-second static asset delivery, high-concurrency document processing, and zero-leakage security:")
    
    add_bullet("Vite + React 18 + Tailwind CSS single page application hosted in private Amazon S3, distributed globally via Amazon CloudFront CDN with TLS 1.3 edge termination.", "Frontend Layer")
    add_bullet("Node.js 20 Express TypeScript modular monolith running inside Docker containers on AWS ECS Fargate (or EC2) behind an Application Load Balancer.", "Backend API Layer")
    add_bullet("Amazon RDS PostgreSQL 16 managed database running in isolated private VPC subnets with Multi-AZ replication.", "Database Layer")
    add_bullet("Dedicated private Amazon S3 bucket with Server-Side Encryption (SSE-S3) for uploaded PDF documents and parsed JSON results.", "Object Storage Layer")
    add_bullet("Route 53 DNS with AWS Certificate Manager (ACM) providing auto-renewing 256-bit SSL certificates.", "DNS & Security")

    # --- Section 2: AWS Checklist Table ---
    add_h1("2. AWS Infrastructure Bill of Materials")
    
    headers = ["Service", "Resource Name", "Sizing / Tier", "Target Role"]
    rows = [
        ["Amazon VPC", "pdfjson-vpc", "2 Public + 2 Private Subnets", "Network isolation across 2 AZs"],
        ["Amazon RDS", "pdfjson-db-prod", "PostgreSQL 16 (db.t4g.micro/small)", "Core database, users, plans, jobs"],
        ["Amazon S3", "pdfjson-documents-prod", "Private Bucket + SSE-S3", "Uploaded PDFs & JSON output"],
        ["Amazon S3", "pdfjson-frontend-prod", "Private Bucket + OAC", "Static React bundle (HTML/JS/CSS)"],
        ["Amazon CloudFront", "Distribution", "Global Edge Cache + TLS 1.3", "Ultra-fast global SPA CDN"],
        ["AWS ECS / EC2", "pdfjson-backend-service", "Fargate 0.5 vCPU, 1 GB RAM", "Express API execution & worker"],
        ["Application LB", "pdfjson-alb", "Internet-facing (HTTPS:443)", "SSL termination & container balancing"],
        ["Route 53 & ACM", "Hosted Zone", "Wildcard SSL (*.yourdomain.com)", "Public DNS routing & HTTPS"],
    ]
    
    tbl = doc.add_table(rows=len(rows)+1, cols=4)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    col_widths = [Inches(1.4), Inches(1.8), Inches(1.8), Inches(1.5)]
    
    # Header row
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "1E3A8A")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=120, right=120)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(title)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row in enumerate(rows):
        cells = tbl.rows[r_idx+1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cells[c_idx].width = col_widths[c_idx]
            set_cell_background(cells[c_idx], bg_col)
            set_cell_margins(cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = cells[c_idx].paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Arial"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(30, 41, 59)
            if c_idx == 0:
                r.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- Section 3: VPC & Security Groups ---
    add_h1("3. Step 1: Network & Security Isolation (VPC)")
    add_body("Configure three tiered Security Groups to ensure absolute isolation:")
    add_bullet("sg-alb (Public Load Balancer): Allow inbound 80 (HTTP) and 443 (HTTPS) from 0.0.0.0/0.", "Load Balancer SG")
    add_bullet("sg-backend (Compute Tasks): Allow inbound TCP 5000 strictly from sg-alb. Disallow direct internet access.", "Backend SG")
    add_bullet("sg-rds (PostgreSQL Database): Allow inbound TCP 5432 strictly from sg-backend. Never expose database port to public.", "Database SG")

    # --- Section 4: Amazon RDS Setup ---
    add_h1("4. Step 2: Amazon RDS PostgreSQL 16 Setup & Migrations")
    add_body("1. Open the Amazon RDS console and click 'Create Database'.")
    add_body("2. Choose PostgreSQL 16.x. Select the 'Free tier' or 'Production' template.")
    add_body("3. DB Instance identifier: pdfjson-db-prod. Master username: postgres. Generate a 24+ character password.")
    add_body("4. Storage: 20 GB gp3 with Auto-scaling enabled up to 100 GB.")
    add_body("5. Connectivity: Place in private database subnets and attach security group 'sg-rds'. Set Public Access to 'No'.")
    add_body("6. Once the status transitions to 'Available', note your RDS Endpoint and execute database migrations:")
    
    add_code_block(
        doc,
        "# Set production database connection string\n"
        "export DATABASE_URL=\"postgresql://postgres:YOUR_PASSWORD@pdfjson-db-prod.c123.ap-south-1.rds.amazonaws.com:5432/pdfjson?schema=public&sslmode=require\"\n\n"
        "# Apply Prisma schema migrations to create all tables & indexes\n"
        "npx prisma migrate deploy\n\n"
        "# Seed clean database state (creates plans, Super Admin and initial accounts)\n"
        "npx tsx prisma/clean_db.ts"
    )

    add_callout(
        doc,
        "Default Seed Credentials created by clean_db.ts:\n"
        "• Super Administrator: ravikiran.mec666@gmail.com  |  Password: Admin@12345 (Log in at /admin/login)\n"
        "• Standard User: user@pdfjson.com  |  Password: User@12345 (Log in at /login)",
        title="DEFAULT SEED CREDENTIALS",
        border_color="7C3AED",
        bg_color="FAF5FF"
    )

    # --- Section 5: S3 Document Storage ---
    add_h1("5. Step 3: Amazon S3 Bucket for Document Storage")
    add_body("1. Create a private bucket: pdfjson-documents-prod-[your-account-id].")
    add_body("2. Check 'Block all public access' (the backend streams or presigns document URLs).")
    add_body("3. Enable Server-side encryption (SSE-S3).")
    add_body("4. Add CORS Configuration in the S3 Permissions tab to support secure upload & preview:")

    add_code_block(
        doc,
        "[\n"
        "  {\n"
        "    \"AllowedHeaders\": [\"*\"],\n"
        "    \"AllowedMethods\": [\"GET\", \"PUT\", \"POST\", \"HEAD\"],\n"
        "    \"AllowedOrigins\": [\"https://yourdomain.com\", \"https://app.yourdomain.com\"],\n"
        "    \"ExposeHeaders\": [\"ETag\", \"Content-Length\", \"Content-Type\"],\n"
        "    \"MaxAgeSeconds\": 3600\n"
        "  }\n"
        "]"
    )

    # --- Section 6: Backend Deployment ---
    add_h1("6. Step 4: Backend Container Deployment (ECS Fargate)")
    add_body("Use the pre-configured multi-stage Dockerfile in pdf-json-backend/Dockerfile:")
    
    add_code_block(
        doc,
        "# 1. Authenticate Docker with Amazon ECR\n"
        "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com\n\n"
        "# 2. Build backend container\n"
        "cd pdf-json-backend\n"
        "docker build -t pdf-json-backend:latest .\n\n"
        "# 3. Tag and push image\n"
        "docker tag pdf-json-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/pdf-json-backend:latest\n"
        "docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/pdf-json-backend:latest"
    )

    add_body("Configure an ECS Task Definition with 0.5 vCPU and 1 GB Memory, port 5000, and map environment variables from AWS Secrets Manager. Create an Application Load Balancer (ALB) with an HTTPS target group pointing to port 5000 with healthcheck endpoint at /health.")

    # --- Section 7: Frontend S3 + CloudFront ---
    add_h1("7. Step 5: Frontend Hosting (S3 + CloudFront CDN)")
    add_body("1. Build the production React Vite application:")
    
    add_code_block(
        doc,
        "cd pdf-json-frontend\n"
        "export VITE_API_URL=\"https://api.yourdomain.com/api\"\n"
        "npm ci\n"
        "npm run build\n\n"
        "# Synchronize bundle to frontend S3 bucket\n"
        "aws s3 sync dist/ s3://pdfjson-frontend-prod-[account-id] --delete"
    )

    add_body("2. Create a CloudFront Distribution with Origin Access Control (OAC). Set Default Root Object to index.html.")

    add_callout(
        doc,
        "CRITICAL REACT SPA STEP: In the CloudFront 'Error pages' tab, create two Custom Error Responses:\n"
        "1. Error Code: 403: Forbidden -> Customize: Yes -> Response Path: /index.html -> HTTP Code: 200: OK\n"
        "2. Error Code: 404: Not Found -> Customize: Yes -> Response Path: /index.html -> HTTP Code: 200: OK\n"
        "Without this, refreshing pages like /app/documents or /admin/login will display an S3 404 AccessDenied error.",
        title="CRITICAL: CLIENT-SIDE ROUTING CONFIGURATION",
        border_color="DC2626",
        bg_color="FEF2F2"
    )

    # --- Section 8: Route 53 & SSL ---
    add_h1("8. Step 6: Route 53 Custom Domains & SSL/TLS")
    add_body("1. Open AWS Certificate Manager (ACM) in us-east-1 (N. Virginia, required for CloudFront).")
    add_body("2. Request a public wildcard certificate for yourdomain.com and *.yourdomain.com with DNS validation.")
    add_body("3. In Route 53 Hosted Zone, add Alias A records:")
    add_bullet("Alias to CloudFront Distribution (yourdomain.com and app.yourdomain.com).", "Frontend Apex & App")
    add_bullet("Alias to Application Load Balancer (api.yourdomain.com).", "Backend API")

    # --- Section 9: Production Environment Variables ---
    add_h1("9. Step 7: Production Environment Variables Reference")
    
    env_vars = [
        ["NODE_ENV", "production", "Enables optimized production mode"],
        ["PORT", "5000", "Internal listening port for Express API"],
        ["DATABASE_URL", "postgresql://...@rds.amazonaws.com:5432/pdfjson?sslmode=require", "PostgreSQL connection string with SSL"],
        ["JWT_SECRET", "openssl rand -hex 32", "32+ character random secret for auth tokens"],
        ["FRONTEND_URL", "https://yourdomain.com", "Allowed origin for CORS and security checks"],
        ["STORAGE_DRIVER", "s3", "Switches file storage from local disk to S3"],
        ["S3_BUCKET_NAME", "pdfjson-documents-prod", "Dedicated S3 bucket for PDF/JSON storage"],
        ["AWS_REGION", "ap-south-1", "AWS region hosting the infrastructure"],
        ["RAZORPAY_KEY_ID", "rzp_live_...", "Live Razorpay API Key ID"],
        ["RAZORPAY_KEY_SECRET", "...", "Live Razorpay API Key Secret"],
    ]
    
    tbl_env = doc.add_table(rows=len(env_vars)+1, cols=3)
    tbl_env.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_env.autofit = False
    col_w_env = [Inches(1.8), Inches(2.7), Inches(2.0)]
    
    hdr_env = tbl_env.rows[0].cells
    for i, t in enumerate(["Variable", "Production Value", "Description"]):
        hdr_env[i].width = col_w_env[i]
        set_cell_background(hdr_env[i], "1E3A8A")
        set_cell_margins(hdr_env[i], top=90, bottom=90, left=100, right=100)
        p = hdr_env[i].paragraphs[0]
        r = p.add_run(t)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    for r_idx, row in enumerate(env_vars):
        cells = tbl_env.rows[r_idx+1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            cells[c_idx].width = col_w_env[c_idx]
            set_cell_background(cells[c_idx], bg_col)
            set_cell_margins(cells[c_idx], top=70, bottom=70, left=100, right=100)
            p = cells[c_idx].paragraphs[0]
            r = p.add_run(val)
            r.font.name = "Consolas" if c_idx == 0 else "Arial"
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(15, 23, 42) if c_idx == 0 else RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- Section 10: Verification Checklist ---
    add_h1("10. Go-Live Verification Checklist")
    add_bullet("Verify /health returns HTTP 200 with status: ok.", "Backend Health Check")
    add_bullet("Verify https://yourdomain.com loads instantly with A+ SSL rating on SSLLabs.", "Frontend CDN & SSL")
    add_bullet("Verify standard user registration at /register and login at /login.", "User Portal")
    add_bullet("Verify Super Admin login at /admin/login with ravikiran.mec666@gmail.com.", "Admin Portal")
    add_bullet("Verify portal segregation: Admin accounts rejected on /login, user accounts rejected on /admin/login.", "Role Segregation")
    add_bullet("Test PDF upload at /app/upload: ensure document lands in S3 and parsed JSON is viewable.", "S3 & Extraction Pipeline")
    add_bullet("Test Razorpay checkout on /pricing: verify payment triggers subscription update in RDS.", "Payment Gateway")

    output_path = "AWS_Hosting_Guide_Production.docx"
    doc.save(output_path)
    print(f"Successfully generated Word document: {output_path}")

if __name__ == "__main__":
    build_aws_docx()
