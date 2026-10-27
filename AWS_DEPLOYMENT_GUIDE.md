# Production AWS Deployment Guide
## PDF-to-JSON SaaS Platform

This guide provides a comprehensive, production-grade roadmap for deploying the **PDF-to-JSON SaaS Platform** to **Amazon Web Services (AWS)**. It covers infrastructure provisioning, database setup, object storage, containerization, SSL certificates, custom domains, and automated CI/CD.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & AWS Account Setup](#2-prerequisites--aws-account-setup)
3. [Infrastructure Provisioning Checklist](#3-infrastructure-provisioning-checklist)
4. [Step 1: Network & Security Groups (VPC)](#step-1-network--security-groups-vpc)
5. [Step 2: Amazon RDS PostgreSQL 16 Setup & Prisma Migration](#step-2-amazon-rds-postgresql-16-setup--prisma-migration)
6. [Step 3: Amazon S3 Bucket for Document Storage](#step-3-amazon-s3-bucket-for-document-storage)
7. [Step 4: Backend Deployment (Two Options: ECS Fargate vs. EC2 Docker)](#step-4-backend-deployment)
   - [Option A: AWS ECS Fargate (Containerized Serverless)](#option-a-aws-ecs-fargate-recommended-for-scalability)
   - [Option B: AWS EC2 with Docker Compose (Cost-Effective / Simpler)](#option-b-aws-ec2-with-docker-compose)
8. [Step 5: Frontend Deployment (S3 + CloudFront CDN)](#step-5-frontend-deployment-s3--cloudfront-cdn)
9. [Step 6: Route 53 DNS & ACM SSL/TLS Certificates](#step-6-route-53-dns--acm-ssltls-certificates)
10. [Step 7: Production Environment Variables Checklist](#step-7-production-environment-variables-checklist)
11. [Step 8: GitHub Actions CI/CD Pipeline](#step-8-github-actions-cicd-pipeline)
12. [Step 9: Backups, Logging, & Production Hardening](#step-9-backups-logging--production-hardening)
13. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## 1. Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │        AWS Route 53 (DNS)              │
                      │   app.yourdomain.com / api.yourdomain  │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴────────────────────────┐
                 ▼                                                ▼
     ┌───────────────────────┐                        ┌───────────────────────┐
     │  Amazon CloudFront    │                        │  Application Load     │
     │  (Global Edge CDN)    │                        │  Balancer (ALB / SSL) │
     └───────────┬───────────┘                        └───────────┬───────────┘
                 │ Origin: HTTPS                                  │ Forward: Port 5000
                 ▼                                                ▼
     ┌───────────────────────┐                        ┌───────────────────────┐
     │   Amazon S3           │                        │  AWS ECS Fargate      │
     │  (Frontend React SPA) │                        │  (or EC2 Docker)      │
     │   Static Assets       │                        │  Node.js 20 Backend   │
     └───────────────────────┘                        └─────┬───────────┬─────┘
                                                            │           │
                                       Private VPC Link     │           │ IAM Role
                                       Port 5432            │           │ Read/Write
                                                            ▼           ▼
                                                ┌───────────────┐   ┌───────────────┐
                                                │  Amazon RDS   │   │  Amazon S3    │
                                                │  PostgreSQL 16│   │  (PDF & JSON  │
                                                │  (Multi-AZ)   │   │   Documents)  │
                                                └───────────────┘   └───────────────┘
```

### Components Summary
- **Frontend SPA**: Vite + React + Tailwind CSS compiled to static files (`dist/`), hosted in private S3 and served through Amazon CloudFront CDN with edge caching and TLS 1.3.
- **Backend API**: Node.js 20 Express TypeScript service running inside a container (ECS Fargate or EC2) behind an Application Load Balancer with SSL termination.
- **Relational Database**: Amazon RDS PostgreSQL 16 (in private VPC subnets) managed with Prisma ORM.
- **Document Storage**: Dedicated private Amazon S3 bucket for original user PDFs and converted JSON output files.
- **DNS & SSL**: Amazon Route 53 managing domain routing; AWS Certificate Manager (ACM) providing free auto-renewing SSL certificates.

---

## 2. Prerequisites & AWS Account Setup

Before starting, ensure you have:
1. An active **AWS Account** with administrative access.
2. **AWS CLI v2** installed and configured locally (`aws configure`).
3. **Docker** installed for building and pushing container images.
4. A registered domain name (e.g. via Route 53 or external registrar like GoDaddy / Namecheap).
5. OpenSSL or a secure random generator for production secrets (`openssl rand -hex 32`).

---

## 3. Infrastructure Provisioning Checklist

| Resource | Service | Specification | Purpose |
| :--- | :--- | :--- | :--- |
| **VPC** | Amazon VPC | 2 Public Subnets, 2 Private Subnets across 2 AZs | Network isolation |
| **Database** | Amazon RDS | PostgreSQL 16.x (`db.t4g.micro` or `db.t4g.small`) | Core application data |
| **Storage** | Amazon S3 | Private Bucket (e.g., `pdfjson-storage-prod`) | Uploaded PDFs & JSON output |
| **Frontend Bucket**| Amazon S3 | Private Bucket (e.g., `pdfjson-frontend-prod`) | React static assets |
| **CDN** | CloudFront | HTTPS redirect, OAC, Custom 404->200 error response | Fast global SPA delivery |
| **Backend Compute**| ECS Fargate or EC2 | 0.5 vCPU, 1 GB RAM (t4g.small for EC2) | Express API execution |
| **SSL/TLS** | ACM | Public Certificate for `*.yourdomain.com` | Free HTTPS everywhere |
| **DNS** | Route 53 | Public Hosted Zone | Routing domain names |

---

## Step 1: Network & Security Groups (VPC)

### 1.1 VPC Setup
Create or use the default VPC with at least two Availability Zones (e.g. `ap-south-1a` and `ap-south-1b`, or `us-east-1a` and `us-east-1b`).

### 1.2 Security Groups Configuration

1. **`sg-alb` (Application Load Balancer)**:
   - **Inbound Rules**:
     - Type: `HTTPS` (Port 443) | Source: `0.0.0.0/0` (Anywhere IPv4)
     - Type: `HTTP` (Port 80) | Source: `0.0.0.0/0` (Redirects to HTTPS)
   - **Outbound Rules**:
     - All traffic to `0.0.0.0/0`

2. **`sg-backend` (ECS Tasks or EC2 Backend)**:
   - **Inbound Rules**:
     - Type: `Custom TCP` (Port 5000) | Source: `sg-alb` (Only allow traffic from Load Balancer)
     - Type: `SSH` (Port 22, EC2 only) | Source: `Your MyIP`
   - **Outbound Rules**:
     - All traffic to `0.0.0.0/0` (Needs Internet via NAT Gateway or Internet Gateway to call S3 & Razorpay)

3. **`sg-rds` (PostgreSQL Database)**:
   - **Inbound Rules**:
     - Type: `PostgreSQL` (Port 5432) | Source: `sg-backend` (Strictly restricted to Backend only)
   - **Outbound Rules**: None required.

---

## Step 2: Amazon RDS PostgreSQL 16 Setup & Prisma Migration

### 2.1 Create RDS PostgreSQL Instance
Run via AWS Console or CLI:
1. Navigate to **RDS** -> **Databases** -> **Create Database**.
2. **Engine**: PostgreSQL 16.x.
3. **Template**: Free tier (for development/staging) or Production (Multi-AZ for high availability).
4. **DB Instance Identifier**: `pdfjson-db-prod`.
5. **Master Username**: `postgres`.
6. **Master Password**: Generate a secure 24+ character password.
7. **Instance Class**: `db.t4g.micro` (free tier eligible) or `db.t4g.small`.
8. **Storage**: 20 GiB gp3 (enable storage autoscaling up to 100 GiB).
9. **Connectivity**:
   - VPC: Select your application VPC.
   - Subnet Group: Private DB Subnet Group.
   - Public Access: **No** (Secure best practice).
   - VPC Security Group: Select `sg-rds`.
10. **Initial Database Name**: `pdfjson`.

### 2.2 Run Prisma Migrations and Seed Initial Data
Once the RDS instance is `Available`, retrieve its endpoint (e.g., `pdfjson-db-prod.c123456789.ap-south-1.rds.amazonaws.com`).

From a machine that has VPC access (e.g., your EC2 bastion, local machine connected via VPN, or an EC2 backend runner):

```bash
cd pdf-json-backend

# Set the production DATABASE_URL
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@pdfjson-db-prod.c123456789.ap-south-1.rds.amazonaws.com:5432/pdfjson?schema=public&sslmode=require"

# 1. Run Prisma migrations to create all tables, indexes, and relations
npx prisma migrate deploy

# 2. Seed clean database state (creates plans, Super Admin and initial accounts)
npx tsx prisma/clean_db.ts
```

> **Default Seed Credentials Created**:
> - **Super Admin**: `ravikiran.mec666@gmail.com` / `Admin@12345`
> - **Default User**: `user@pdfjson.com` / `User@12345`

---

## Step 3: Amazon S3 Bucket for Document Storage

### 3.1 Create S3 Storage Bucket
1. Go to **Amazon S3** -> **Create bucket**.
2. **Bucket Name**: e.g., `pdfjson-documents-prod-[your-account-id]`.
3. **AWS Region**: Select the same region as your compute (e.g., `ap-south-1` or `us-east-1`).
4. **Block Public Access**: **Check "Block all public access"** (Keep bucket strictly private; backend will stream files or generate presigned URLs).
5. **Bucket Versioning**: Enabled (recommended for document recovery).
6. **Encryption**: Server-side encryption with Amazon S3-managed keys (SSE-S3).

### 3.2 Configure S3 CORS Policy
In the bucket's **Permissions** tab, add this CORS policy to permit document previews and secure uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "https://app.yourdomain.com"
    ],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3.3 Create IAM Policy for Backend Access
Create an IAM Policy named `PdfJsonBackendS3Policy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDocumentBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::pdfjson-documents-prod-[your-account-id]",
        "arn:aws:s3:::pdfjson-documents-prod-[your-account-id]/*"
      ]
    }
  ]
}
```
Attach this policy to the ECS Task Role or EC2 Instance Profile.

---

## Step 4: Backend Deployment

You can choose between **Option A (AWS ECS Fargate)** or **Option B (AWS EC2 with Docker Compose)**.

---

### Option A: AWS ECS Fargate (Recommended for Scalability)

#### 4.1 Push Image to Amazon ECR (Elastic Container Registry)
```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name pdf-json-backend --region ap-south-1

# 2. Authenticate Docker with AWS ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# 3. Build container using the production Dockerfile
cd pdf-json-backend
docker build -t pdf-json-backend:latest .

# 4. Tag and push image
docker tag pdf-json-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/pdf-json-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/pdf-json-backend:latest
```

#### 4.2 Create ECS Task Definition
1. Open **Amazon ECS** -> **Task Definitions** -> **Create new Task Definition**.
2. **Launch Type**: AWS Fargate.
3. **OS/Architecture**: Linux/X86_64.
4. **Task Size**: 0.5 vCPU, 1 GB Memory.
5. **Task Execution Role**: `ecsTaskExecutionRole` (with access to pull from ECR and write logs to CloudWatch).
6. **Task Role**: Role attached to `PdfJsonBackendS3Policy` created in Step 3.
7. **Container Details**:
   - **Name**: `backend`
   - **Image URI**: `<ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/pdf-json-backend:latest`
   - **Port mappings**: Port `5000` / TCP.
   - **Environment Variables**: Add all variables from [Step 7](#step-7-production-environment-variables-checklist). Store secrets like `DATABASE_URL` and `JWT_SECRET` in **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**.
   - **Healthcheck**:
     - Command: `CMD-SHELL, curl -f http://localhost:5000/health || exit 1`
     - Interval: 30s | Timeout: 5s | Start period: 15s | Retries: 3

#### 4.3 Configure Application Load Balancer (ALB)
1. **ALB**: Internet-facing, in public subnets with `sg-alb`.
2. **Target Group**:
   - Target type: IP (Fargate).
   - Protocol: HTTP, Port: 5000.
   - Health check path: `/health`.
3. **Listener**:
   - HTTPS:443 -> Forward to Target Group (with ACM certificate).
   - HTTP:80 -> Redirect to HTTPS 443 (HTTP 301).

#### 4.4 Create ECS Service
- Launch type: Fargate.
- Tasks: Desired count 2 (for high availability across AZs).
- Networking: Private Subnets with `sg-backend`.
- Load Balancing: Select the ALB and Target Group created above.

---

### Option B: AWS EC2 with Docker Compose

If you prefer a simpler, lower-cost deployment on a single EC2 instance:

#### 4.1 Launch EC2 Instance
- **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type.
- **Instance Type**: `t4g.small` (ARM64) or `t3.small` (x86_64).
- **Security Group**: `sg-backend` (allowing HTTP 80/443 or Nginx proxy, plus port 5000).
- **Elastic IP**: Allocate and associate an Elastic IP with the instance.

#### 4.2 Setup Instance & Docker
Connect via SSH:
```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Update packages and install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git

# Allow ubuntu user to run docker
sudo usermod -aG docker ubuntu
newgrp docker
```

#### 4.3 Clone and Run via Docker Compose
```bash
git clone https://github.com/your-org/pdf-json-viewer.git /opt/pdf-json-viewer
cd /opt/pdf-json-viewer

# Create your production .env file
nano .env
```
Populate `.env` with:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_db_password
POSTGRES_DB=pdfjson
JWT_SECRET=your_32_char_random_jwt_secret
FRONTEND_URL=https://yourdomain.com
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=pdfjson-documents-prod
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
VITE_API_URL=https://api.yourdomain.com/api
```

Run the stack in the background:
```bash
# Build and start services
docker-compose up -d --build

# Run migrations on the containerized database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx tsx prisma/clean_db.ts
```

---

## Step 5: Frontend Deployment (S3 + CloudFront CDN)

Deploying the React Vite SPA to S3 + CloudFront gives lightning-fast static asset delivery globally at pennies per month.

### 5.1 Create Frontend S3 Bucket
1. Name: `pdfjson-frontend-prod-[account-id]`.
2. Region: `us-east-1` or `ap-south-1`.
3. Block Public Access: **Block all public access** (Access will be granted strictly to CloudFront using Origin Access Control).

### 5.2 Build Production Frontend Bundle
Locally or in CI/CD:
```bash
cd pdf-json-frontend

# Set production API URL pointing to your backend domain
export VITE_API_URL="https://api.yourdomain.com/api"

# Build production bundle
npm ci
npm run build
```
This generates the optimized bundle in `pdf-json-frontend/dist/`.

### 5.3 Upload to S3
```bash
aws s3 sync dist/ s3://pdfjson-frontend-prod-[account-id] --delete
```

### 5.4 Configure Amazon CloudFront Distribution
1. Navigate to **CloudFront** -> **Create Distribution**.
2. **Origin Domain**: Select the S3 bucket `pdfjson-frontend-prod-[account-id].s3.amazonaws.com`.
3. **Origin Access**: Choose **Origin Access Control (OAC)** -> Create control setting (sign requests).
4. **Viewer Protocol Policy**: **Redirect HTTP to HTTPS**.
5. **Allowed HTTP Methods**: `GET, HEAD, OPTIONS`.
6. **Cache Policy**: `CachingOptimized`.
7. **Custom SSL Certificate**: Select your ACM certificate for `yourdomain.com` / `*.yourdomain.com`.
8. **Alternate Domain Names (CNAMEs)**: `yourdomain.com`, `www.yourdomain.com` (or `app.yourdomain.com`).
9. **Default Root Object**: `index.html`.

#### CRITICAL: Configure React SPA Routing (Custom Error Responses)
React Router uses client-side routing (`/login`, `/app/documents`, `/admin/users`). When a user refreshes these pages, S3 returns 403 or 404 because the physical key doesn't exist on S3.

In your CloudFront Distribution:
1. Navigate to the **Error pages** tab.
2. Click **Create custom error response**:
   - **HTTP error code**: `403: Forbidden`
   - **Customize error response**: Yes
   - **Response page path**: `/index.html`
   - **HTTP response code**: `200: OK`
3. Click **Create custom error response** again:
   - **HTTP error code**: `404: Not Found`
   - **Customize error response**: Yes
   - **Response page path**: `/index.html`
   - **HTTP response code**: `200: OK`

### 5.5 Update S3 Bucket Policy for CloudFront OAC
Go to your frontend S3 bucket -> **Permissions** -> **Bucket Policy** and paste the policy generated by CloudFront:

```json
{
  "Version": "2012-10-17",
  "Statement": {
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": {
      "Service": "cloudfront.amazonaws.com"
    },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::pdfjson-frontend-prod-[account-id]/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
      }
    }
  }
}
```

---

## Step 6: Route 53 DNS & ACM SSL/TLS Certificates

### 6.1 Request Public SSL/TLS Certificate in ACM
> **Important**: CloudFront distributions require certificates requested in the **`us-east-1` (N. Virginia)** region.

1. Go to **AWS Certificate Manager (ACM)** in `us-east-1`.
2. Request a public certificate for:
   - `yourdomain.com`
   - `*.yourdomain.com`
3. Validation method: **DNS validation**.
4. In Route 53, click **Create records in Route 53** to automatically insert the CNAME verification records.
5. Within 2–5 minutes, status changes to **Issued**.

### 6.2 Configure Route 53 DNS Records
In your Route 53 Hosted Zone:
1. **Frontend**:
   - **Record name**: `yourdomain.com` (Apex) and `www.yourdomain.com` (or `app.yourdomain.com`).
   - **Type**: `A - Routes traffic to an IPv4 address and some AWS resources`.
   - **Alias**: Toggle ON.
   - **Route traffic to**: Alias to CloudFront distribution -> Select your CloudFront domain (`d1234.cloudfront.net`).
2. **Backend API**:
   - **Record name**: `api.yourdomain.com`.
   - **Type**: `A`.
   - **Alias**: Toggle ON.
   - **Route traffic to**: Alias to Application Load Balancer (or an `A` record pointing to your EC2 Elastic IP).

---

## Step 7: Production Environment Variables Checklist

### Backend Environment Variables (`pdf-json-backend/.env`)

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Application runtime environment | `production` |
| `PORT` | Listening HTTP port | `5000` |
| `DATABASE_URL` | RDS PostgreSQL connection string with SSL | `postgresql://user:pwd@db.host.rds.amazonaws.com:5432/pdfjson?schema=public&sslmode=require` |
| `JWT_SECRET` | Secret key for signing authentication JWTs | Generate with `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | JWT access token expiration duration | `7d` |
| `FRONTEND_URL` | Allowed origin for CORS & email links | `https://yourdomain.com` |
| `STORAGE_DRIVER` | File storage engine (`local` or `s3`) | `s3` |
| `AWS_REGION` | AWS region of your S3 storage bucket | `ap-south-1` (or `us-east-1`) |
| `S3_BUCKET_NAME` | Dedicated document bucket name | `pdfjson-documents-prod` |
| `AWS_ACCESS_KEY_ID` | IAM User Key (omit if using IAM Role) | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY`| IAM User Secret (omit if using IAM Role) | `wJalrXUtnFEMI...` |
| `RAZORPAY_KEY_ID` | Production Razorpay key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Production Razorpay key secret | `...` |
| `GOOGLE_CLIENT_ID` | Google Drive OAuth Client ID | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`| Google Drive OAuth Client Secret | `...` |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL | `https://api.yourdomain.com/api/v1/drive/callback` |

### Frontend Environment Variables (`pdf-json-frontend/.env.production`)

| Variable | Description | Production Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base endpoint | `https://api.yourdomain.com/api` |
| `VITE_APP_NAME` | Display name of the platform | `PDF to JSON SaaS` |
| `VITE_SUPPORT_EMAIL`| Customer support email address | `support@yourdomain.com` |

---

## Step 8: GitHub Actions CI/CD Pipeline

To automate zero-downtime deployments on push to `main`, add `.github/workflows/deploy.yml`:

```yaml
name: Deploy PDF-to-JSON SaaS to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    name: Build & Deploy Backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Log in to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and Push Docker Image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: pdf-json-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest ./pdf-json-backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS Service
        run: |
          aws ecs update-service --cluster pdfjson-cluster --service pdfjson-backend-service --force-new-deployment

  deploy-frontend:
    name: Build & Deploy Frontend to S3 + CloudFront
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: pdf-json-frontend/package-lock.json

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build Frontend
        working-directory: ./pdf-json-frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: |
          npm ci
          npm run build

      - name: Sync Files to S3 Bucket
        working-directory: ./pdf-json-frontend
        run: |
          aws s3 sync dist/ s3://${{ secrets.FRONTEND_S3_BUCKET }} --delete

      - name: Invalidate CloudFront Cache
        run: |
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} --paths "/*"
```

---

## Step 9: Backups, Logging, & Production Hardening

1. **RDS Automated Snapshots**:
   - Set retention period to **7 to 30 days**.
   - Enable automated minor version upgrades.
2. **CloudWatch Alarms**:
   - ALB Target 5xx error rate > 1%.
   - ECS / EC2 CPU utilization > 80% for 5 minutes.
   - RDS Storage Free Space < 5 GB.
3. **S3 Lifecycle Rules**:
   - For temporary uploaded PDFs: automatically transition to S3 Glacier after 90 days, or delete after customer retention limits expire.
4. **CORS Security**:
   - Never use `*` for `FRONTEND_URL` in production backend. Always bind strictly to `https://yourdomain.com`.

---

## Troubleshooting Common Issues

### 1. `PrismaClientInitializationError: Can't reach database server`
- **Cause**: Security group on RDS does not allow traffic from backend.
- **Fix**: Check `sg-rds` inbound rules. Ensure port 5432 is open to `sg-backend`. Verify RDS is inside the same VPC or accessible via public IP if configured.

### 2. React Router 404 on Page Refresh (CloudFront)
- **Cause**: S3 does not have physical files corresponding to client-side paths (`/app`, `/admin`).
- **Fix**: In CloudFront **Error pages**, create custom error responses mapping HTTP 403 and 404 to `/index.html` with HTTP 200.

### 3. S3 Document Upload 403 Forbidden
- **Cause**: IAM Role lacks `s3:PutObject` permission or Bucket CORS does not allow `PUT`/`POST` from the frontend domain.
- **Fix**: Review IAM Policy in Step 3.3 and S3 CORS settings in Step 3.2.

### 4. OpenSSL Error during Docker Backend Execution
- **Cause**: Prisma binary engine requires OpenSSL on Debian/Ubuntu slim distributions.
- **Fix**: The provided `pdf-json-backend/Dockerfile` already includes `apt-get install -y openssl`.

---

## Summary

Following this guide provisions a resilient, secure, and auto-scaling infrastructure on AWS tailored specifically for the **PDF-to-JSON SaaS Platform**.

For quick local or staging testing of all containers together before pushing to AWS, run:
```bash
docker-compose up --build
```
