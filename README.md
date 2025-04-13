# High Note

Our project allows users to create or join a session for their desired class. Got an upcoming test? Wanna compare notes with a friend? Join a session, submit your notes. High-Note takes the key concepts in your notes and compares them to the key concepts found in your classmate's notes.
High-Note will generate a "High Note" for you which is essentially your original note annotated with improved suggestions based on other key concepts found in class. 
 This application is built with FastAPI and utilizes MongoDB using a React Frontend for data storage and Google Generative AI for specific features.

**Current Python Requirement:** Python 3.10.10

---

## Table of Contents

* Prerequisites
* Setup Instructions
* Running the Application
* Usage

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

* **Python:** Version 3.10.10. You can download it from [python.org](https://www.python.org/). Verify your installation with `python --version` or `python3 --version`.
* **MongoDB:** A running MongoDB instance (local, Docker, or a cloud service like MongoDB Atlas). You will need the connection string.
* **Google Generative AI API Key:** Access to the Google Generative AI service and your API key. You can obtain this from the [Google AI documentation](https://ai.google.dev/).
* **Git:** Required for cloning the repository.

---

## Setup Instructions

Follow these steps to get your development environment set up:

### 1. Clone the Repository

Clone this project from its source repository. Replace `<repository-url>` with the actual URL.


   ```bash
   git clone <repository-url>
   cd <repository-directory>
```
### 2. Create and Activate Virtual Environment

It's highly recommended to use a virtual environment to manage project dependencies.

## Create the environment:

```bash
python -m venv venv
```
*On Windows, you might need to use `python` instead of `python3`.*

**Activate the environment:**

**macOS/Linux:**
```bash
source venv/bin/activate
```
**Windows (Command Prompt/PowerShell):**
```bash
.\venv\Scripts\activate
```
Your terminal prompt should now indicate that you are in the (venv) environment.

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```
### 4. Initialize System Environment Variables

Create a .env file at the root of your project. This file should include your configuration values. For example:
```bash
# MongoDB connection string
MONGODB_URI=mongodb://username:password@host:port/dbname

# Google Generative AI API Key
GOOGLE_API_KEY=your_google_api_key

# JWT settings (if using authentication)
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
### 5. **Download NLTK Data**

Since the project uses NLTK (e.g., for stopwords), ensure that the required datasets are downloaded. You can download the stopwords data with:
```bash
python -c "import nltk; nltk.download('stopwords')"
```

### 6. Running the Application

To start the application server, use Uvicorn. Assuming your main FastAPI application instance is named `app` and is located in `app/main.py`, run the following command. The `--reload` flag enables auto-reloading when code changes are detected, which is useful for development.

Assuming your main FastAPI application is defined in a module (for instance, app/main.py), start the server using Uvicorn:
```bash
uvicorn app.main:app --reload
```
### 7. Running the Frontend
```bash
cd frontend
```
Then install dependences
```bash
npm install
```
After successfully downloading the neccessary dependencies
```bash
npm start
```
