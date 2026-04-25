# Data Pipeline Workflow Deployment

This workflow runs the weekly CAMA data pipeline for team 1:

1. Ingest OPA properties, OPA assessments, and PWD parcels in parallel.
2. Build model training / prediction input data.
3. Run the `predict-current-assessments` Cloud Run job.
4. Build and export chart configuration JSON files.
5. Export `property_tile_info.geojson`.
6. Run the `generate-property-map-tiles` Cloud Run job.

## Dependencies

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

It also expects these Cloud Run jobs:

- `predict-current-assessments`
- `generate-property-map-tiles`

The workflow service account needs permission to invoke the Cloud Functions,
run the Cloud Run jobs, read/write the project buckets, and submit BigQuery jobs.

## Safe To Commit

- `tasks/data-pipeline/workflow.yaml`
- `tasks/data-pipeline/DEPLOY.md`
- Cloud Function source files
- `.gcloudignore` files
- SQL templates and small scripts

## Do Not Commit

- Secrets, tokens, or service account key files
- `.env` files
- Local virtual environments
- Downloaded raw data
- Prepared data extracts
- Temporary output files
- `/tmp/function_urls.txt`

## Deploy Or Update The Workflow

```bash
export PROJECT_ID="musa5090s26-team1"
export REGION="us-east4"

gcloud config set project "${PROJECT_ID}"

gcloud workflows deploy data-pipeline \
  --location="${REGION}" \
  --source=tasks/data-pipeline/workflow.yaml
```

## Execute Manually

```bash
gcloud workflows run data-pipeline \
  --location="${REGION}"
```

To inspect the latest execution:

```bash
gcloud workflows executions list data-pipeline \
  --location="${REGION}" \
  --limit=5
```

## Weekly Scheduler Trigger

Create or update a weekly Cloud Scheduler job that starts the workflow:

```bash
export PROJECT_ID="musa5090s26-team1"
export REGION="us-east4"
export WORKFLOW_SA="data-pipeline-user@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud scheduler jobs create http data-pipeline-weekly \
  --location="${REGION}" \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://workflowexecutions.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/workflows/data-pipeline/executions" \
  --http-method=POST \
  --oauth-service-account-email="${WORKFLOW_SA}"
```

If the Scheduler job already exists, update it:

```bash
gcloud scheduler jobs update http data-pipeline-weekly \
  --location="${REGION}" \
  --schedule="0 6 * * 1" \
  --time-zone="America/New_York" \
  --uri="https://workflowexecutions.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/workflows/data-pipeline/executions" \
  --http-method=POST \
  --oauth-service-account-email="${WORKFLOW_SA}"
```

## Verify Outputs

Check chart config exports:

```bash
gcloud storage ls gs://musa5090s26-team1-public/configs/
```

Check property tile GeoJSON:

```bash
gcloud storage ls gs://musa5090s26-team1-temp_data/property_tile_info.geojson
```

Check generated vector tiles:

```bash
gcloud storage ls gs://musa5090s26-team1-public/tiles/properties/ --recursive | head
```

Check Cloud Run job executions:

```bash
gcloud run jobs executions list \
  --job=predict-current-assessments \
  --region="${REGION}"

gcloud run jobs executions list \
  --job=generate-property-map-tiles \
  --region="${REGION}"
```
