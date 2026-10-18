# StudyBuddy — AI-Powered Learning Assistant

**An intelligent, privacy-first learning companion that helps students understand mathematics through guided reasoning, contextual explanations, and AI-powered assistance.**

<p align="center">
  <strong>Offline AI · Personalized Learning · Privacy by Design</strong>
</p>

---

## 📌 Overview

**StudyBuddy** is an AI-powered educational application developed to make mathematics more accessible, interactive, and understandable for students.

Rather than simply providing final answers, StudyBuddy aims to guide students through mathematical problems, encourage structured reasoning, and help them develop a deeper understanding of the concepts they learn.

Traditional AI tutoring solutions often rely on cloud-based services, which may introduce privacy concerns, recurring API costs, and internet connectivity requirements. StudyBuddy explores an alternative approach by running AI models locally, providing a more private and accessible learning experience.

The application combines **Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), few-shot learning, and visual understanding** to support interactive mathematics learning while operating within limited hardware resources.

Developed as a graduation project at the **Egypt-Japan University of Science and Technology (E-JUST)**, StudyBuddy brings together artificial intelligence, software engineering, and educational technology to address a meaningful learning challenge.

## 🎯 The Problem We Address

Students often struggle with mathematics not only because of the difficulty of the concepts, but also because they lack access to personalized explanations and guided practice.

Existing AI-powered educational tools can present additional challenges:

- Dependence on internet connectivity and external AI services.
- Privacy concerns when educational data is processed by third-party platforms.
- Recurring costs associated with cloud-based model inference.
- Responses that provide answers without sufficiently guiding the student's reasoning.
- Difficulty interpreting visual information, such as mathematical diagrams.

StudyBuddy explores how locally running AI models and retrieval-based techniques can help address these challenges.

## 💡 Our Solution

StudyBuddy provides a local AI tutoring environment designed to support students throughout the problem-solving process.

Its approach combines:

- **Local AI inference** to reduce dependence on external AI APIs.
- **Retrieval-Augmented Generation (RAG)** to provide relevant educational context.
- **Few-shot learning** to encourage structured, guided explanations.
- **Visual AI capabilities** to support diagram-related understanding.
- **A desktop application** that integrates the learning interface with backend services and AI components.
- **Student and teacher roles** to support educational workflows.

The goal is to make AI-assisted learning more private, accessible, and focused on understanding rather than memorization.

## ✨ Key Features

### 🤖 AI-Powered Mathematics Tutoring
Provides AI-assisted explanations and problem-solving support to help students understand mathematical concepts.

### 🧠 Guided Reasoning
Uses structured examples and prompting techniques to encourage step-by-step explanations and meaningful learning.

### 📚 Retrieval-Augmented Generation (RAG)
Retrieves relevant information from educational resources and incorporates it into the model's context to support more grounded responses.

### 🔒 Privacy-Focused Local AI
Runs language-model inference locally, reducing the need to send student questions to external AI inference services.

### 📴 Offline-Oriented Architecture
Reduces dependence on cloud-based AI services. Internet access may still be needed for initial setup, downloading dependencies, or obtaining model files.

### 🖼️ Diagram Understanding
Integrates Florence-2 to support visual understanding of diagrams and image-based educational content.

### 👩‍🏫 Student and Teacher Roles
Includes role-based authentication and educational workflows for students and teachers.

### 📝 Worksheet Management
Supports worksheet-related workflows for organizing and delivering educational materials.

### 🌍 Arabic and English Support
Provides a bilingual interface designed to support both right-to-left (RTL) Arabic and left-to-right (LTR) English layouts.

### ⚡ Resource-Efficient Inference
Uses model quantization techniques to make local language-model inference more practical on hardware with limited memory.

## 🏗️ System Architecture

StudyBuddy follows a modular architecture that separates the desktop interface, backend services, database, and AI components.

```text
                         StudyBuddy
                              |
                    Desktop Application
                              |
                   Electron + React + Vite
                              |
                        FastAPI Backend
                              |
             +----------------+----------------+
             |                |                |
       Authentication     Data Layer       AI Pipeline
             |                |                |
          JWT Auth      SQLite + SQLAlchemy    RAG
                                               |
                                      Context Retrieval
                                               |
                                      Prompt Construction
                                               |
                                      Local LLM Inference
                                               |
                                         Mistral-7B

                              |
                       Visual AI Support
                              |
                          Florence-2
```

### Architecture Components

**1. Frontend**

The frontend provides the desktop user interface and manages user interactions.

- Electron
- React
- Vite
- Tailwind CSS
- Zustand

**2. Backend**

The backend manages application services, API communication, authentication, and data persistence.

- Python
- FastAPI
- SQLAlchemy
- SQLite
- JSON Web Tokens (JWT)

**3. AI and Machine Learning**

The AI layer integrates language-model inference and supporting AI techniques.

- Mistral-7B
- NF4 quantization
- GGUF Q4_K_M model format
- `ctransformers` and `llama.cpp`-based tooling
- Retrieval-Augmented Generation (RAG)
- Few-shot prompting
- Florence-2 for visual understanding

## 🧠 AI Methodology

StudyBuddy combines several AI techniques to improve the practicality and educational usefulness of local AI tutoring.

### 1. Large Language Models (LLMs)

The project uses Mistral-7B to generate natural-language explanations and support mathematical problem-solving.

The model is quantized to reduce memory requirements and enable local inference on compatible hardware.

### 2. Model Quantization

Quantization reduces the memory footprint of a model by representing its parameters using lower-precision formats.

StudyBuddy explores two relevant configurations:

- **NF4:** Used in the project's memory-efficient model configuration.
- **GGUF Q4_K_M:** Used for local model inference through compatible tooling.

These configurations support the project's goal of running AI models within a limited GPU memory budget.

### 3. Retrieval-Augmented Generation (RAG)

RAG combines information retrieval with language-model generation.

The pipeline retrieves relevant educational context and incorporates it into the prompt before the model generates its response.

This approach helps connect generated explanations to relevant learning materials.

### 4. Few-Shot Learning

Few-shot prompting provides the model with examples of desired responses.

In StudyBuddy, this technique helps guide the structure and presentation of explanations, supporting a more consistent tutoring experience.

### 5. Visual Understanding

Florence-2 provides visual AI capabilities for processing diagrams and other image-based content, extending the application's potential beyond text-only interactions.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Desktop Application | Electron |
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT |
| Language Model | Mistral-7B |
| Quantization | NF4, GGUF Q4_K_M |
| Local Inference | `ctransformers`, `llama.cpp`-based tooling |
| AI Techniques | RAG, Few-Shot Learning |
| Visual AI | Florence-2 |
| Version Control | Git, GitHub |

## 📊 Performance and Evaluation

StudyBuddy was evaluated with a focus on inference efficiency, reasoning performance, retrieval quality, and operational cost.

| Evaluation Metric | Reported Result |
|---|---:|
| Peak VRAM Usage | 5.97 GB |
| Median Inference Time | 3.25 seconds |
| Reasoning Evaluation | 40% → 100% |
| RAG Recall@5 | 85% |
| Generations Evaluated | 5,920+ |
| Cost Reduction | 92% |
| Latency Reduction | 47% |

These figures represent the project's reported evaluation results. Improvements depend on the evaluation methodology, baseline configuration, hardware, and tested workloads; they should not be interpreted as universal performance guarantees.

## 📂 Project Structure

```text
app/
├── backend/       # Backend services, API, and data handling
├── frontend/      # Desktop application interface
├── models/        # AI model resources
└── README.md      # Project documentation
```

## 🚀 Getting Started

### Prerequisites

Before running StudyBuddy, ensure that your development environment includes:

- Git
- Node.js and npm
- Python and pip
- The dependencies required by the frontend and backend
- The required local AI model files
- Compatible hardware with sufficient available memory and disk space

### 1. Clone the Repository

```bash
git clone https://github.com/Sohyla03Said/app.git
cd app
```

### 2. Install Dependencies

Install the frontend and backend dependencies using the package and dependency files available in their respective directories.

For example, if the frontend contains a `package.json`:

```bash
cd frontend
npm install
```

For a Python backend with a `requirements.txt` file:

```bash
cd backend
pip install -r requirements.txt
```

The commands above assume those files exist in the specified directories.

### 3. Configure the Environment

Configure any environment variables required by the application, including database settings, authentication secrets, and local model paths.

Do not commit credentials, private keys, or production secrets to version control.

### 4. Configure the AI Models

Ensure that the required model files are available in the locations expected by the backend.

Model configuration may depend on the selected inference engine, quantization format, and available hardware.

### 5. Run the Application

Start the backend and frontend according to the scripts and configuration files provided in the repository.

The exact commands depend on the current project configuration and should be verified against the actual source files.

## 🔐 Privacy and Security

Privacy is one of the central design considerations behind StudyBuddy.

- Local model inference reduces reliance on third-party AI inference APIs.
- SQLite supports local data persistence.
- JWT-based authentication supports protected application workflows.
- A local-first design can reduce the amount of educational information transmitted to external services.

Local inference alone does not guarantee complete application privacy. Data handling, authentication, logging, backups, and any external integrations must also be considered.

## 🔮 Future Improvements

Potential directions for further development include:

- Expanding support for mathematical topics and educational resources.
- Improving mathematical expression recognition and diagram interpretation.
- Enhancing adaptive tutoring based on student performance.
- Introducing detailed learning progress tracking and analytics.
- Improving the evaluation of mathematical correctness and explanation quality.
- Expanding testing across different hardware configurations.
- Refining teacher workflows and worksheet management.

## 🎓 Academic Project

StudyBuddy was developed as a graduation project at the **Egypt-Japan University of Science and Technology (E-JUST)**.

The project combines software engineering, artificial intelligence, natural language processing, and educational technology to investigate how locally deployed AI can support more accessible and privacy-conscious learning experiences.

## 👥 Team & Acknowledgments

We were delighted to collaborate on StudyBuddy, combining our knowledge, skills, and ideas to develop an AI-powered learning solution.

**Project Team**

- [**Menna Hamed**](https://www.linkedin.com/in/menna-hamed-816593294/)
- [**Wesam ElRaghy 🇵🇸**](https://www.linkedin.com/in/wesam-elraghy/)
- [**Zahraa Selim**](https://www.linkedin.com/in/zahraa-selim/)
- [**Sohyla Abd Elwahed**](https://www.linkedin.com/in/sohyla-abd-elwahed/)

We would like to express our sincere gratitude to **Dr. Rami Zewail, CSE Department Chairperson at E-JUST**, for his supervision and support throughout our graduation project.

Working together on StudyBuddy was a valuable academic and technical experience that allowed us to explore practical applications of AI, overcome software development challenges, and apply our engineering knowledge to an educational problem.

## 👩‍💻 Author

**Sohyla Abd Elwahed**

Computer Engineering Graduate | Software Engineering | AI & Application Development

- GitHub: [@Sohyla03Said](https://github.com/Sohyla03Said)
- LinkedIn: [Sohyla Abd Elwahed](https://www.linkedin.com/in/sohyla-abd-elwahed/)

---

<p align="center">
  <strong>StudyBuddy</strong><br/>
  Making AI-powered learning more accessible, private, and meaningful.
</p>
