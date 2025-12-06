#!/usr/bin/env python3
"""
setup_prepeet_structure.py
Creates the folder structure for the Prepeet project.
"""

import os

# Define the structure
structure = [
    "apps/web/src/app",
    "apps/web/src/components",
    "apps/web/src/lib",
    "apps/web/src/styles",
    "apps/web/public",
    "services/auth/app/api",
    "services/auth/app/core",
    "services/auth/app/db",
    "services/auth/app/models",
    "services/auth/app/schemas",
    "services/auth/app/services",
    "services/auth/app/auth",
    "services/auth/app/telemetry",
    "services/auth/migrations",
    "services/auth/tests",
    "services/user/app/api",
    "services/user/app/core",
    "services/user/app/db",
    "services/user/app/models",
    "services/user/app/schemas",
    "services/user/app/services",
    "services/user/app/telemetry",
    "services/interview/app/api",
    "services/interview/app/core",
    "services/interview/app/db",
    "services/interview/app/models",
    "services/interview/app/schemas",
    "services/interview/app/services",
    "services/interview/app/telemetry",
    "services/resume/app/api",
    "services/resume/app/core",
    "services/resume/app/db",
    "services/resume/app/models",
    "services/resume/app/schemas",
    "services/resume/app/services",
    "services/resume/app/telemetry",
    "services/app-review/app/api",
    "services/app-review/app/core",
    "services/app-review/app/db",
    "services/app-review/app/models",
    "services/app-review/app/schemas",
    "services/app-review/app/services",
    "services/app-review/app/telemetry",
    "services/worker/app/tasks",
    "services/worker/app/core",
    "services/worker/app/telemetry",
    "packages/py-prepeet-common/prepeet_common",
    "packages/ts-prepeet-ui/src",
    "gateway/nginx",
    "infra/compose/env",
    "infra/compose/scripts",
    "infra/k8s/base",
    "infra/k8s/overlays/dev",
    "infra/k8s/overlays/prod",
    "infra/helm/gateway",
    "infra/helm/web",
    "infra/helm/auth",
    "infra/helm/user",
    "infra/helm/interview",
    "infra/helm/resume",
    "infra/helm/app-review",
    "infra/helm/worker",
    "infra/helm/values",
    "infra/terraform/modules",
    "ops/grafana",
    "ops/prometheus",
    "ops/loki",
    "ops/otel",
    "docs/api",
    "docs/runbooks",
    ".github/workflows",
    "scripts",
]

def create_dirs():
    for path in structure:
        os.makedirs(path, exist_ok=True)
        print(f"Created: {path}")

def create_files():
    files = [
        "README.md",
        ".gitignore",
        "Makefile",
        ".env.example",
        "pre-commit-config.yaml",
        "scripts/dev-up.sh",
        "scripts/dev-down.sh",
        "scripts/gen-openapi.sh",
        "infra/compose/docker-compose.yml",
        "gateway/nginx/nginx.conf",
    ]
    for f in files:
        open(f, "a").close()
        print(f"Created file: {f}")

if __name__ == "__main__":
    print("Creating Prepeet folder structure...")
    create_dirs()
    create_files()
    print("\n Done! You can now 'git add .' and commit your initial project structure.")

