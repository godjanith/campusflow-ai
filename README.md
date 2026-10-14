# CampusFlow AI 🚀
> **AI-Powered Campus Operations & Incident Resolution Platform**  
> Developed for MERNOVA X 2026 | Presidency School of Information Science, Presidency University, Bengaluru

[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Flutter-blue.svg)](#technology-stack)
[![Realtime](https://img.shields.io/badge/Sync-Socket.io-green.svg)](#architecture)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

---

## 📌 Problem Statement
In modern educational institutions, managing campus infrastructure, facility maintenance, and administrative incident resolution efficiently remains a critical challenge due to fragmented communication channels and delayed response workflows. **CampusFlow AI** bridges this gap by unifying student/staff reporting and administrative oversight into a seamless, real-time ecosystem.

---

## ✨ Key Features

### 📱 Flutter Mobile App (Student & Staff)
- **Instant Reporting**: On-the-go submission of campus issues with intuitive UI.
- **Hardware Integration**: GPS location tagging and camera photo attachment support.
- **Smart AI Categorization**: Automatic classification and severity assignment via NLP upon submission.
- **Real-Time Push Updates**: Instant status notifications on ticket progress.

### 💻 MERN Web Dashboard (Admin & Operations)
- **Live Operations Dashboard**: Comprehensive view of active, critical, and resolved tickets.
- **Zero-Refresh Real-Time Sync**: Powered by WebSockets (`Socket.io`) for instantaneous updates when issues are submitted on mobile.
- **Role-Based Access Control (RBAC)**: Secure JWT authentication separating regular users and administrative staff.
- **Status Workflows**: One-click resolution and team assignment controls.

---

## 🏗 System Architecture

```text
  ┌───────────────────────┐             ┌───────────────────────┐
  │   React Web Client    │             │  Flutter Mobile App   │
  │    (MERN Admin)       │             │   (Student / Staff)   │
  └───────────┬───────────┘             └───────────┬───────────┘
              │                                     │
              │ REST API / WebSockets (Socket.io)   │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Node.js + Express   │
                     │       REST API        │
                     └───────────┬───────────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                     ▼                       ▼
            ┌─────────────────┐     ┌─────────────────┐
            │  MongoDB Atlas  │     │   AI Engine     │
            │ (Shared DB)     │     │ (Auto-Severity) │
            └─────────────────┘     └─────────────────┘