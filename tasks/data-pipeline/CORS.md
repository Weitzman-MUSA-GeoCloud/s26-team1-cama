# Public Bucket CORS

The frontend reads public dashboard assets directly from the team public GCS
bucket. Browser fetch requests need CORS enabled on that bucket so the UI can
load chart config JSON files and vector tiles.

This config applies to:

```text
gs://musa5090s26-team1-public
```

The frontend reads these public asset URL patterns:

```text
https://storage.googleapis.com/musa5090s26-team1-public/configs/tax_year_assessment_bins.json
https://storage.googleapis.com/musa5090s26-team1-public/configs/current_assessment_bins.json
https://storage.googleapis.com/musa5090s26-team1-public/tiles/properties/{z}/{x}/{y}.pbf
```

## Apply CORS

```bash
gcloud storage buckets update gs://musa5090s26-team1-public \
  --cors-file=tasks/data-pipeline/cors.json
```

## Verify CORS

```bash
gcloud storage buckets describe gs://musa5090s26-team1-public \
  --format="default(cors_config)"
```

This task only configures public bucket CORS. It does not update
`workflow.yaml`, Cloud Scheduler, Cloud Functions, Cloud Run jobs, frontend
code, or package files.
