# Data Pipeline Workflow Deployment

This workflow runs the weekly CAMA data pipeline for team 1. It ingests source
files, loads core tables, builds derived tables, runs the current assessment
prediction job, exports dashboard configuration files, and generates property
map vector tiles.

## Required Cloud Functions

The workflow expects these HTTP Cloud Functions to exist in project
`musa5090s26-team1` and region `us-east4`:

- `extract-opa-properties`
- `prepare-opa-properties`
- `load-opa-properties`
- `extract-opa-assessments`
- `prepare-opa-assessments`
- `load-opa-assessments`
- `extract-pwd-parcels`
- `prepare-pwd-parcels`
- `load-pwd-parcels`
- `transform-model-training-data`
- `transform-tax-year-assessment-bins`
- `transform-current-assessment-bins`
- `export-tax-year-assessment-bins`
- `export-current-assessment-bins`
- `export-property-tile-info`
- `export-map-style-metadata`

## Required Cloud Run Jobs

The workflow uses only these Cloud Run jobs in `us-east4`:

- `predict-current-assessments`
- `generate-property-map-tiles`

## CORS

CORS for the public bucket is configured separately using
`tasks/data-pipeline/CORS.md`. Do not mix CORS setup into the workflow deploy
steps.

## Service Account and IAM

Use this service account for the workflow and Scheduler trigger:

```bash
export PROJECT_ID="musa5090s26-team1"
export REGION="us-east4"
export SA="data-pipeline-user@${PROJECT_ID}.iam.gserviceaccount.com"
```

Check whether the service account exists:

```bash
gcloud iam service-accounts describe "$SA" \
  --project="$PROJECT_ID"
```

Create it if needed:

```bash
gcloud iam service-accounts create data-pipeline-user \
  --display-name="Data Pipeline Workflow User" \
  --project="$PROJECT_ID"
```

Grant the minimal IAM roles needed for this workflow setup:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" \
  --role="roles/workflows.invoker"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA}" \
  --role="roles/run.invoker"
```

If the workflow service account lacks permission to execute Cloud Run jobs
during deployment or testing, grant the narrowest additional role needed.

## Safe To Commit

- `tasks/data-pipeline/workflow.yaml`
- `tasks/data-pipeline/DEPLOY.md`
- Small deployment documentation updates

## Do Not Commit

- `/tmp/function_urls.txt`
- `.env`
- `.venv/`
- `env/`
- Service account keys
- Secrets or tokens
- Raw or prepared data files
- Generated JSON outputs

## Deploy Or Update The Workflow

```bash
gcloud workflows deploy data-pipeline \
  --source=tasks/data-pipeline/workflow.yaml \
  --location=us-east4 \
  --project=musa5090s26-team1 \
  --service-account="data-pipeline-user@musa5090s26-team1.iam.gserviceaccount.com"
```

## Deploy A Test Workflow

```bash
gcloud workflows deploy data-pipeline-test \
  --source=tasks/data-pipeline/workflow.yaml \
  --location=us-east4 \
  --project=musa5090s26-team1 \
  --service-account="data-pipeline-user@musa5090s26-team1.iam.gserviceaccount.com"
```

## Run The Test Workflow Manually

```bash
gcloud workflows run data-pipeline-test \
  --location=us-east4 \
  --project=musa5090s26-team1
```

## List Recent Test Executions

```bash
gcloud workflows executions list data-pipeline-test \
  --location=us-east4 \
  --project=musa5090s26-team1 \
  --limit=5
```

## Weekly Cloud Scheduler Trigger

Create or update the weekly Cloud Scheduler trigger only after the test workflow
has run successfully. Suggested schedule: Monday at 6:00 AM America/New_York.

```bash
gcloud scheduler jobs create http data-pipeline-weekly \
  --location=us-east4 \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://workflowexecutions.googleapis.com/v1/projects/musa5090s26-team1/locations/us-east4/workflows/data-pipeline/executions" \
  --http-method=POST \
  --message-body="{}" \
  --headers="Content-Type=application/json" \
  --oauth-service-account-email="data-pipeline-user@musa5090s26-team1.iam.gserviceaccount.com"
```

If the Scheduler job already exists, update it after testing succeeds:

```bash
gcloud scheduler jobs update http data-pipeline-weekly \
  --location=us-east4 \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://workflowexecutions.googleapis.com/v1/projects/musa5090s26-team1/locations/us-east4/workflows/data-pipeline/executions" \
  --http-method=POST \
  --message-body="{}" \
  --headers="Content-Type=application/json" \
  --oauth-service-account-email="data-pipeline-user@musa5090s26-team1.iam.gserviceaccount.com"
```

## Verification Checklist

BigQuery derived tables:

- `derived.current_assessments`
- `derived.current_assessment_bins`
- `derived.tax_year_assessment_bins`

GCS config outputs:

- `gs://musa5090s26-team1-public/configs/current_assessment_bins.json`
- `gs://musa5090s26-team1-public/configs/tax_year_assessment_bins.json`
- `gs://musa5090s26-team1-public/configs/map_style_metadata.json`

GCS tile outputs:

- `gs://musa5090s26-team1-public/tiles/properties/`

Frontend public URLs:

- `https://storage.googleapis.com/musa5090s26-team1-public/configs/current_assessment_bins.json`
- `https://storage.googleapis.com/musa5090s26-team1-public/configs/tax_year_assessment_bins.json`
- `https://storage.googleapis.com/musa5090s26-team1-public/configs/map_style_metadata.json`
- `https://storage.googleapis.com/musa5090s26-team1-public/tiles/properties/{z}/{x}/{y}.pbf`

Cloud Run job executions:

```bash
gcloud run jobs executions list \
  --job=predict-current-assessments \
  --region=us-east4 \
  --project=musa5090s26-team1

gcloud run jobs executions list \
  --job=generate-property-map-tiles \
  --region=us-east4 \
  --project=musa5090s26-team1
```
