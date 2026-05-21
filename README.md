# DevOps CI/CD RoomieSync Project

This project demonstrates a complete, automated Continuous Integration and Continuous Deployment (CI/CD) pipeline using **Flask**, **Docker**, **Jenkins**, and **GitHub**.

The deployed application is **RoomieSync**—a sleek, practical, startup-like dashboard for roommates to manage shared expenses, divide rent, log bills, and assign chores.

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [RoomieSync App Features](#2-roomiesync-app-features)
3. [Technologies Used](#3-technologies-used)
4. [Folder Structure](#4-folder-structure)
5. [Step-by-Step Jenkins Setup](#5-step-by-step-jenkins-setup)
6. [Step-by-Step GitHub Integration](#6-step-by-step-github-integration)
7. [Pipeline Configuration in Jenkins](#7-pipeline-configuration-in-jenkins)
8. [Testing the Pipeline](#8-testing-the-pipeline)
9. [Common Errors & Troubleshooting](#9-common-errors--troubleshooting)
10. [Screenshots Section Placeholders](#10-screenshots-section-placeholders)

---

## 1. Project Overview & Architecture

Every time code is pushed to your GitHub repository, a webhook notifies Jenkins. Jenkins automatically pulls the latest changes, builds a new Docker image containing the updated Flask app, stops and removes the old container, and spins up the new container on port `5000` with zero manual intervention.

### Workflow Diagram

```text
+------------------+       Git Push       +------------------+
|                  | -------------------> |                  |
|  Local Machine   |                      |   GitHub Repo    |
|                  |                      |                  |
+------------------+                      +------------------+
                                                   |
                                                   | GitHub Webhook
                                                   v
+------------------------------------------------------------+
|                       Jenkins Server                       |
|                                                            |
|  1. Pulls Code  ==>  2. Builds Image  ==> 3. Deploys App   |
|                                                            |
+------------------------------------------------------------+
                                                   |
                                                   v
                                      +--------------------------+
                                      |      Docker Engine       |
                                      |                          |
                                      |  +--------------------+  |
                                      |  |  Running Container |  |
                                      |  |    (flask-app)     |  |
                                      |  |     Port: 5000     |  |
                                      |  +--------------------+  |
                                      +--------------------------+
```

---

## 2. RoomieSync App Features

* **Financial Debt Ledger**: Displays running balances for roommates ("Alex", "Sam", "Jamie"). Automatically calculates "who owes whom" when shared expenses are added.
* **Shared Expense Logger**: Logs purchases (amount, payer, splits) and adds them dynamically to a scrollable history log.
* **Chore Tracker**: List of chores featuring status check-toggles, assignees, due days, and an overall chores progress counter.
* **Bill Reminders**: Highlights upcoming household bills (e.g. WiFi, electricity) with "Mark Paid" buttons.
* **Split Rent Calculator**: Enter the total monthly rent, click "Split Rent", and view the calculated share for each roommate.
* **Startup Design Aesthetics**: Custom violet dark mode featuring Outfit and Plus Jakarta Sans typography, backdrop blur filters, and hover micro-animations.

---

## 3. Technologies Used

- **Flask (Python)**: Serve the frontend web pages and API backend routing.
- **Docker**: Containerization platform to package the application and its environment.
- **Docker Compose**: Orchestration configuration for local development.
- **Jenkins**: Automation server to control the CI/CD pipeline.
- **GitHub**: Source control manager and webhook trigger source.

---

## 4. Folder Structure

```text
devops-project/
│
├── app.py                  # Flask REST API endpoints and web server routes
├── requirements.txt        # Python package dependencies
├── Dockerfile              # Docker recipe to build our container image
├── docker-compose.yml      # Orchestration config for running the container locally
├── Jenkinsfile             # Declarative pipeline script for automation
├── .gitignore              # Rules for files Git should ignore
│
├── templates/
│   └── index.html          # HTML structure for RoomieSync dashboard
└── static/
    ├── style.css           # Premium startup-like glassmorphic styles
    └── app.js              # State manager and REST API communication scripts
```

---

## 5. Step-by-Step Jenkins Setup

To run a pipeline that interacts with Docker, Jenkins needs access to a Docker daemon. The easiest way to achieve this for a local demo is running Jenkins in Docker and sharing the host's Docker socket.

### Step 5.1: Run Jenkins in Docker

Open your terminal (PowerShell, Command Prompt, or Bash) and run the following command to start Jenkins:

```bash
docker run -d \
  -p 8080:8080 \
  -p 50000:50000 \
  --name jenkins \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -u root \
  jenkins/jenkins:lts
```

> [!NOTE]
> - `-v /var/run/docker.sock:/var/run/docker.sock` mounts the host's Docker engine socket inside the Jenkins container. This is what allows Jenkins to run `docker build` and `docker run` commands on your host system.
> - `-u root` runs the container as the root user. This is necessary to grant Jenkins permission to interact with the mounted Docker socket without throwing permission errors.

### Step 5.2: Retrieve Administrator Password

To unlock Jenkins, you need the initial administrator password:
1. Run this command in your terminal to see the logs:
   ```bash
   docker logs jenkins
   ```
2. Look for a long alphanumeric string (e.g., `4c6a9b8f...`) surrounded by asterisks. Copy it.
3. Open your browser and navigate to `http://localhost:8080`.
4. Paste the password and click **Continue**.

### Step 5.3: Complete Initial Setup

1. Click **Install suggested plugins**. This will install core components like Git, Pipeline, and Gradle.
2. Create your first admin user account and save the URL configuration.

### Step 5.4: Install Docker Pipeline Plugins

1. From the Jenkins dashboard, click **Manage Jenkins** in the left sidebar.
2. Select **Plugins** (or **Manage Plugins**).
3. Click the **Available plugins** tab.
4. Search for `Docker Pipeline` and select it.
5. Click **Install and restart** and restart Jenkins if prompted.

---

## 6. Step-by-Step GitHub Integration

For Jenkins to deploy your code, your project must reside in a public or private GitHub repository.

### Step 6.1: Create GitHub Repo & Push Code

1. Log into your GitHub account and click **New Repository**.
2. Name it `devops-project`, keep it public, and do **not** initialize it with a README.
3. Open your local terminal, navigate to your project directory `C:\Users\patil\.gemini\antigravity\scratch\devops-project` and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: RoomieSync application and pipeline config"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/devops-project.git
   git push -u origin main
   ```
   *(Make sure to replace `YOUR_GITHUB_USERNAME` with your actual username)*

### Step 6.2: Configure Webhook (For Auto-Triggering)

For Jenkins to automatically trigger when you push code:
1. Go to your GitHub repository webpage.
2. Click **Settings** -> **Webhooks** -> **Add webhook**.
3. Set **Payload URL** to: `http://<YOUR_JENKINS_IP>:8080/github-webhook/`
   > [!WARNING]
   > - If Jenkins is running on `localhost`, GitHub cannot reach it directly. You must use a tool like **ngrok** to create a public tunnel (e.g., `ngrok http 8080`), then use that public URL: `http://xxxx.ngrok-free.app/github-webhook/`.
   > - Make sure to include the trailing slash `/` at the end of the URL!
4. Set **Content type** to `application/json`.
5. Under "Which events would you like to trigger this webhook?", select **Just the push event**.
6. Click **Add webhook**.

---

## 7. Pipeline Configuration in Jenkins

### Step 7.1: Create Pipeline Job

1. Go to your Jenkins Dashboard at `http://localhost:8080`.
2. Click **New Item** on the left menu.
3. Enter name: `flask-cicd-pipeline`.
4. Select **Pipeline** and click **OK**.

### Step 7.2: Configure Build Triggers

1. Scroll down to the **Build Triggers** section.
2. Check the box for **GitHub hook trigger for GITScm polling**. This instructs Jenkins to listen to incoming GitHub webhook notifications.

### Step 7.3: Link Pipeline to Jenkinsfile

1. Scroll down to the **Pipeline** section.
2. Change **Definition** from *Pipeline script* to **Pipeline script from SCM**.
3. Set **SCM** to **Git**.
4. Enter your **Repository URL** (e.g., `https://github.com/YOUR_GITHUB_USERNAME/devops-project.git`).
5. Ensure the **Branch Specifier** matches your branch (e.g., `*/main`).
6. Ensure **Script Path** is set to `Jenkinsfile`.
7. Click **Save**.

---

## 8. Testing the Pipeline

### Manual Test
1. Inside your Jenkins pipeline project, click **Build Now** in the sidebar.
2. Click on the active build number under the "Build History" to inspect the console output.
3. Once completed successfully, open `http://localhost:5000` in your web browser. You should see your beautiful RoomieSync board.

### Automated Test (Trigger on Push)
1. Open the project in your editor and make a small modification. For example, open `templates/index.html` and modify the brand header:
   ```html
   <h1>RoomieSync</h1>
   ```
   to:
   ```html
   <h1>MyRoomieSync</h1>
   ```
2. Save and push your changes:
   ```bash
   git add templates/index.html
   git commit -m "Update RoomieSync header branding"
   git push origin main
   ```
3. Watch the Jenkins dashboard. Within a few seconds, a new build should start automatically.
4. When finished, refresh `http://localhost:5000` to see your new title header live on the board!

---

## 9. Common Errors & Troubleshooting

### Error 1: `docker: command not found`
* **Symptom**: Jenkins console logs show `docker build: command not found` in the build stage.
* **Fix**: Jenkins is running in an environment where Docker CLI is not installed. If you ran Jenkins using the command in Step 5.1, Docker command works because we used `jenkins/jenkins` and mounted the docker socket, but the container itself lacks the `docker` binary. 
  * Alternative Docker run with Docker installed (Docker-in-Docker setup) or install Docker client inside Jenkins:
    1. Enter Jenkins container: `docker exec -it -u 0 jenkins bash`
    2. Install docker client: 
       `curl https://get.docker.com/ | sh`
    3. Restart the Jenkins container.

### Error 2: `Permission Denied` on `/var/run/docker.sock`
* **Symptom**: Logs show `got permission denied while trying to connect to the Docker daemon socket`.
* **Fix**: The user running inside Jenkins container doesn't have permissions to write to the Docker socket. Ensure you started the container using `-u root` as explained in Step 5.1.

### Error 3: `Port 5000 already in use`
* **Symptom**: Pipeline fails in 'Run New Container' stage because port `5000` is already allocated.
* **Fix**: This happens if the container wasn't cleaned up properly. The `|| true` in Jenkinsfile stages ensures old containers are stopped and removed even if previous steps errored out, resetting the environment. Make sure no other local software (like another local Flask instance or macOS AirPlay receiver) is occupying port 5000.

---

## 10. Screenshots Section Placeholders

For your homework or lab reports, capture and insert screenshots in these locations:

1. **Jenkins Console Logs showing Success**:
   *(Insert screenshot showing all 5 stages in green status)*

2. **RoomieSync Dashboard Page Interface**:
   *(Insert screenshot of browser showing your beautifully styled `http://localhost:5000` loaded successfully)*

3. **Docker Desktop/CLI Container View**:
   *(Insert screenshot of running container `flask-app` in Docker Desktop)*
