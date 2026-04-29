# Export ZIP Assessment Context

HTTP Cloud Function that exports ZIP-code assessment context for the reviewer
dashboard and owner widget.

The function writes:

```text
gs://musa5090s26-team1-public/configs/zip_assessment_context.json
```

The JSON includes ZIP-level record counts, approximate medians, and compact
official/model value bins using the same display scale as the citywide chart
assets.

## Environment Variables

- `PROJECT_ID`, default `musa5090s26-team1`
- `PUBLIC_BUCKET`, required
- `BQ_CORE_DATASET`, default `core`
- `BQ_DERIVED_DATASET`, default `derived`

## Deploy

```bash
gcloud functions deploy export-zip-assessment-context \
  --gen2 \
  --runtime=python312 \
  --region=us-east4 \
  --source=tasks/export_zip_assessment_context \
  --entry-point=export_zip_assessment_context \
  --trigger-http \
  --no-allow-unauthenticated \
  --set-env-vars PROJECT_ID=musa5090s26-team1,PUBLIC_BUCKET=musa5090s26-team1-public,BQ_CORE_DATASET=core,BQ_DERIVED_DATASET=derived
```

## Local Test

```bash
cd tasks/export_zip_assessment_context
python -m pip install -r requirements.txt
PUBLIC_BUCKET=musa5090s26-team1-public functions-framework \
  --target export_zip_assessment_context \
  --port 8080
```

In another terminal:

```bash
curl -X POST http://localhost:8080
```
